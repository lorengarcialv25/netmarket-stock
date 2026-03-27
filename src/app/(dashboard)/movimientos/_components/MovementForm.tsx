"use client";

import { useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { FormInput, FormSelect, FormTextarea } from "@/components/ui/FormInput";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { movementReasonLabel } from "@/lib/utils";

interface Warehouse {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
}

export interface MovementFormState {
  movement_type: "entry" | "exit" | "transfer";
  warehouse_id: string;
  product_id: string;
  quantity: string;
  reason: string;
  lot_number: string;
  expiry_date: string;
  destination_warehouse_id: string;
  notes: string;
}

interface MovementFormProps {
  open: boolean;
  onClose: () => void;
  form: MovementFormState;
  setForm: React.Dispatch<React.SetStateAction<MovementFormState>>;
  onSubmit: () => void;
  submitting: boolean;
  warehouses: Warehouse[];
  products: Product[];
}

const ENTRY_REASONS = ["purchase", "return", "production", "adjustment_in", "recount", "other"];
const EXIT_REASONS = ["sale", "waste", "damage", "production_consumption", "adjustment_out", "recount", "other"];
const TRANSFER_REASONS = ["transfer"];

export function MovementForm({
  open,
  onClose,
  form,
  setForm,
  onSubmit,
  submitting,
  warehouses,
  products,
}: MovementFormProps) {
  const reasonOptions = useMemo(() => {
    switch (form.movement_type) {
      case "entry":
        return ENTRY_REASONS;
      case "exit":
        return EXIT_REASONS;
      case "transfer":
        return TRANSFER_REASONS;
      default:
        return [];
    }
  }, [form.movement_type]);

  function handleTypeChange(type: "entry" | "exit" | "transfer") {
    setForm((prev) => ({
      ...prev,
      movement_type: type,
      reason: "",
      destination_warehouse_id: "",
    }));
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuevo Movimiento de Stock">
      <div className="flex flex-col gap-4">
        <FormSelect
          label="Tipo de movimiento *"
          value={form.movement_type}
          onChange={(e) =>
            handleTypeChange(e.target.value as "entry" | "exit" | "transfer")
          }
          options={[
            { value: "entry", label: "Entrada" },
            { value: "exit", label: "Salida" },
            { value: "transfer", label: "Transferencia" },
          ]}
        />

        <FormSelect
          label="Almacén origen *"
          value={form.warehouse_id}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, warehouse_id: e.target.value }))
          }
          placeholder="Seleccionar almacén"
          options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
        />

        <SearchableSelect
          label="Producto *"
          value={form.product_id}
          onChange={(v) =>
            setForm((prev) => ({ ...prev, product_id: v }))
          }
          placeholder="Seleccionar producto"
          searchPlaceholder="Buscar producto..."
          options={products.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
        />

        <FormInput
          label="Cantidad *"
          type="number"
          min={1}
          placeholder="0"
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
          options={reasonOptions.map((r) => ({ value: r, label: movementReasonLabel(r) }))}
        />

        <FormInput
          label="Número de lote"
          placeholder="Ej: LOT-2026-001"
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

        {form.movement_type === "transfer" && (
          <FormSelect
            label="Almacén destino *"
            value={form.destination_warehouse_id}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                destination_warehouse_id: e.target.value,
              }))
            }
            placeholder="Seleccionar almacén destino"
            options={warehouses
              .filter((w) => w.id !== form.warehouse_id)
              .map((w) => ({ value: w.id, label: w.name }))}
          />
        )}

        <FormTextarea
          label="Notas"
          placeholder="Observaciones adicionales..."
          value={form.notes}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, notes: e.target.value }))
          }
          rows={3}
        />

        <div className="flex justify-end gap-3 mt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={onSubmit}
            disabled={
              submitting ||
              !form.warehouse_id ||
              !form.product_id ||
              !form.quantity ||
              !form.reason ||
              (form.movement_type === "transfer" &&
                !form.destination_warehouse_id)
            }
          >
            {submitting ? "Creando..." : "Crear Movimiento"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
