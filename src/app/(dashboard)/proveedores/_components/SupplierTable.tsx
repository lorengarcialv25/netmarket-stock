"use client";

import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import type { Supplier } from "@/lib/types";

interface SupplierTableProps {
  suppliers: Supplier[];
  loading: boolean;
  isAdmin: boolean;
  onEdit: (supplier: Supplier) => void;
  onDelete: (id: string) => void;
}

export function SupplierTable({ suppliers, loading, isAdmin, onEdit, onDelete }: SupplierTableProps) {
  const columns = [
    { key: "name", label: "Nombre" },
    { key: "contact_person", label: "Persona de Contacto" },
    { key: "phone", label: "Telefono" },
    { key: "email", label: "Email" },
    {
      key: "is_active",
      label: "Estado",
      render: (item: Supplier) => (
        <Badge
          variant={item.is_active ? "secondary" : "default"}
          className={item.is_active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0" : ""}
        >
          {item.is_active ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    ...(isAdmin
      ? [
          {
            key: "actions",
            label: "Acciones",
            render: (item: Supplier) => (
              <div className="flex gap-2">
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
              </div>
            ),
          },
        ]
      : []),
  ];

  return <DataTable columns={columns} data={suppliers} loading={loading} />;
}
