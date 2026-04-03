"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { dypai } from "@/lib/dypai";
import { useAuth } from "@/hooks/useAuth";
import { sileo } from "sileo";
import { Users, Info, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@dypai-ai/client-sdk";
import type { Warehouse } from "@/lib/types";

import { PageHeader } from "@/components/shared/PageHeader";
import { FilterBar } from "@/components/shared/FilterBar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { UserTable } from "./_components/UserTable";
import { UserForm, type UserFormData } from "./_components/UserForm";

const emptyForm: UserFormData = {
  email: "",
  password: "",
  full_name: "",
  role: "worker",
  warehouse_ids: [],
};

export default function UsuariosPage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const isAdmin = currentUser?.role === "admin";

  const [users, setUsers] = useState<User[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // Redirect non-admins
  useEffect(() => {
    if (currentUser && !isAdmin) {
      router.replace("/");
    }
  }, [currentUser, isAdmin, router]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await dypai.users.list({ per_page: 500 });
    if (!error && data) {
      setUsers(data.users);
    }
    setLoading(false);
  }, []);

  const fetchWarehouses = useCallback(async () => {
    const { data } = await dypai.api.get("list_warehouses");
    if (data) setWarehouses(data as Warehouse[]);
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchWarehouses();
    }
  }, [isAdmin, fetchUsers, fetchWarehouses]);

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.user_metadata?.full_name?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
    );
  }, [users, search]);

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = async (user: User) => {
    setEditingUser(user);
    const role = user.role || "worker";

    // Load assigned warehouses for non-admin users
    let warehouseIds: string[] = [];
    if (role !== "admin") {
      const { data } = await dypai.api.get("get_user_warehouse_assignments", {
        params: { user_id: user.id },
      });
      if (data) {
        warehouseIds = (data as { warehouse_id: string }[]).map((a) => a.warehouse_id);
      }
    }

    setForm({
      email: user.email,
      password: "",
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || "",
      role,
      warehouse_ids: warehouseIds,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.email.trim() || !form.role) return;
    setSubmitting(true);

    if (editingUser) {
      // Update user
      const updateData: Record<string, any> = {
        app_metadata: { role: form.role },
        user_metadata: { full_name: form.full_name, role: form.role },
      };
      if (form.password) {
        updateData.password = form.password;
      }

      const { error } = await dypai.users.update(editingUser.id, updateData);
      if (error) {
        setSubmitting(false);
        sileo.error({ title: "Error al actualizar usuario" });
        return;
      }

      // Update warehouse assignments (for non-admin roles)
      if (form.role !== "admin") {
        await dypai.api.put("set_user_warehouses", {
          user_id: editingUser.id,
          warehouse_ids: form.warehouse_ids.join(","),
        });
      }

      sileo.success({ title: "Usuario actualizado" });
    } else {
      // Create user with random temp password, then send invite email
      const tempPassword = crypto.randomUUID().slice(0, 20) + "Aa1!";

      const { data: newUser, error } = await dypai.users.create({
        email: form.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: form.full_name, role: form.role },
        app_metadata: { role: form.role },
      });
      if (error) {
        setSubmitting(false);
        sileo.error({ title: "Error al crear usuario", description: error.message });
        return;
      }

      // Assign warehouses (for non-admin roles)
      if (form.role !== "admin" && newUser?.id && form.warehouse_ids.length > 0) {
        await dypai.api.put("set_user_warehouses", {
          user_id: newUser.id,
          warehouse_ids: form.warehouse_ids.join(","),
        });
      }

      // Send password reset email so the user can set their own password
      const { error: resetError } = await dypai.auth.resetPasswordForEmail(form.email);
      if (resetError) {
        sileo.warning({ title: "Usuario creado", description: "Pero no se pudo enviar el email de invitación. Puedes reenviar desde editar." });
      } else {
        sileo.success({ title: "Invitación enviada", description: `Se ha enviado un email a ${form.email}` });
      }
    }

    setModalOpen(false);
    setSubmitting(false);
    fetchUsers();
  };

  const handleResendInvite = async (email: string) => {
    const { error } = await dypai.auth.resetPasswordForEmail(email);
    if (error) {
      sileo.error({ title: "Error al reenviar invitación" });
    } else {
      sileo.success({ title: "Invitación reenviada", description: `Email enviado a ${email}` });
    }
  };

  const handleDelete = async (id: string) => {
    if (id === currentUser?.id) {
      sileo.error({ title: "No puedes eliminar tu propio usuario" });
      setConfirmDeleteId(null);
      return;
    }

    // Clean up warehouse assignments first
    await dypai.api.put("set_user_warehouses", { user_id: id, warehouse_ids: "" });

    const { error } = await dypai.users.delete(id);
    setConfirmDeleteId(null);
    if (error) {
      sileo.error({ title: "Error al eliminar usuario" });
      return;
    }
    sileo.success({ title: "Usuario eliminado" });
    fetchUsers();
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Users size={24} className="text-primary" />}
        title="Usuarios"
        actionLabel="Invitar Usuario"
        onAction={openCreate}
        showAction={isAdmin}
      />

      <RolesGuide />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por email, nombre o rol..."
      />

      <UserTable
        users={filtered}
        loading={loading}
        currentUserId={currentUser?.id}
        onEdit={openEdit}
        onDelete={(id) => setConfirmDeleteId(id)}
        onResendInvite={handleResendInvite}
      />

      <UserForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editingUser={editingUser}
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        submitting={submitting}
        warehouses={warehouses}
      />

      <ConfirmDialog
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        title="Confirmar Eliminación"
        message="¿Está seguro de que desea eliminar este usuario? Esta acción no se puede deshacer."
      />
    </div>
  );
}

const roles = [
  {
    name: "Admin",
    value: "admin",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    description: "Acceso total a la plataforma",
    can: [
      "Ver y editar todo: productos, proveedores, categorias, almacenes",
      "Gestionar usuarios y asignar roles",
      "Ver precios, costes y valor de inventario",
      "Metricas, escandallos y capacidad de produccion",
      "Toda la operativa: movimientos, tareas, incidencias, albaranes",
    ],
  },
  {
    name: "Colaborador",
    value: "colaborador",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    description: "Ve todo como admin pero solo opera",
    can: [
      "Ver todo: productos, proveedores, metricas, escandallos",
      "Operativa completa: movimientos, tareas, incidencias, albaranes",
      "Ver precios y valor de inventario",
    ],
    cannot: [
      "No puede editar catalogo (productos, proveedores)",
      "No puede gestionar categorias, almacenes ni usuarios",
    ],
  },
  {
    name: "Gestor almacen",
    value: "warehouse_manager",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    description: "Gestiona stock de sus almacenes asignados",
    can: [
      "Operativa completa: movimientos, tareas, incidencias, albaranes",
      "Ver productos, proveedores, escandallos, metricas",
      "Ve tareas de sus almacenes + tareas sin asignar",
      "Ver precios y valor de inventario",
    ],
    cannot: [
      "No puede gestionar categorias, almacenes ni usuarios",
    ],
  },
  {
    name: "Trabajador",
    value: "worker",
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    description: "Operativa basica del dia a dia",
    can: [
      "Registrar movimientos de stock (entradas, salidas, transferencias)",
      "Subir albaranes de entrada",
      "Gestionar incidencias",
      "Ver y gestionar solo sus tareas asignadas",
      "Ver inventario (sin precios ni costes)",
    ],
    cannot: [
      "No ve precios, costes ni valor de inventario",
      "No ve productos, proveedores, escandallos ni metricas",
      "No ve categorias, almacenes ni usuarios",
    ],
  },
];

function RolesGuide() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 text-left cursor-pointer hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info size={16} className="text-primary" />
          <span className="text-sm font-medium text-foreground">Guia de roles y permisos</span>
        </div>
        <ChevronDown size={16} className={cn("text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-border pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {roles.map((role) => (
              <div key={role.value} className="rounded-lg border border-border p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold", role.color)}>
                    {role.name}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">{role.value}</span>
                </div>
                <p className="text-xs text-muted-foreground">{role.description}</p>
                <div className="space-y-1">
                  {role.can.map((item, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                      <span className="text-green-500 mt-0.5 shrink-0">&#10003;</span>
                      {item}
                    </div>
                  ))}
                  {role.cannot?.map((item, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <span className="text-red-400 mt-0.5 shrink-0">&#10007;</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
