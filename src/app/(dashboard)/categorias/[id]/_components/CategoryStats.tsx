"use client";

import { StatsCard } from "@/components/shared/StatsCard";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Package, DollarSign, AlertTriangle, Layers } from "lucide-react";

interface CategoryStatsProps {
  productCount: number;
  totalStock: number;
  totalValue: number;
  lowStockCount: number;
}

export function CategoryStats({ productCount, totalStock, totalValue, lowStockCount }: CategoryStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        icon={<Layers size={22} />}
        label="Productos"
        value={formatNumber(productCount)}
        variant="blue"
      />
      <StatsCard
        icon={<Package size={22} />}
        label="Stock Total"
        value={formatNumber(totalStock)}
        variant="green"
      />
      <StatsCard
        icon={<DollarSign size={22} />}
        label="Valor Total"
        value={formatCurrency(totalValue)}
        variant="amber"
      />
      <StatsCard
        icon={<AlertTriangle size={22} />}
        label="Stock Bajo"
        value={formatNumber(lowStockCount)}
        variant={lowStockCount > 0 ? "red" : "amber"}
      />
    </div>
  );
}
