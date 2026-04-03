"use client";

import { useEffect, useState, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { FormInput, FormSelect, FormTextarea } from "@/components/ui/FormInput";
import { dypai } from "@/lib/dypai";
import type { AppUser, TaskType } from "@/lib/types";

export interface TaskFormData {
  title: string;
  description: string;
  status: string;
  priority: string;
  task_type: string;
  due_date: string;
  assigned_to: string;
  tags: string;
  related_product_id: string;
  related_warehouse_id: string;
}

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  editingId: string | null;
  form: TaskFormData;
  setForm: (form: TaskFormData) => void;
  onSubmit: () => void;
  submitting: boolean;
  users: AppUser[];
  isWorker?: boolean;
}

const statusOptions = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_progreso", label: "En Progreso" },
  { value: "completada", label: "Completada" },
  { value: "cancelada", label: "Cancelada" },
];

const priorityOptions = [
  { value: "urgente", label: "Urgente" },
  { value: "alta", label: "Alta" },
  { value: "media", label: "Media" },
  { value: "baja", label: "Baja" },
];

const taskTypeOptions = [
  { value: "manual", label: "Manual" },
  { value: "fabricacion", label: "Fabricacion" },
  { value: "reposicion", label: "Reposicion" },
  { value: "auto_stock_bajo", label: "Stock Bajo" },
];

interface SelectOption {
  value: string;
  label: string;
}

export function TaskForm({ open, onClose, editingId, form, setForm, onSubmit, submitting, users, isWorker }: TaskFormProps) {
  const [products, setProducts] = useState<SelectOption[]>([]);
  const [warehouses, setWarehouses] = useState<SelectOption[]>([]);

  const showRelatedFields: TaskType[] = ["fabricacion", "reposicion", "auto_stock_bajo"];
  const needsRelated = showRelatedFields.includes(form.task_type as TaskType);

  const fetchProducts = useCallback(async () => {
    const { data } = await dypai.api.get("list_products");
    if (data && Array.isArray(data)) {
      setProducts(
        (data as { id: string; name: string; sku: string }[]).map((p) => ({
          value: p.id,
          label: `${p.sku} - ${p.name}`,
        }))
      );
    }
  }, []);

  const fetchWarehouses = useCallback(async () => {
    const { data } = await dypai.api.get("list_warehouses");
    if (data && Array.isArray(data)) {
      setWarehouses(
        (data as { id: string; name: string }[]).map((w) => ({
          value: w.id,
          label: w.name,
        }))
      );
    }
  }, []);

  useEffect(() => {
    if (open && needsRelated) {
      if (products.length === 0) fetchProducts();
      if (warehouses.length === 0) fetchWarehouses();
    }
  }, [open, needsRelated, products.length, warehouses.length, fetchProducts, fetchWarehouses]);

  const userOptions = [
    { value: "", label: "Sin asignar" },
    ...users.map((u) => ({ value: u.id, label: u.full_name || u.email })),
  ];

  const productOptions = [
    { value: "", label: "Ninguno" },
    ...products,
  ];

  const warehouseOptions = [
    { value: "", label: "Ninguno" },
    ...warehouses,
  ];

  return (
    <Modal open={open} onClose={onClose} title={editingId ? "Editar Tarea" : "Nueva Tarea"} size="lg">
      <div className="flex flex-col gap-4">
        <FormInput
          label="Titulo *"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Titulo de la tarea"
          required
        />

        <FormTextarea
          label="Descripcion"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Descripcion de la tarea"
          rows={3}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormSelect
            label="Tipo"
            value={form.task_type}
            onChange={(e) => setForm({ ...form, task_type: e.target.value })}
            options={taskTypeOptions}
          />
          <FormSelect
            label="Estado"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={statusOptions}
          />
          <FormSelect
            label="Prioridad"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
            options={priorityOptions}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Fecha limite"
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          />
          {!isWorker && <FormSelect
            label="Asignar a"
            value={form.assigned_to}
            onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
            options={userOptions}
            placeholder="Sin asignar"
          />}
        </div>

        {/* Related product/warehouse - shown for non-manual types */}
        {needsRelated && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg border border-border">
            <FormSelect
              label="Producto relacionado"
              value={form.related_product_id}
              onChange={(e) => setForm({ ...form, related_product_id: e.target.value })}
              options={productOptions}
              placeholder="Seleccionar producto"
            />
            <FormSelect
              label="Almacen relacionado"
              value={form.related_warehouse_id}
              onChange={(e) => setForm({ ...form, related_warehouse_id: e.target.value })}
              options={warehouseOptions}
              placeholder="Seleccionar almacen"
            />
          </div>
        )}

        <FormInput
          label="Etiquetas"
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
          placeholder="Separadas por comas: urgente, revision, compras"
        />

        <div className="flex justify-end gap-3 mt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={submitting || !form.title.trim()}>
            {submitting ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
