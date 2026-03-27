"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { dypai } from "@/lib/dypai";
import { useAuth } from "@/hooks/useAuth";
import { sileo } from "sileo";
import { Warehouse as WarehouseIcon } from "lucide-react";
import type { Warehouse } from "@/lib/types";

import { PageHeader } from "@/components/shared/PageHeader";
import { FilterBar } from "@/components/shared/FilterBar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { WarehouseTable } from "./_components/WarehouseTable";
import { WarehouseForm, type WarehouseFormData } from "./_components/WarehouseForm";

const emptyForm: WarehouseFormData = {
  name: "",
  address: "",
  contact_person: "",
  contact_phone: "",
  contact_email: "",
};

export default function AlmacenesPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WarehouseFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const canManage =
    user?.role === "admin" || user?.role === "warehouse_manager";

  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    const { data, error } = await dypai.api.get("list_warehouses");
    if (!error && data) {
      setWarehouses(data as Warehouse[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  const filtered = warehouses.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  // Auto-open create modal from quick actions
  useEffect(() => {
    if (searchParams.get("action") === "create" && canManage) {
      openCreate();
      window.history.replaceState(null, "", window.location.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const handler = () => { if (canManage) openCreate(); };
    window.addEventListener("quick-action-create", handler);
    return () => window.removeEventListener("quick-action-create", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (warehouse: Warehouse) => {
    setEditingId(warehouse.id);
    setForm({
      name: warehouse.name,
      address: warehouse.address || "",
      contact_person: warehouse.contact_person || "",
      contact_phone: warehouse.contact_phone || "",
      contact_email: warehouse.contact_email || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSubmitting(true);

    if (editingId) {
      const { error } = await dypai.api.put("update_warehouse", { ...form, id: editingId });
      if (error) { setSubmitting(false); sileo.error({ title: "Error al actualizar almacén" }); return; }
      sileo.success({ title: "Almacén actualizado" });
    } else {
      const { error } = await dypai.api.post("create_warehouse", form);
      if (error) { setSubmitting(false); sileo.error({ title: "Error al crear almacén" }); return; }
      sileo.success({ title: "Almacén creado" });
    }

    setModalOpen(false);
    setSubmitting(false);
    fetchWarehouses();
  };

  const handleDelete = async (id: string) => {
    const { error } = await dypai.api.delete("delete_warehouse", { params: { id } });
    setConfirmDeleteId(null);
    if (error) { sileo.error({ title: "Error al eliminar almacén" }); return; }
    sileo.success({ title: "Almacén eliminado" });
    fetchWarehouses();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<WarehouseIcon size={24} className="text-primary" />}
        title="Almacenes"
        actionLabel="Nuevo Almacen"
        onAction={openCreate}
        showAction={canManage}
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre..."
      />

      <WarehouseTable
        warehouses={filtered}
        canManage={canManage}
        onEdit={openEdit}
        onDelete={(id) => setConfirmDeleteId(id)}
        loading={loading}
      />

      <WarehouseForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editingId={editingId}
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      <ConfirmDialog
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        message="Esta seguro de que desea eliminar este almacen? Esta accion no se puede deshacer."
      />
    </div>
  );
}
