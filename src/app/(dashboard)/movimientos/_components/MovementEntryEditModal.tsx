"use client";

import { useEffect, useMemo, useState } from "react";
import type { StockMovement } from "@/lib/types";
import { movementReasonLabel } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { FormInput, FormSelect, FormTextarea } from "@/components/ui/FormInput";

const ENTRY_REASONS = [
  "purchase",
  "return",
  "production",
  "adjustment_in",
  "recount",
  "other",
];

interface EditState {
  quantity: string;
  reason: string;
  unit_cost: string;
  lot_number: string;
  expiry_date: string;
  notes: string;
}

interface MovementEntryEditModalProps {
  open: boolean;
  movement: StockMovement | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: EditState) => void;
}

const EMPTY_STATE: EditState = {
  quantity: "",
  reason: "",
  unit_cost: "",
  lot_number: "",
  expiry_date: "",
  notes: "",
};

export function MovementEntryEditModal({
  open,
  movement,
  submitting = false,
  onClose,
  onSubmit,
}: MovementEntryEditModalProps) {
  const [form, setForm] = useState<EditState>(EMPTY_STATE);

  useEffect(() => {
    if (!open || !movement) return;

    setForm({
      quantity: String(movement.quantity ?? ""),
      reason: movement.reason ?? "",
      unit_cost:
        movement.unit_cost != null ? String(Number(movement.unit_cost)) : "",
      lot_number: movement.lot_number ?? "",
      expiry_date: movement.expiry_date?.slice(0, 10) ?? "",
      notes: movement.notes ?? "",
    });
  }, [open, movement]);

  const isDisabled = useMemo(
    () =>
      submitting ||
      !form.quantity ||
      !form.reason ||
      !form.unit_cost ||
      Number(form.quantity) <= 0 ||
      Number(form.unit_cost) <= 0,
    [form, submitting]
  );

  return (
    <Modal open={open} onClose={onClose} title="Editar entrada" size="lg">
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
          Solo se pueden editar entradas manuales cuyo lote no haya sido consumido.
        </div>

        <FormInput
          label="Cantidad *"
          type="number"
          min={0.0001}
          step="0.0001"
          value={form.quantity}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, quantity: e.target.value }))
          }
        />

        <FormSelect
          label="Motivo *"
          value={form.reason}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, reason: e.target.value }))
          }
          placeholder="Seleccionar motivo"
          options={ENTRY_REASONS.map((reason) => ({
            value: reason,
            label: movementReasonLabel(reason),
          }))}
        />

        <FormInput
          label="Coste unitario *"
          type="number"
          min={0.01}
          step="0.01"
          value={form.unit_cost}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, unit_cost: e.target.value }))
          }
        />

        <FormInput
          label="Número de lote"
          placeholder="Mantener actual si se deja vacío"
          value={form.lot_number}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, lot_number: e.target.value }))
          }
        />

        <FormInput
          label="Fecha de caducidad"
          type="date"
          value={form.expiry_date}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, expiry_date: e.target.value }))
          }
        />

        <FormTextarea
          label="Notas"
          rows={4}
          value={form.notes}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, notes: e.target.value }))
          }
        />

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => onSubmit(form)} disabled={isDisabled}>
            {submitting ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
