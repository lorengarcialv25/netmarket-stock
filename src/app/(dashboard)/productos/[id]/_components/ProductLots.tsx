"use client";

import { useState, useEffect } from "react";
import { dypai } from "@/lib/dypai";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, formatDateOnly } from "@/lib/utils";
import { CalendarClock } from "lucide-react";

interface InventoryLot {
  id: string;
  lot_number: string;
  warehouse_name: string;
  expiry_date: string | null;
  quantity_received: number;
  quantity_available: number;
  unit_cost: number;
  received_at: string;
}

interface ProductLotsProps {
  productId: string;
}

function expiryBadge(expiryDate: string | null) {
  if (!expiryDate) return <span className="text-xs text-muted-foreground">-</span>;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate + "T00:00:00");
  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return (
      <Badge variant="destructive" className="text-[10px]">
        Caducado
      </Badge>
    );
  }
  if (diffDays <= 30) {
    return (
      <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 text-[10px]">
        {diffDays}d restantes
      </Badge>
    );
  }
  return null;
}

const columns = [
  { key: "lot_number", label: "Lote" },
  { key: "warehouse_name", label: "Almacen" },
  {
    key: "expiry_date",
    label: "Caducidad",
    render: (item: InventoryLot) => (
      <div className="flex items-center gap-2">
        <span className="text-sm">{item.expiry_date ? formatDateOnly(item.expiry_date) : "-"}</span>
        {expiryBadge(item.expiry_date)}
      </div>
    ),
  },
  {
    key: "quantity_available",
    label: "Disponible",
    render: (item: InventoryLot) => (
      <span className="font-semibold">{formatNumber(item.quantity_available)}</span>
    ),
  },
  {
    key: "quantity_received",
    label: "Recibido",
    render: (item: InventoryLot) => formatNumber(item.quantity_received),
  },
  {
    key: "unit_cost",
    label: "Coste Ud.",
    render: (item: InventoryLot) => formatCurrency(item.unit_cost),
  },
  {
    key: "received_at",
    label: "Recepcion",
    render: (item: InventoryLot) => formatDateOnly(item.received_at),
  },
];

export function ProductLots({ productId }: ProductLotsProps) {
  const [lots, setLots] = useState<InventoryLot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLots() {
      setLoading(true);
      const { data } = await dypai.api.get("list_product_lots", {
        params: { product_id: productId },
      });
      if (data && Array.isArray(data)) {
        setLots(data);
      }
      setLoading(false);
    }
    fetchLots();
  }, [productId]);

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <CalendarClock size={16} className="text-primary" />
        Lotes en inventario
      </h2>
      <DataTable
        columns={columns}
        data={lots}
        loading={loading}
        emptyMessage="No hay lotes con stock disponible para este producto"
      />
    </div>
  );
}
