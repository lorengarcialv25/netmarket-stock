"use client";

import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, productTypeLabel } from "@/lib/utils";

interface CategoryProduct {
  id: string;
  sku: string;
  name: string;
  product_type: string;
  purchase_price: number;
  sale_price: number;
  min_stock: number;
  is_active: boolean;
  supplier_name: string | null;
  total_stock: number;
}

interface CategoryProductsTableProps {
  products: CategoryProduct[];
  loading: boolean;
}

export function CategoryProductsTable({ products, loading }: CategoryProductsTableProps) {
  const router = useRouter();

  const columns = [
    { key: "sku", label: "SKU" },
    {
      key: "name",
      label: "Nombre",
      render: (row: CategoryProduct) => (
        <button
          className="text-left font-medium text-primary hover:underline cursor-pointer"
          onClick={() => router.push(`/productos/${row.id}`)}
        >
          {row.name}
        </button>
      ),
    },
    {
      key: "product_type",
      label: "Tipo",
      render: (row: CategoryProduct) => (
        <Badge
          variant="secondary"
          className={
            row.product_type === "final"
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0"
              : ""
          }
        >
          {productTypeLabel(row.product_type)}
        </Badge>
      ),
    },
    { key: "supplier_name", label: "Proveedor", render: (row: CategoryProduct) => row.supplier_name || "-" },
    {
      key: "total_stock",
      label: "Stock",
      render: (row: CategoryProduct) => (
        <span className={row.total_stock < row.min_stock ? "text-destructive font-semibold" : "font-semibold"}>
          {formatNumber(row.total_stock)}
        </span>
      ),
    },
    {
      key: "purchase_price",
      label: "P. Compra",
      render: (row: CategoryProduct) => formatCurrency(row.purchase_price),
    },
    {
      key: "sale_price",
      label: "P. Venta",
      render: (row: CategoryProduct) => formatCurrency(row.sale_price),
    },
    {
      key: "is_active",
      label: "Estado",
      render: (row: CategoryProduct) => (
        <Badge
          variant={row.is_active ? "secondary" : "default"}
          className={
            row.is_active
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0"
              : ""
          }
        >
          {row.is_active ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">Productos en esta Categoria</h2>
      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        emptyMessage="No hay productos en esta categoria"
      />
    </div>
  );
}
