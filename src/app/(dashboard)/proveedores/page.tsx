"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { dypai } from "@/lib/dypai";
import { useAuth } from "@/hooks/useAuth";
import { sileo } from "sileo";
import { Truck } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { FilterBar } from "@/components/shared/FilterBar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SupplierTable } from "./_components/SupplierTable";
import { SupplierForm } from "./_components/SupplierForm";
import type { SupplierFormData } from "./_components/SupplierForm";
import type { Supplier } from "@/lib/types";

const initialForm: SupplierFormData = {
  name: "",
  contact_person: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

export default function ProveedoresPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const isAdmin = user?.role === "admin";

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierFormData>(initialForm);
  const [search, setSearch] = useState("");

  const fetchSuppliers = async () => {
    setLoading(true);
    const { data } = await dypai.api.get("list_suppliers");
    if (data) setSuppliers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const filteredSuppliers = useMemo(() => {
    if (!search) return suppliers;
    return suppliers.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [suppliers, search]);

  // Auto-open create modal from quick actions
  useEffect(() => {
    if (searchParams.get("action") === "create" && isAdmin) {
      openCreateModal();
      window.history.replaceState(null, "", window.location.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const handler = () => { if (isAdmin) openCreateModal(); };
    window.addEventListener("quick-action-create", handler);
    return () => window.removeEventListener("quick-action-create", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const openCreateModal = () => {
    setEditingSupplier(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setForm({
      name: supplier.name,
      contact_person: supplier.contact_person || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      notes: supplier.notes || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;

    if (editingSupplier) {
      const { error } = await dypai.api.put("update_supplier", { ...form, id: editingSupplier.id });
      if (error) { sileo.error({ title: "Error al actualizar proveedor" }); return; }
      sileo.success({ title: "Proveedor actualizado" });
    } else {
      const { error } = await dypai.api.post("create_supplier", form);
      if (error) { sileo.error({ title: "Error al crear proveedor" }); return; }
      sileo.success({ title: "Proveedor creado" });
    }

    setModalOpen(false);
    fetchSuppliers();
  };

  const handleDelete = async (id: string) => {
    const { error } = await dypai.api.delete("delete_supplier", { params: { id } });
    setConfirmDeleteId(null);
    if (error) { sileo.error({ title: "Error al eliminar proveedor" }); return; }
    sileo.success({ title: "Proveedor eliminado" });
    fetchSuppliers();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Truck size={24} className="text-primary" />}
        title="Proveedores"
        actionLabel="Nuevo Proveedor"
        onAction={openCreateModal}
        showAction={isAdmin}
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre..."
      />

      <SupplierTable
        suppliers={filteredSuppliers}
        loading={loading}
        isAdmin={isAdmin}
        onEdit={openEditModal}
        onDelete={(id) => setConfirmDeleteId(id)}
      />

      <SupplierForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editingSupplier={editingSupplier}
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        message="Esta seguro de que desea eliminar este proveedor? Esta accion no se puede deshacer."
      />
    </div>
  );
}
