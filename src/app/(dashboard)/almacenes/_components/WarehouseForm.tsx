"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/FormInput";

export interface WarehouseFormData {
  name: string;
  address: string;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
}

interface WarehouseFormProps {
  open: boolean;
  onClose: () => void;
  editingId: string | null;
  form: WarehouseFormData;
  setForm: (form: WarehouseFormData) => void;
  onSubmit: () => void;
  submitting: boolean;
}

export function WarehouseForm({ open, onClose, editingId, form, setForm, onSubmit, submitting }: WarehouseFormProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingId ? "Editar Almacen" : "Nuevo Almacen"}
    >
      <div className="flex flex-col gap-4">
        <FormInput
          label="Nombre *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Nombre del almacen"
          required
        />
        <FormInput
          label="Direccion"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="Direccion"
        />
        <FormInput
          label="Persona de Contacto"
          value={form.contact_person}
          onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
          placeholder="Persona de contacto"
        />
        <FormInput
          label="Telefono"
          value={form.contact_phone}
          onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
          placeholder="Telefono de contacto"
        />
        <FormInput
          label="Email de Contacto"
          value={form.contact_email}
          onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
          placeholder="Email de contacto"
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
