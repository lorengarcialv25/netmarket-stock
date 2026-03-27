"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { FormInput, FormTextarea } from "@/components/ui/FormInput";

interface CategoryFormData {
  name: string;
  description: string;
}

interface CategoryFormProps {
  open: boolean;
  onClose: () => void;
  editingId: string | null;
  form: CategoryFormData;
  setForm: (form: CategoryFormData) => void;
  onSubmit: () => void;
  submitting: boolean;
}

export function CategoryForm({ open, onClose, editingId, form, setForm, onSubmit, submitting }: CategoryFormProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingId ? "Editar Categoria" : "Nueva Categoria"}
    >
      <div className="flex flex-col gap-4">
        <FormInput
          label="Nombre *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Nombre de la categoria"
          required
        />
        <FormTextarea
          label="Descripcion"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Descripcion de la categoria"
          rows={4}
        />
        <div className="flex justify-end gap-3 mt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={submitting || !form.name.trim()}>
            {submitting
              ? "Guardando..."
              : editingId
              ? "Actualizar"
              : "Crear"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
