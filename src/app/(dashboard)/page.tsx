"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { dypai } from "@/lib/dypai";
import { useWarehouseId } from "@/hooks/useWarehouse";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui/Spinner";
import { DashboardStats } from "./_components/DashboardStats";
import { LowStockAlert } from "./_components/LowStockAlert";
import { MyTasksWidget } from "./_components/MyTasksWidget";
import { ArrowRight, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Task } from "@/lib/types";

interface DashboardStatsData {
  total_products: number;
  total_warehouses: number;
  total_stock_value: number;
  low_stock_count: number;
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
  const warehouseId = useWarehouseId();
  const { user } = useAuth();
  const router = useRouter();

  // Workers go straight to tasks
  useEffect(() => {
    if (user?.role === "worker") router.replace("/tareas");
  }, [user, router]);

  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        const wh = warehouseId ? { warehouse_id: warehouseId } : {};
        const [statsRes, lowStockRes, myTasksRes] =
          await Promise.all([
            dypai.api.get("dashboard_stats", { params: wh }),
            dypai.api.get("dashboard_low_stock", { params: wh }),
            dypai.api.get("dashboard_my_tasks", {}),
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
        if (myTasksRes.data && Array.isArray(myTasksRes.data)) {
          setMyTasks(myTasksRes.data as Task[]);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [warehouseId]);

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

      <DashboardStats stats={stats} showFinancials={user?.role !== "worker"} />

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <MyTasksWidget tasks={myTasks} />
        <LowStockAlert items={lowStock} />
      </div>
    </div>
  );
}
