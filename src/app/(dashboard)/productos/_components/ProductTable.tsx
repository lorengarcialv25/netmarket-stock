"use client";

import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, productTypeLabel } from "@/lib/utils";
import { Eye, Pencil, Trash2 } from "lucide-react";
import type { Product } from "@/lib/types";

interface ProductTableProps {
  products: Product[];
  loading: boolean;
  isAdmin: boolean;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  serverPagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
}

export function ProductTable({ products, loading, isAdmin, onEdit, onDelete, serverPagination }: ProductTableProps) {
  const router = useRouter();

  const columns = [
    { key: "sku", label: "SKU" },
    {
      key: "name",
      label: "Nombre",
      render: (item: Product) => (
        <button
          className="text-left font-medium text-primary hover:underline cursor-pointer"
          onClick={() => router.push(`/productos/${item.id}`)}
        >
          {item.name}
        </button>
      ),
    },
    {
      key: "product_type",
      label: "Tipo",
      render: (item: Product) => (
        <Badge
          variant={item.product_type === "final" ? "secondary" : "default"}
          className={
            item.product_type === "final"
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0"
              : ""
          }
        >
          {productTypeLabel(item.product_type)}
        </Badge>
      ),
    },
    { key: "category_name", label: "Categoria" },
    { key: "supplier_name", label: "Proveedor" },
    {
      key: "purchase_price",
      label: "Precio Compra",
      render: (item: Product) => formatCurrency(item.purchase_price),
    },
    {
      key: "sale_price",
      label: "Precio Venta",
      render: (item: Product) => formatCurrency(item.sale_price),
    },
    { key: "min_stock", label: "Stock Min." },
    {
      key: "is_active",
      label: "Estado",
      render: (item: Product) => (
        <Badge
          variant={item.is_active ? "secondary" : "default"}
          className={
            item.is_active
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0"
              : ""
          }
        >
          {item.is_active ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      render: (item: Product) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/productos/${item.id}`)}>
            <Eye size={16} />
          </Button>
          {isAdmin && (
            <>
              <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                <Pencil size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(item.id)}
                className="text-destructive"
              >
                <Trash2 size={16} />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return <DataTable columns={columns} data={products} loading={loading} serverPagination={serverPagination} />;
}
