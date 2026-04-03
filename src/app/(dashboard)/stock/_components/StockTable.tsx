"use client";

import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface StockItem {
  id: string;
  product_name: string;
  product_sku: string;
  warehouse_id: string;
  total_quantity: number;
  quantity: number;
  min_stock: number;
  unit_of_measure: string;
  purchase_price: number;
  average_cost?: number;
  sale_price: number;
  lot_number?: string | null;
  lot_quantity?: number | null;
  lot_unit_cost?: number | null;
  expiry_date?: string | null;
}

interface StockTableProps {
  data: StockItem[];
  loading: boolean;
  showPrices?: boolean;
  showLots?: boolean;
  serverPagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
}

export function StockTable({ data, loading, showPrices = true, showLots = false, serverPagination }: StockTableProps) {
  const columns = [
    { key: "product_name", label: "Producto" },
    {
      key: "product_sku",
      label: "SKU",
      render: (item: StockItem) => (
        <span className="font-mono text-muted-foreground">{item.product_sku}</span>
      ),
    },
    ...(showLots ? [{
      key: "lot_number",
      label: "Lote",
      render: (item: StockItem) => (
        item.lot_number
          ? <span className="font-mono text-xs">{item.lot_number}</span>
          : <span className="text-muted-foreground/50">—</span>
      ),
    }] : []),
    {
      key: "total_quantity",
      label: showLots ? "Stock Total" : "Cantidad",
      render: (item: StockItem) => (
        <div className="flex items-center gap-2">
          <span
            className={`font-semibold ${
              (item.total_quantity ?? item.quantity) <= item.min_stock
                ? "text-destructive"
                : "text-foreground"
            }`}
          >
            {formatNumber(item.total_quantity ?? item.quantity)}
          </span>
          {(item.total_quantity ?? item.quantity) <= item.min_stock && (
            <Badge variant="destructive">Bajo</Badge>
          )}
        </div>
      ),
    },
    ...(showLots ? [{
      key: "lot_quantity",
      label: "Qty Lote",
      render: (item: StockItem) => (
        item.lot_quantity != null
          ? <span className="tabular-nums">{formatNumber(item.lot_quantity)}</span>
          : <span className="text-muted-foreground/50">—</span>
      ),
    }] : []),
    { key: "min_stock", label: "Stock Min." },
    { key: "unit_of_measure", label: "Unidad" },
    ...(showPrices
      ? [
          ...(showLots ? [{
            key: "lot_unit_cost",
            label: "Coste Lote",
            render: (item: StockItem) => (
              item.lot_unit_cost != null
                ? <span className="tabular-nums">{formatCurrency(item.lot_unit_cost)}</span>
                : <span className="text-muted-foreground/50">—</span>
            ),
          }] : []),
          {
            key: "average_cost",
            label: "Coste Medio",
            render: (item: StockItem) => formatCurrency(item.average_cost ?? item.purchase_price),
          },
          {
            key: "sale_price",
            label: "Precio Venta",
            render: (item: StockItem) => formatCurrency(item.sale_price),
          },
        ]
      : []),
    ...(showLots ? [{
      key: "expiry_date",
      label: "Caducidad",
      render: (item: StockItem) => {
        if (!item.expiry_date) return <span className="text-muted-foreground/50">—</span>;
        const d = new Date(item.expiry_date);
        const isExpired = d < new Date();
        return (
          <span className={isExpired ? "text-red-600 dark:text-red-400 font-medium" : ""}>
            {d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        );
      },
    }] : []),
  ];

  return <DataTable columns={columns} data={data} loading={loading} serverPagination={serverPagination} pageSize={50} />;
}
