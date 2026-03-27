"use client";

import { formatCurrency } from "@/lib/utils";
import { StatsCard } from "@/components/shared/StatsCard";
import {
  Package,
  Warehouse,
  DollarSign,
  AlertTriangle,
} from "lucide-react";

interface DashboardStatsData {
  total_products: number;
  total_warehouses: number;
  total_stock_value: number;
  low_stock_count: number;
}

interface DashboardStatsProps {
  stats: DashboardStatsData | null;
  /** En vista por almacén, total_products refleja SKUs con stock en ese almacén. */
  productLabel?: string;
}

export function DashboardStats({ stats, productLabel = "Total productos" }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatsCard
        icon={<Package className="size-5" />}
        label={productLabel}
        value={stats?.total_products?.toString() ?? "0"}
        variant="blue"
        href="/productos"
      />
      <StatsCard
        icon={<Warehouse className="size-5" />}
        label="Total almacenes"
        value={stats?.total_warehouses?.toString() ?? "0"}
        variant="green"
        href="/almacenes"
      />
      <StatsCard
        icon={<DollarSign className="size-5" />}
        label="Valor del Inventario"
        value={formatCurrency(stats?.total_stock_value ?? 0)}
        variant="amber"
        href="/stock"
      />
      <StatsCard
        icon={<AlertTriangle className="size-5" />}
        label="Productos Stock Bajo"
        value={stats?.low_stock_count?.toString() ?? "0"}
        variant={(stats?.low_stock_count ?? 0) > 0 ? "red" : "green"}
        href="/stock?low=true"
      />
    </div>
  );
}
