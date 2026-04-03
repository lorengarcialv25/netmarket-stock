"use client";

import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPackagingOptions } from "@/lib/masterBox";
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
    onPageSizeChange?: (pageSize: number) => void;
  };
}

export function ProductTable({ products, loading, isAdmin, onEdit, onDelete, serverPagination }: ProductTableProps) {
  const router = useRouter();

  const columns = [
    { key: "sku", label: "FNSKU" },
    {
      key: "name",
      label: "SKU",
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
      key: "packaging",
      label: "Caja Master",
      render: (item: Product) => {
        const packagingOptions = getPackagingOptions(item);
        if (packagingOptions.length === 0) {
          return <span className="text-muted-foreground text-sm">Sin definir</span>;
        }
        return (
          <div className="min-w-[170px]">
            {packagingOptions.map((option) => (
              <div key={option.key} className="mb-1 last:mb-0">
                <p className="font-medium text-foreground">{option.label}</p>
                <p className="text-xs text-muted-foreground">
                  {[option.unitsLabel, option.weightLabel].filter(Boolean).join(" · ")}
                </p>
              </div>
            ))}
          </div>
        );
      },
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

  return (
    <DataTable
      columns={columns}
      data={products}
      loading={loading}
      pageSizeOptions={[15, 25, 50, 100]}
      serverPagination={serverPagination}
    />
  );
}
