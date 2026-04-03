"use client";

import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Send } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { User } from "@dypai-ai/client-sdk";

const roleBadgeStyles: Record<string, string> = {
  admin: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-0",
  colaborador: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-0",
  warehouse_manager: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0",
  worker: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0",
};

const roleLabels: Record<string, string> = {
  admin: "Admin",
  colaborador: "Colaborador",
  warehouse_manager: "Gestor Almacen",
  worker: "Trabajador",
  authenticated: "Autenticado",
};

interface UserTableProps {
  users: User[];
  loading: boolean;
  currentUserId?: string;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  onResendInvite: (email: string) => void;
}

export function UserTable({ users, loading, currentUserId, onEdit, onDelete, onResendInvite }: UserTableProps) {
  const columns = [
    {
      key: "email",
      label: "Email",
      render: (item: User) => (
        <span className="font-medium">{item.email}</span>
      ),
    },
    {
      key: "name",
      label: "Nombre",
      render: (item: User) => item.user_metadata?.full_name || item.user_metadata?.name || "—",
    },
    {
      key: "role",
      label: "Rol",
      render: (item: User) => {
        const role = item.role || "authenticated";
        return (
          <Badge className={roleBadgeStyles[role] || ""}>
            {roleLabels[role] || role}
          </Badge>
        );
      },
    },
    {
      key: "last_sign_in_at",
      label: "Último acceso",
      render: (item: User) =>
        item.last_sign_in_at ? formatDateTime(item.last_sign_in_at) : "Nunca",
    },
    {
      key: "created_at",
      label: "Creado",
      render: (item: User) =>
        item.created_at ? formatDateTime(item.created_at) : "—",
    },
    {
      key: "actions",
      label: "Acciones",
      render: (item: User) => (
        <div className="flex gap-1">
          {!item.last_sign_in_at && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onResendInvite(item.email)}
              title="Reenviar invitación"
              className="text-primary"
            >
              <Send size={15} />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
            <Pencil size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(item.id)}
            className="text-destructive"
            disabled={item.id === currentUserId}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return <DataTable columns={columns} data={users} loading={loading} />;
}
