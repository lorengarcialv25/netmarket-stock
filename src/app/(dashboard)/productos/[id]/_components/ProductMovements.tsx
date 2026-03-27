"use client";

import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatNumber, movementTypeLabel, movementReasonLabel } from "@/lib/utils";
import type { StockMovement } from "@/lib/types";

interface ProductMovementsProps {
  movements: StockMovement[];
  loading: boolean;
  totalItems: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const typeStyles: Record<string, string> = {
  entry: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0",
  exit: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0",
  transfer: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0",
};

export function ProductMovements({ movements, loading, totalItems, page, pageSize, onPageChange }: ProductMovementsProps) {
  const columns = [
    {
      key: "created_at",
      label: "Fecha",
      render: (row: StockMovement) => formatDateTime(row.created_at),
    },
    { key: "warehouse_name", label: "Almacen" },
    {
      key: "movement_type",
      label: "Tipo",
      render: (row: StockMovement) => (
        <Badge variant="secondary" className={typeStyles[row.movement_type] ?? ""}>
          {movementTypeLabel(row.movement_type)}
        </Badge>
      ),
    },
    {
      key: "quantity",
      label: "Cantidad",
      render: (row: StockMovement) => (
        <span className="font-semibold">
          {row.movement_type === "exit" ? `-${formatNumber(row.quantity)}` : `+${formatNumber(row.quantity)}`}
        </span>
      ),
    },
    {
      key: "destination",
      label: "Destino",
      render: (row: StockMovement) => row.destination_warehouse_name || "-",
    },
    {
      key: "reason",
      label: "Motivo",
      render: (row: StockMovement) => (row.reason ? movementReasonLabel(row.reason) : "-"),
    },
  ];

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">Historico de Movimientos</h2>
      <DataTable
        columns={columns}
        data={movements}
        loading={loading}
        emptyMessage="No hay movimientos registrados"
        serverPagination={{
          page,
          pageSize,
          totalItems,
          onPageChange,
        }}
      />
    </div>
  );
}
