"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { dypai } from "@/lib/dypai";
import { useAuth } from "@/hooks/useAuth";
import { sileo } from "sileo";
import { Users } from "lucide-react";
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
  role: "viewer",
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
    const role = user.role || "viewer";

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
