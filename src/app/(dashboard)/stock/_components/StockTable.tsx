"use client";

import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface StockItem {
  id: string;
  product_name: string;
  product_sku: string;
  warehouse_id: string;
  warehouse_name: string;
  quantity: number;
  min_stock: number;
  unit_of_measure: string;
  purchase_price: number;
  sale_price: number;
}

interface StockTableProps {
  data: StockItem[];
  loading: boolean;
  serverPagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
}

const columns = [
  { key: "product_name", label: "Producto" },
  { key: "product_sku", label: "SKU" },
  { key: "warehouse_name", label: "Almacen" },
  {
    key: "quantity",
    label: "Cantidad",
    render: (item: StockItem) => (
      <div className="flex items-center gap-2">
        <span
          className={`font-semibold ${
            item.quantity <= item.min_stock
              ? "text-destructive"
              : "text-foreground"
          }`}
        >
          {item.quantity}
        </span>
        {item.quantity <= item.min_stock && (
          <Badge variant="destructive">Stock Bajo</Badge>
        )}
      </div>
    ),
  },
  { key: "min_stock", label: "Stock Min." },
  { key: "unit_of_measure", label: "Unidad" },
  {
    key: "purchase_price",
    label: "Precio Compra",
    render: (item: StockItem) => formatCurrency(item.purchase_price),
  },
  {
    key: "sale_price",
    label: "Precio Venta",
    render: (item: StockItem) => formatCurrency(item.sale_price),
  },
];

export function StockTable({ data, loading, serverPagination }: StockTableProps) {
  return <DataTable columns={columns} data={data} loading={loading} serverPagination={serverPagination} />;
}
