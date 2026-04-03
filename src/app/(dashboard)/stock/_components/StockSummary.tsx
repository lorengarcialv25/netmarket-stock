"use client";

import { formatCurrency } from "@/lib/utils";

interface StockSummaryProps {
  totalValue: number;
  itemCount: number;
  lowStockCount: number;
  showValue?: boolean;
}

export function StockSummary({ totalValue, itemCount, lowStockCount, showValue = true }: StockSummaryProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
      {showValue && (
        <div className="bg-card rounded-lg p-5 shadow-sm border border-border">
          <p className="text-sm text-muted-foreground">
            Valor Total Inventario
          </p>
          <p className="mt-1 text-2xl font-bold text-primary">
            {formatCurrency(totalValue)}
          </p>
        </div>
      )}
      <div className="bg-card rounded-lg p-5 shadow-sm border border-border">
        <p className="text-sm text-muted-foreground">
          Productos en Stock
        </p>
        <p className="mt-1 text-2xl font-bold text-foreground">
          {itemCount}
        </p>
      </div>
      <div className="bg-card rounded-lg p-5 shadow-sm border border-border">
        <p className="text-sm text-muted-foreground">
          Productos Stock Bajo
        </p>
        <p className="mt-1 text-2xl font-bold text-destructive">
          {lowStockCount}
        </p>
      </div>
    </div>
  );
}
