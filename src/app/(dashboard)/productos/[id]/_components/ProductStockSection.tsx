"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { StatsCard } from "@/components/shared/StatsCard";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Package, DollarSign, AlertTriangle } from "lucide-react";
import type { WarehouseStock } from "@/lib/types";

interface ProductStockSectionProps {
  stock: WarehouseStock[];
  loading: boolean;
  averageCost: number;
  minStock: number;
}

export function ProductStockSection({ stock, loading, averageCost, minStock }: ProductStockSectionProps) {
  const { totalQty, totalValue, lowStockCount } = useMemo(() => {
    let totalQty = 0;
    let lowStockCount = 0;
    let totalValue = 0;
    for (const s of stock) {
      totalQty += s.quantity;
      totalValue += s.quantity * Number(s.average_cost ?? averageCost ?? 0);
      if (s.quantity < minStock) lowStockCount++;
    }
    return { totalQty, totalValue, lowStockCount };
  }, [stock, averageCost, minStock]);

  const columns = [
    { key: "warehouse_name", label: "Almacen" },
    {
      key: "quantity",
      label: "Cantidad",
      render: (row: WarehouseStock) => (
        <span className={row.quantity < minStock ? "text-destructive font-semibold" : "font-semibold"}>
          {formatNumber(row.quantity)}
        </span>
      ),
    },
    {
      key: "value",
      label: "Valor",
      render: (row: WarehouseStock) => formatCurrency(row.quantity * Number(row.average_cost ?? averageCost ?? 0)),
    },
    {
      key: "status",
      label: "Estado",
      render: (row: WarehouseStock) =>
        row.quantity < minStock ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
            <AlertTriangle size={12} />
            Stock bajo
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">OK</span>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-foreground">Stock por Almacen</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          icon={<Package size={22} />}
          label="Stock Total"
          value={formatNumber(totalQty)}
          variant="blue"
        />
        <StatsCard
          icon={<DollarSign size={22} />}
          label="Valor Total"
          value={formatCurrency(totalValue)}
          variant="green"
        />
        <StatsCard
          icon={<AlertTriangle size={22} />}
          label="Almacenes Stock Bajo"
          value={formatNumber(lowStockCount)}
          variant={lowStockCount > 0 ? "red" : "amber"}
        />
      </div>
      <DataTable
        columns={columns}
        data={stock}
        loading={loading}
        emptyMessage="No hay stock registrado para este producto"
      />
    </div>
  );
}
