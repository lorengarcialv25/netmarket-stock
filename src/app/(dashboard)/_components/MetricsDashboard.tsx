"use client";

import { useEffect, useState, useCallback } from "react";
import { dypai } from "@/lib/dypai";
import { PageLoader } from "@/components/ui/Spinner";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  PackageX,
  Calendar,
  Factory,
  AlertTriangle,
} from "lucide-react";

// ---- Types ----

interface StagnantItem {
  product_id: string;
  sku: string;
  product_name: string;
  product_type: string;
  warehouse_name: string;
  quantity: number;
  stagnant_value: number;
  last_exit_date: string | null;
  days_without_exit: number;
}

interface ProductionCapacity {
  finished_id: string;
  finished_sku: string;
  finished_name: string;
  finished_stock: number;
  sale_price: number;
  max_producible: number;
  bottleneck_material: string;
  bottleneck_sku: string;
  bottleneck_stock: number;
  bottleneck_qty_needed: number;
  materials_count: number;
  potential_revenue: number;
}

const DAY_OPTIONS = [
  { value: "7", label: "7 dias" },
  { value: "30", label: "30 dias" },
  { value: "60", label: "60 dias" },
  { value: "90", label: "90 dias" },
  { value: "180", label: "180 dias" },
];

function num(v: unknown): number {
  if (v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function MetricsDashboard() {
  const [stagnant, setStagnant] = useState<StagnantItem[]>([]);
  const [capacity, setCapacity] = useState<ProductionCapacity[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysFilter, setDaysFilter] = useState("30");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [stagnantRes, capacityRes] = await Promise.all([
        dypai.api.get("metrics_stagnant_inventory", { params: { days: daysFilter } }),
        dypai.api.get("metrics_production_capacity"),
      ]);

      if (stagnantRes.data && Array.isArray(stagnantRes.data)) {
        setStagnant(
          stagnantRes.data.map((r: Record<string, unknown>) => ({
            product_id: String(r.product_id),
            sku: String(r.sku ?? ""),
            product_name: String(r.product_name ?? ""),
            product_type: String(r.product_type ?? ""),
            warehouse_name: String(r.warehouse_name ?? ""),
            quantity: num(r.quantity),
            stagnant_value: num(r.stagnant_value),
            last_exit_date: r.last_exit_date ? String(r.last_exit_date) : null,
            days_without_exit: num(r.days_without_exit),
          }))
        );
      }

      if (capacityRes.data && Array.isArray(capacityRes.data)) {
        setCapacity(
          capacityRes.data.map((r: Record<string, unknown>) => ({
            finished_id: String(r.finished_id),
            finished_sku: String(r.finished_sku ?? ""),
            finished_name: String(r.finished_name ?? ""),
            finished_stock: num(r.finished_stock),
            sale_price: num(r.sale_price),
            max_producible: num(r.max_producible),
            bottleneck_material: String(r.bottleneck_material ?? ""),
            bottleneck_sku: String(r.bottleneck_sku ?? ""),
            bottleneck_stock: num(r.bottleneck_stock),
            bottleneck_qty_needed: num(r.bottleneck_qty_needed),
            materials_count: num(r.materials_count),
            potential_revenue: num(r.potential_revenue),
          }))
        );
      }
    } catch (e) {
      console.error("Error fetching metrics:", e);
    } finally {
      setLoading(false);
    }
  }, [daysFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && stagnant.length === 0) {
    return <PageLoader label="Cargando metricas..." />;
  }

  // KPIs
  const totalStagnantValue = stagnant.reduce((s, i) => s + i.stagnant_value, 0);
  const stagnantCount = stagnant.length;
  const blockedProducts = capacity.filter((c) => c.max_producible === 0);
  const canProduce = capacity.filter((c) => c.max_producible > 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Metricas de inventario</h1>
        <p className="text-muted-foreground mt-1">
          Inventario estacionado sin rotacion y capacidad de produccion segun materias primas disponibles
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<PackageX size={20} />}
          iconColor="text-orange-500"
          label="Valor estacionado"
          value={formatCurrency(totalStagnantValue)}
          sub={`${stagnantCount} producto${stagnantCount !== 1 ? "s" : ""} sin rotacion`}
        />
        <KpiCard
          icon={<Calendar size={20} />}
          iconColor="text-red-500"
          label="Sin rotacion"
          value={String(stagnantCount)}
          sub={`Mas de ${daysFilter} dias sin salidas`}
        />
        <KpiCard
          icon={<AlertTriangle size={20} />}
          iconColor="text-red-500"
          label="No se pueden fabricar"
          value={String(blockedProducts.length)}
          sub="Falta materia prima"
        />
        <KpiCard
          icon={<Factory size={20} />}
          iconColor="text-green-500"
          label="Listos para fabricar"
          value={String(canProduce.length)}
          sub="Tienen MP suficiente"
        />
      </div>

      {/* ==== Section 1: Stagnant Inventory ==== */}
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <PackageX size={16} className="text-orange-500" />
              Inventario estacionado
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Productos con stock que no han tenido salidas ni transferencias
            </p>
          </div>
          <div className="flex items-center gap-1">
            {DAY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDaysFilter(opt.value)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
                  daysFilter === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {stagnant.length === 0 ? (
          <div className="px-5 py-12 text-center text-muted-foreground">
            No hay productos estacionados con mas de {daysFilter} dias sin rotacion
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="text-left px-4 py-3 font-semibold">SKU</th>
                  <th className="text-left px-4 py-3 font-semibold">Producto</th>
                  <th className="text-left px-4 py-3 font-semibold">Almacen</th>
                  <th className="text-right px-4 py-3 font-semibold">Cantidad</th>
                  <th className="text-right px-4 py-3 font-semibold">Valor</th>
                  <th className="text-right px-4 py-3 font-semibold">Ultima salida</th>
                  <th className="text-right px-4 py-3 font-semibold">Dias</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stagnant.map((item, idx) => (
                  <tr key={`${item.product_id}-${item.warehouse_name}-${idx}`} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{item.sku}</td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{item.product_name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{item.warehouse_name}</td>
                    <td className="px-4 py-3 text-sm text-right tabular-nums">{formatNumber(item.quantity)}</td>
                    <td className="px-4 py-3 text-sm text-right tabular-nums font-medium">{formatCurrency(item.stagnant_value)}</td>
                    <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                      {item.last_exit_date
                        ? new Date(item.last_exit_date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
                        : "Nunca"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
                        item.days_without_exit > 180
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : item.days_without_exit > 90
                            ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      )}>
                        {item.days_without_exit}d
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/20 font-medium text-sm">
                  <td colSpan={3} className="px-4 py-3 text-muted-foreground">
                    Total: {stagnant.length} producto{stagnant.length !== 1 ? "s" : ""}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatNumber(stagnant.reduce((s, i) => s + i.quantity, 0))}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">
                    {formatCurrency(totalStagnantValue)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* ==== Section 2: Production Capacity ==== */}
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Factory size={16} className="text-purple-500" />
            Capacidad de produccion
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Haz clic en un producto para ver el desglose completo de materiales
          </p>
        </div>

        {capacity.length === 0 ? (
          <div className="px-5 py-12 text-center text-muted-foreground">
            No hay productos con escandallo configurado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="w-8 px-2 py-3" />
                  <th className="text-left px-4 py-3 font-semibold">Producto terminado</th>
                  <th className="text-right px-4 py-3 font-semibold">Stock actual</th>
                  <th className="text-right px-4 py-3 font-semibold">Puedes fabricar</th>
                  <th className="text-left px-4 py-3 font-semibold">Cuello de botella</th>
                  <th className="text-right px-4 py-3 font-semibold">Stock MP</th>
                  <th className="text-right px-4 py-3 font-semibold">Materiales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {capacity.map((row, idx) => (
                  <CapacityRow key={`${row.finished_id}-${idx}`} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ---- Capacity Row (expandable) ----

interface BomDetailItem {
  raw_material_sku: string;
  raw_material_name: string;
  qty_per_unit: number;
  raw_stock: number;
  producible_from_this: number;
  is_bottleneck: boolean;
}

function CapacityRow({ row }: { row: ProductionCapacity }) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<BomDetailItem[] | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const handleToggle = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (detail) return; // already loaded
    setLoadingDetail(true);
    const { data } = await dypai.api.get("metrics_product_bom_detail", { params: { product_id: row.finished_id } });
    if (data && Array.isArray(data)) {
      setDetail(
        data.map((r: Record<string, unknown>) => ({
          raw_material_sku: String(r.raw_material_sku ?? ""),
          raw_material_name: String(r.raw_material_name ?? ""),
          qty_per_unit: num(r.qty_per_unit),
          raw_stock: num(r.raw_stock),
          producible_from_this: num(r.producible_from_this),
          is_bottleneck: Boolean(r.is_bottleneck),
        }))
      );
    }
    setLoadingDetail(false);
  };

  return (
    <>
      <tr
        onClick={handleToggle}
        className={cn(
          "transition-colors cursor-pointer",
          row.max_producible === 0 ? "bg-red-50/30 dark:bg-red-950/5" : "hover:bg-muted/30"
        )}
      >
        <td className="px-2 py-3 text-center">
          <span className={cn("text-muted-foreground transition-transform inline-block", expanded && "rotate-90")}>
            ▸
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="text-sm font-medium text-foreground">{row.finished_name}</div>
          <div className="text-xs font-mono text-muted-foreground">{row.finished_sku}</div>
        </td>
        <td className="px-4 py-3 text-sm text-right tabular-nums">{formatNumber(row.finished_stock)}</td>
        <td className="px-4 py-3 text-right">
          <span className={cn(
            "inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums",
            row.max_producible === 0
              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              : row.max_producible < 10
                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          )}>
            {row.max_producible === 0 ? "Bloqueado" : formatNumber(row.max_producible)}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="text-sm text-foreground">{row.bottleneck_material}</div>
          <div className="text-xs font-mono text-muted-foreground">{row.bottleneck_sku}</div>
        </td>
        <td className="px-4 py-3 text-sm text-right tabular-nums">
          <span className={row.bottleneck_stock === 0 ? "text-red-600 dark:text-red-400 font-medium" : ""}>
            {formatNumber(row.bottleneck_stock)}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-right text-muted-foreground">
          {row.materials_count}
        </td>
      </tr>

      {/* Expanded detail */}
      {expanded && (
        <tr>
          <td colSpan={7} className="px-0 py-0">
            <div className="bg-muted/20 border-t border-border">
              {loadingDetail ? (
                <div className="px-8 py-4 text-sm text-muted-foreground">Cargando materiales...</div>
              ) : detail && detail.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="w-8" />
                      <th className="text-left px-4 py-2 font-semibold pl-12">Materia prima</th>
                      <th className="text-right px-4 py-2 font-semibold">Necesita/u</th>
                      <th className="text-right px-4 py-2 font-semibold">Stock disponible</th>
                      <th className="text-right px-4 py-2 font-semibold">Alcanza para</th>
                      <th className="text-right px-4 py-2 font-semibold" colSpan={2}>Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {detail.map((mat) => (
                      <tr key={mat.raw_material_sku} className={cn(mat.is_bottleneck && "bg-red-50/40 dark:bg-red-950/10")}>
                        <td className="w-8" />
                        <td className="px-4 py-2 pl-12">
                          <div className="text-sm text-foreground">{mat.raw_material_name}</div>
                          <div className="text-xs font-mono text-muted-foreground">{mat.raw_material_sku}</div>
                        </td>
                        <td className="px-4 py-2 text-sm text-right tabular-nums text-muted-foreground">
                          {formatNumber(mat.qty_per_unit)}
                        </td>
                        <td className="px-4 py-2 text-sm text-right tabular-nums">
                          <span className={mat.raw_stock === 0 ? "text-red-600 dark:text-red-400 font-medium" : ""}>
                            {formatNumber(mat.raw_stock)}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-right tabular-nums font-medium">
                          {formatNumber(mat.producible_from_this)} uds
                        </td>
                        <td className="px-4 py-2 text-right" colSpan={2}>
                          {mat.is_bottleneck ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              <AlertTriangle size={10} /> Cuello de botella
                            </span>
                          ) : mat.raw_stock === 0 ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              Sin stock
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              OK
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="px-8 py-4 text-sm text-muted-foreground">Sin materiales</div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ---- KPI Card ----
function KpiCard({ icon, iconColor, label, value, sub }: {
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className={iconColor}>{icon}</div>
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}
