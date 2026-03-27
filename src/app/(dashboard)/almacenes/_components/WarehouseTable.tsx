"use client";

import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import type { Warehouse } from "@/lib/types";

interface WarehouseTableProps {
  warehouses: Warehouse[];
  canManage: boolean;
  onEdit: (warehouse: Warehouse) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

export function WarehouseTable({ warehouses, canManage, onEdit, onDelete, loading }: WarehouseTableProps) {
  const columns = [
    {
      key: "name",
      label: "Nombre",
      render: (row: Warehouse) => row.name,
    },
    {
      key: "address",
      label: "Direccion",
      render: (row: Warehouse) => row.address || "-",
    },
    {
      key: "contact_person",
      label: "Persona de Contacto",
      render: (row: Warehouse) => row.contact_person || "-",
    },
    {
      key: "contact_phone",
      label: "Telefono",
      render: (row: Warehouse) => row.contact_phone || "-",
    },
    {
      key: "is_active",
      label: "Estado",
      render: (row: Warehouse) => (
        <Badge
          variant={row.is_active ? "secondary" : "destructive"}
          className={row.is_active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0" : ""}
        >
          {row.is_active ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    ...(canManage
      ? [
          {
            key: "actions",
            label: "Acciones",
            render: (row: Warehouse) => (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(row)}
                >
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
              </div>
            ),
          },
        ]
      : []),
  ];

  return <DataTable columns={columns} data={warehouses} loading={loading} />;
}
