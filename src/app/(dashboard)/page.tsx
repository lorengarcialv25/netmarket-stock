"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { dypai } from "@/lib/dypai";
import { PageLoader } from "@/components/ui/Spinner";
import { DashboardStats } from "./_components/DashboardStats";
import { LowStockAlert } from "./_components/LowStockAlert";
import { RecentMovements } from "./_components/RecentMovements";
import { StockByWarehouse } from "./_components/StockByWarehouse";
import { ArrowRight, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardStatsData {
  total_products: number;
  total_warehouses: number;
  total_stock_value: number;
  low_stock_count: number;
}

interface StockByWarehouseData {
  warehouse_name: string;
  total_items: number;
  total_value: number;
}

interface RecentMovement {
  id?: string;
  product_name: string;
  product_sku: string;
  warehouse_name: string;
  movement_type: string;
  quantity: number;
  created_at: string;
}

interface LowStockItem {
  product_name: string;
  sku: string;
  min_stock: number;
  warehouse_name: string;
  quantity: number;
}

function num(v: unknown): number {
  if (v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [stockByWarehouse, setStockByWarehouse] = useState<
    StockByWarehouseData[]
  >([]);
  const [recentMovements, setRecentMovements] = useState<RecentMovement[]>(
    []
  );
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        const [statsRes, warehouseRes, movementsRes, lowStockRes] =
          await Promise.all([
            dypai.api.get("dashboard_stats"),
            dypai.api.get("dashboard_stock_by_warehouse"),
            dypai.api.get("dashboard_recent_movements"),
            dypai.api.get("dashboard_low_stock"),
          ]);

        if (statsRes.data && Array.isArray(statsRes.data) && statsRes.data[0]) {
          const r = statsRes.data[0] as Record<string, unknown>;
          setStats({
            total_products: num(r.total_products),
            total_warehouses: num(r.total_warehouses),
            total_stock_value: num(r.total_stock_value),
            low_stock_count: num(r.low_stock_count),
          });
        }
        if (warehouseRes.data && Array.isArray(warehouseRes.data)) {
          setStockByWarehouse(
            warehouseRes.data.map((row: Record<string, unknown>) => ({
              warehouse_name: String(row.warehouse_name ?? ""),
              total_items: num(row.total_items),
              total_value: num(row.total_value),
            }))
          );
        }
        if (movementsRes.data && Array.isArray(movementsRes.data)) {
          setRecentMovements(
            movementsRes.data.map((row: Record<string, unknown>) => ({
              id: row.id != null ? String(row.id) : undefined,
              product_name: String(row.product_name ?? ""),
              product_sku: String(row.product_sku ?? ""),
              warehouse_name: String(row.warehouse_name ?? ""),
              movement_type: String(row.movement_type ?? ""),
              quantity: num(row.quantity),
              created_at: String(row.created_at ?? ""),
            }))
          );
        }
        if (lowStockRes.data && Array.isArray(lowStockRes.data)) {
          setLowStock(
            lowStockRes.data.map((row: Record<string, unknown>) => ({
              product_name: String(row.product_name ?? ""),
              sku: String(row.sku ?? ""),
              min_stock: num(row.min_stock),
              warehouse_name: String(row.warehouse_name ?? ""),
              quantity: num(row.quantity),
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return <PageLoader label="Cargando panel de control..." />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Panel de control
          </h1>
          <p className="text-muted-foreground mt-1 max-w-xl">
            Vista rápida del inventario: KPIs, últimos movimientos y alertas
            de stock bajo.
          </p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0 gap-2" asChild>
          <Link href="/metricas">
            <BarChart3 size={16} className="text-primary" />
            Métricas y estadísticas
            <ArrowRight size={14} className="text-muted-foreground" />
          </Link>
        </Button>
      </div>

      <DashboardStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <RecentMovements movements={recentMovements} />
        <LowStockAlert items={lowStock} />
      </div>

      <StockByWarehouse warehouses={stockByWarehouse} />
    </div>
  );
}
