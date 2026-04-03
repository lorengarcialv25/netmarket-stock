"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { FormInput, FormSelect } from "@/components/ui/FormInput";
import { Mail, Warehouse, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@dypai-ai/client-sdk";

interface WarehouseOption {
  id: string;
  name: string;
}

export interface UserFormData {
  email: string;
  password: string;
  full_name: string;
  role: string;
  warehouse_ids: string[];
}

interface UserFormProps {
  open: boolean;
  onClose: () => void;
  editingUser: User | null;
  form: UserFormData;
  setForm: React.Dispatch<React.SetStateAction<UserFormData>>;
  onSubmit: () => void;
  submitting: boolean;
  warehouses: WarehouseOption[];
}

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "colaborador", label: "Colaborador" },
  { value: "warehouse_manager", label: "Gestor Almacen" },
  { value: "worker", label: "Trabajador" },
];

export function UserForm({ open, onClose, editingUser, form, setForm, onSubmit, submitting, warehouses }: UserFormProps) {
  const isEditing = !!editingUser;
  const showWarehouses = !!form.role && form.role !== "admin";

  function toggleWarehouse(id: string) {
    setForm((prev) => {
      const has = prev.warehouse_ids.includes(id);
      return {
        ...prev,
        warehouse_ids: has
          ? prev.warehouse_ids.filter((wId) => wId !== id)
          : [...prev.warehouse_ids, id],
      };
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Editar Usuario" : "Invitar Usuario"}
    >
      <div className="flex flex-col gap-4">
        {!isEditing && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Mail size={18} className="text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Se enviará un email de invitación para que el usuario establezca su propia contraseña.
            </p>
          </div>
        )}

        <FormInput
          label="Email *"
          type="email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          placeholder="usuario@ejemplo.com"
          disabled={isEditing}
        />

        <FormInput
          label="Nombre completo"
          value={form.full_name}
          onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
          placeholder="Nombre y apellidos"
        />

        {isEditing && (
          <FormInput
            label="Nueva contraseña"
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            placeholder="Dejar vacío para no cambiar"
          />
        )}

        <FormSelect
          label="Rol *"
          value={form.role}
          onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
          options={ROLE_OPTIONS}
          placeholder="Seleccionar rol"
        />

        {showWarehouses && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Almacenes asignados *
            </label>
            {form.role === "admin" ? (
              <p className="text-sm text-muted-foreground">
                El admin tiene acceso a todos los almacenes.
              </p>
            ) : warehouses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay almacenes disponibles.</p>
            ) : (
              <div className="grid gap-1.5 max-h-48 overflow-y-auto rounded-lg border border-border p-2">
                {warehouses.map((w) => {
                  const selected = form.warehouse_ids.includes(w.id);
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => toggleWarehouse(w.id)}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer text-left",
                        selected
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted text-foreground"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center size-5 rounded border shrink-0 transition-colors",
                        selected
                          ? "bg-primary border-primary"
                          : "border-border"
                      )}>
                        {selected && <Check size={12} className="text-primary-foreground" />}
                      </div>
                      <Warehouse size={14} className="text-muted-foreground shrink-0" />
                      {w.name}
                    </button>
                  );
                })}
              </div>
            )}
            {showWarehouses && form.warehouse_ids.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Selecciona al menos un almacén para que el usuario pueda trabajar.
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={onSubmit}
            disabled={
              submitting ||
              !form.email.trim() ||
              !form.role ||
              (showWarehouses && form.warehouse_ids.length === 0)
            }
          >
            {submitting
              ? isEditing ? "Guardando..." : "Enviando invitación..."
              : isEditing ? "Guardar Cambios" : "Enviar Invitación"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
