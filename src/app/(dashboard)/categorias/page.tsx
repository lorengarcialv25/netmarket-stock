"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { dypai } from "@/lib/dypai";
import { useAuth } from "@/hooks/useAuth";
import { sileo } from "sileo";
import { Tags } from "lucide-react";
import type { Category } from "@/lib/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { FilterBar } from "@/components/shared/FilterBar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { CategoryTable } from "./_components/CategoryTable";
import { CategoryForm } from "./_components/CategoryForm";

interface CategoryFormData {
  name: string;
  description: string;
}

const emptyForm: CategoryFormData = {
  name: "",
  description: "",
};

export default function CategoriasPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const canManage =
    user?.role === "admin" || user?.role === "warehouse_manager";

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const { data, error } = await dypai.api.get("list_categories");
    if (!error && data) {
      setCategories(data as Category[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
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

  const openEdit = (category: Category) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      description: category.description || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSubmitting(true);

    if (editingId) {
      const { error } = await dypai.api.put("update_category", { ...form, id: editingId });
      if (error) { setSubmitting(false); sileo.error({ title: "Error al actualizar categoría" }); return; }
      sileo.success({ title: "Categoría actualizada" });
    } else {
      const { error } = await dypai.api.post("create_category", form);
      if (error) { setSubmitting(false); sileo.error({ title: "Error al crear categoría" }); return; }
      sileo.success({ title: "Categoría creada" });
    }

    setModalOpen(false);
    setSubmitting(false);
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    const { error } = await dypai.api.delete("delete_category", { params: { id } });
    setConfirmDeleteId(null);
    if (error) { sileo.error({ title: "Error al eliminar categoría" }); return; }
    sileo.success({ title: "Categoría eliminada" });
    fetchCategories();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Tags size={24} className="text-primary" />}
        title="Categorias"
        actionLabel="Nueva Categoria"
        onAction={openCreate}
        showAction={canManage}
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre..."
      />

      <CategoryTable
        categories={filtered}
        canManage={canManage}
        onEdit={openEdit}
        onDelete={(id) => setConfirmDeleteId(id)}
        loading={loading}
      />

      <CategoryForm
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
        title="Confirmar Eliminacion"
        message="Esta seguro de que desea eliminar esta categoria? Esta accion no se puede deshacer."
      />
    </div>
  );
}
