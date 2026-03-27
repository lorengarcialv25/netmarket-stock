"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { dypai } from "@/lib/dypai";
import { PageLoader } from "@/components/ui/Spinner";
import { useWarehouse } from "@/hooks/useWarehouse";
import { cn } from "@/lib/utils";
import { mergeSeriesToChartData } from "@/lib/dashboardUtils";
import {
  type ChartRangePreset,
  resolveMovementsSeries,
  describeChartRange,
  rollingDaysRange,
} from "@/lib/metricsDateRange";
import { DashboardStats } from "./DashboardStats";
import { DashboardToolbar } from "./DashboardToolbar";
import { DashboardMovementsChart } from "./DashboardMovementsChart";
import { MetricsCategoryPieChart } from "./MetricsCategoryPieChart";
import {
  MetricsBreakdownTable,
  addSharePercent,
  type BreakdownRow,
} from "./MetricsBreakdownTable";

interface DashboardStatsData {
  total_products: number;
  total_warehouses: number;
  total_stock_value: number;
  low_stock_count: number;
}

function num(v: unknown): number {
  if (v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function MetricsDashboard() {
  const { warehouses, loading: warehousesLoading } = useWarehouse();

  const [warehouseScope, setWarehouseScope] = useState<"all" | string>("all");
  const [rangePreset, setRangePreset] = useState<ChartRangePreset>("6m");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");

  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [chartPoints, setChartPoints] = useState<
    { date: string; entries: number; exits: number; label: string }[]
  >([]);

  const [byCategory, setByCategory] = useState<BreakdownRow[]>([]);
  const [bySupplier, setBySupplier] = useState<BreakdownRow[]>([]);
  const [byProductType, setByProductType] = useState<BreakdownRow[]>([]);

  const [isFetching, setIsFetching] = useState(false);

  const showAllOption = warehouses.length > 1;

  useEffect(() => {
    if (warehouses.length === 1) {
      setWarehouseScope(warehouses[0].id);
    }
  }, [warehouses]);

  const warehouseParams = useMemo(() => {
    if (warehouses.length === 1) {
      return { warehouse_id: warehouses[0].id };
    }
    if (warehouseScope === "all") return {};
    return { warehouse_id: warehouseScope };
  }, [warehouseScope, warehouses]);

  const scopeLabel = useMemo(() => {
    if (warehouses.length === 1) return warehouses[0].name;
    if (warehouseScope === "all") return "Todos los almacenes";
    const w = warehouses.find((x) => x.id === warehouseScope);
    return w?.name ?? "Almacén";
  }, [warehouseScope, warehouses]);

  const handleRangePresetChange = useCallback((p: ChartRangePreset) => {
    setRangePreset(p);
    if (p === "custom") {
      const { from, to } = rollingDaysRange(30);
      setCustomDateFrom(from);
      setCustomDateTo(to);
    }
  }, []);

  const handleCustomDatesChange = useCallback((from: string, to: string) => {
    setCustomDateFrom(from);
    setCustomDateTo(to);
  }, []);

  const seriesResolved = useMemo(
    () => resolveMovementsSeries(rangePreset, customDateFrom, customDateTo),
    [rangePreset, customDateFrom, customDateTo]
  );

  const periodDescription = useMemo(
    () => describeChartRange(rangePreset, customDateFrom, customDateTo),
    [rangePreset, customDateFrom, customDateTo]
  );

  const fetchMetrics = useCallback(async () => {
    if (warehousesLoading) return;
    if (warehouses.length === 0) {
      setStats(null);
      setChartPoints([]);
      setByCategory([]);
      setBySupplier([]);
      setByProductType([]);
      return;
    }

    setIsFetching(true);
    try {
      const [
        statsRes,
        seriesRes,
        catRes,
        supRes,
        typeRes,
      ] = await Promise.all([
        dypai.api.get("dashboard_stats", { params: warehouseParams }),
        dypai.api.get("dashboard_movements_series", {
          params: { ...seriesResolved.apiParams, ...warehouseParams },
        }),
        dypai.api.get("dashboard_metrics_by_category", {
          params: warehouseParams,
        }),
        dypai.api.get("dashboard_metrics_by_supplier", {
          params: warehouseParams,
        }),
        dypai.api.get("dashboard_metrics_by_product_type", {
          params: warehouseParams,
        }),
      ]);

      if (statsRes.data && Array.isArray(statsRes.data) && statsRes.data[0]) {
        const r = statsRes.data[0] as Record<string, unknown>;
        setStats({
          total_products: num(r.total_products),
          total_warehouses: num(r.total_warehouses),
          total_stock_value: num(r.total_stock_value),
          low_stock_count: num(r.low_stock_count),
        });
      } else {
        setStats(null);
      }

      if (seriesRes.data && Array.isArray(seriesRes.data)) {
        setChartPoints(
          mergeSeriesToChartData(
            seriesRes.data as {
              day: string;
              entries: number | string;
              exits: number | string;
            }[],
            seriesResolved.merge
          )
        );
      } else {
        setChartPoints([]);
      }

      if (catRes.data && Array.isArray(catRes.data)) {
        const raw = catRes.data.map((row: Record<string, unknown>) => ({
          name: String(row.category_name ?? ""),
          product_count: num(row.product_count),
          stock_value: num(row.stock_value),
        }));
        setByCategory(addSharePercent(raw));
      } else {
        setByCategory([]);
      }

      if (supRes.data && Array.isArray(supRes.data)) {
        const raw = supRes.data.map((row: Record<string, unknown>) => ({
          name: String(row.supplier_name ?? ""),
          product_count: num(row.product_count),
          stock_value: num(row.stock_value),
        }));
        setBySupplier(addSharePercent(raw));
      } else {
        setBySupplier([]);
      }

      if (typeRes.data && Array.isArray(typeRes.data)) {
        const raw = typeRes.data.map((row: Record<string, unknown>) => ({
          name: String(row.type_label ?? row.product_type ?? ""),
          product_count: num(row.product_count),
          stock_value: num(row.stock_value),
        }));
        setByProductType(addSharePercent(raw));
      } else {
        setByProductType([]);
      }
    } catch (error) {
      console.error("Error fetching metrics:", error);
    } finally {
      setIsFetching(false);
    }
  }, [warehousesLoading, warehouses, warehouseParams, seriesResolved]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  if (warehousesLoading) {
    return <PageLoader label="Cargando métricas..." />;
  }

  const toolbarWarehouseScope =
    warehouses.length === 1 ? warehouses[0].id : warehouseScope;

  const productLabel =
    warehouseScope === "all" && warehouses.length !== 1
      ? "Total productos (catálogo)"
      : "SKUs con stock en almacén";

  const filterHint =
    warehouseScope === "all" && warehouses.length !== 1
      ? "Valores ponderados por todo el inventario."
      : "Valores del inventario en el almacén seleccionado.";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Métricas y estadísticas
        </h1>
        <p className="text-muted-foreground mt-1">
          Tendencias de movimientos y distribución del valor por categoría,
          proveedor y tipo de producto
          <span className="text-foreground font-medium">
            {" "}
            — {scopeLabel}
          </span>
        </p>
      </div>

      <DashboardToolbar
        warehouseScope={toolbarWarehouseScope}
        onWarehouseScopeChange={setWarehouseScope}
        warehouses={warehouses}
        showAllWarehousesOption={showAllOption}
        rangePreset={rangePreset}
        onRangePresetChange={handleRangePresetChange}
        customDateFrom={customDateFrom}
        customDateTo={customDateTo}
        onCustomDatesChange={handleCustomDatesChange}
        disabled={isFetching}
      />

      <div
        className={cn(
          "flex flex-col gap-6 transition-opacity duration-200",
          isFetching && "opacity-60 pointer-events-none"
        )}
      >
        {stats === null && warehouses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tienes almacenes asignados. Contacta con un administrador.
          </p>
        ) : (
          <>
            <DashboardStats stats={stats} productLabel={productLabel} />

            <DashboardMovementsChart
              data={chartPoints}
              loading={isFetching && chartPoints.length === 0}
              periodLabel={periodDescription}
            />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:items-start">
              <div className="min-w-0">
                <MetricsCategoryPieChart
                  rows={byCategory}
                  loading={isFetching && byCategory.length === 0}
                />
              </div>
              <div className="min-w-0">
                <MetricsBreakdownTable
                  title="Inventario por categoría"
                  description="Productos activos y valor a precio de compra."
                  nameColumnLabel="Categoría"
                  rows={byCategory}
                  loading={isFetching && byCategory.length === 0}
                  paginationPageSize={10}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">{filterHint}</p>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <MetricsBreakdownTable
                title="Inventario por proveedor"
                description="Mismo criterio de valoración."
                nameColumnLabel="Proveedor"
                rows={bySupplier}
                loading={isFetching && bySupplier.length === 0}
              />
              <MetricsBreakdownTable
                title="Por tipo de producto"
                description="Producto final frente a materia prima."
                nameColumnLabel="Tipo"
                rows={byProductType}
                loading={isFetching && byProductType.length === 0}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
