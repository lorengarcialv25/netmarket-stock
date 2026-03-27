"use client";

import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2 } from "lucide-react";
import type { Category } from "@/lib/types";

interface CategoryTableProps {
  categories: Category[];
  canManage: boolean;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

export function CategoryTable({ categories, canManage, onEdit, onDelete, loading }: CategoryTableProps) {
  const router = useRouter();

  const columns = [
    {
      key: "name",
      label: "Nombre",
      render: (row: Category) => (
        <button
          className="text-left font-medium text-primary hover:underline cursor-pointer"
          onClick={() => router.push(`/categorias/${row.id}`)}
        >
          {row.name}
        </button>
      ),
    },
    {
      key: "description",
      label: "Descripcion",
      render: (row: Category) => row.description || "-",
    },
    {
      key: "actions",
      label: "Acciones",
      render: (row: Category) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/categorias/${row.id}`)}>
            <Eye size={16} />
          </Button>
          {canManage && (
            <>
              <Button variant="ghost" size="sm" onClick={() => onEdit(row)}>
                <Pencil size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(row.id)}
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

  return <DataTable columns={columns} data={categories} loading={loading} />;
}
