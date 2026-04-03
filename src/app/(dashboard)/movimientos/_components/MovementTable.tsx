"use client";

import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StockMovement } from "@/lib/types";
import { ArrowDown, ArrowUp, ArrowRightLeft, Eye, Pencil, Trash2 } from "lucide-react";
import {
  formatDateTime,
  movementTypeLabel,
} from "@/lib/utils";

interface MovementTableProps {
  data: StockMovement[];
  loading: boolean;
  onView: (movement: StockMovement) => void;
  onEdit: (movement: StockMovement) => void;
  onDelete: (movement: StockMovement) => void;
  canEdit: (movement: StockMovement) => boolean;
  canDelete: (movement: StockMovement) => boolean;
  serverPagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
}

const movementTypeBadge: Record<string, { variant: "success" | "danger" | "info"; label: string }> = {
  entry: { variant: "success", label: "Entrada" },
  exit: { variant: "danger", label: "Salida" },
  transfer: { variant: "info", label: "Transferencia" },
};

function getBadgeProps(variant: "success" | "danger" | "info") {
  switch (variant) {
    case "success":
      return { variant: "secondary" as const, className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0" };
    case "danger":
      return { variant: "destructive" as const, className: "" };
    case "info":
      return { variant: "secondary" as const, className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0" };
  }
}

const columns = [
  {
    key: "created_at",
    label: "Fecha",
    render: (item: StockMovement) => formatDateTime(item.created_at),
  },
  { key: "product_name", label: "Producto" },
  { key: "product_sku", label: "SKU" },
  {
    key: "movement_type",
    label: "Tipo",
    render: (item: StockMovement) => {
      const badge = movementTypeBadge[item.movement_type];
      if (!badge) return movementTypeLabel(item.movement_type);
      const props = getBadgeProps(badge.variant);
      return (
        <Badge variant={props.variant} className={props.className}>
          {badge.label}
        </Badge>
      );
    },
  },
  {
    key: "quantity",
    label: "Cantidad",
    render: (item: StockMovement) => (
      <span
        className={`inline-flex items-center gap-1 font-semibold ${
          item.movement_type === "entry"
            ? "text-emerald-600 dark:text-emerald-400"
            : item.movement_type === "exit"
            ? "text-destructive"
            : "text-blue-600 dark:text-blue-400"
        }`}
      >
        {item.movement_type === "entry" ? (
          <ArrowDown size={14} />
        ) : item.movement_type === "exit" ? (
          <ArrowUp size={14} />
        ) : (
          <ArrowRightLeft size={14} />
        )}
        {item.quantity}
      </span>
    ),
  },
  {
    key: "lot_number",
    label: "Lote",
    render: (item: StockMovement) => item.lot_allocations || item.lot_number || "-",
  },
  {
    key: "expiry_date",
    label: "Caducidad",
    render: (item: StockMovement) => {
      if (!item.expiry_date) return "-";
      const exp = new Date(item.expiry_date + "T00:00:00");
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const formatted = exp.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
      if (diffDays < 0) return <span className="text-destructive font-medium">{formatted}</span>;
      if (diffDays <= 30) return <span className="text-amber-600 dark:text-amber-400 font-medium">{formatted}</span>;
      return formatted;
    },
  },
];

export function MovementTable({
  data,
  loading,
  onView,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  serverPagination,
}: MovementTableProps) {
  const actionColumns = [
    ...columns,
    {
      key: "actions",
      label: "Acciones",
      render: (item: StockMovement) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => onView(item)} className="gap-1.5">
            <Eye size={14} />
            Ver detalle
          </Button>
          {canEdit(item) && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(item)} className="gap-1.5">
              <Pencil size={14} />
              Editar
            </Button>
          )}
          {canDelete(item) && (
            <Button variant="ghost" size="sm" onClick={() => onDelete(item)} className="gap-1.5 text-destructive hover:text-destructive">
              <Trash2 size={14} />
              Eliminar
            </Button>
          )}
        </div>
      ),
    },
  ];

  return <DataTable columns={actionColumns} data={data} loading={loading} serverPagination={serverPagination} />;
}
