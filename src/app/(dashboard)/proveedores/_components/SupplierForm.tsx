"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { FormInput, FormTextarea } from "@/components/ui/FormInput";
import type { Supplier } from "@/lib/types";

export interface SupplierFormData {
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

interface SupplierFormProps {
  open: boolean;
  onClose: () => void;
  editingSupplier: Supplier | null;
  form: SupplierFormData;
  setForm: (form: SupplierFormData) => void;
  onSubmit: () => void;
}

export function SupplierForm({ open, onClose, editingSupplier, form, setForm, onSubmit }: SupplierFormProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}
    >
      <div className="flex flex-col gap-4">
        <FormInput
          label="Nombre *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Nombre del proveedor"
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Persona de Contacto"
            value={form.contact_person}
            onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
            placeholder="Nombre del contacto"
          />
          <FormInput
            label="Telefono"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Telefono"
          />
        </div>
        <FormInput
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="email@ejemplo.com"
        />
        <FormTextarea
          label="Direccion"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="Direccion del proveedor"
        />
        <FormTextarea
          label="Notas"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Notas adicionales"
        />
        <div className="flex justify-end gap-3 mt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={!form.name.trim()}>
            {editingSupplier ? "Guardar Cambios" : "Crear Proveedor"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
