"use client";

import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp, ArrowRightLeft } from "lucide-react";
import {
  formatDateTime,
  movementTypeLabel,
  movementReasonLabel,
} from "@/lib/utils";

interface Movement {
  id: string;
  created_at: string;
  product_name: string;
  product_sku: string;
  warehouse_name: string;
  movement_type: "entry" | "exit" | "transfer";
  quantity: number;
  reason: string;
  lot_number: string | null;
  destination_warehouse_name: string | null;
  notes: string | null;
}

interface MovementTableProps {
  data: Movement[];
  loading: boolean;
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
    render: (item: Movement) => formatDateTime(item.created_at),
  },
  { key: "product_name", label: "Producto" },
  { key: "product_sku", label: "SKU" },
  { key: "warehouse_name", label: "Almacen" },
  {
    key: "movement_type",
    label: "Tipo",
    render: (item: Movement) => {
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
    render: (item: Movement) => (
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
    key: "reason",
    label: "Motivo",
    render: (item: Movement) => movementReasonLabel(item.reason),
  },
  { key: "lot_number", label: "Lote" },
  {
    key: "destination_warehouse_name",
    label: "Destino",
    render: (item: Movement) =>
      item.movement_type === "transfer"
        ? item.destination_warehouse_name || "-"
        : "-",
  },
  {
    key: "notes",
    label: "Notas",
    render: (item: Movement) => (
      <span className="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap block">
        {item.notes || "-"}
      </span>
    ),
  },
];

export function MovementTable({ data, loading, serverPagination }: MovementTableProps) {
  return <DataTable columns={columns} data={data} loading={loading} serverPagination={serverPagination} />;
}
