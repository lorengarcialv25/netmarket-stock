"use client";

import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/FormInput";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

interface RawMaterial {
  id: string;
  name: string;
  sku: string;
}

interface BomFormProps {
  open: boolean;
  onClose: () => void;
  availableRawMaterials: RawMaterial[];
  form: { raw_material_id: string; quantity: string };
  setForm: (form: { raw_material_id: string; quantity: string }) => void;
  onSubmit: () => void;
  submitting: boolean;
}

export function BomForm({
  open,
  onClose,
  availableRawMaterials,
  form,
  setForm,
  onSubmit,
  submitting,
}: BomFormProps) {
  if (!open) return null;

  return (
    <div className="bg-muted rounded-md p-4 mb-4 flex gap-3 items-end flex-wrap">
      <div className="flex-[1_1_200px]">
        <SearchableSelect
          label="Materia Prima"
          value={form.raw_material_id}
          onChange={(v) =>
            setForm({ ...form, raw_material_id: v })
          }
          placeholder="Seleccionar..."
          searchPlaceholder="Buscar materia prima..."
          options={availableRawMaterials.map((rm) => ({
            value: rm.id,
            label: `${rm.name} (${rm.sku})`,
          }))}
        />
      </div>
      <div className="flex-[0_1_120px]">
        <FormInput
          label="Cantidad"
          type="number"
          min={0.01}
          step={0.01}
          value={form.quantity}
          onChange={(e) =>
            setForm({ ...form, quantity: e.target.value })
          }
          placeholder="0"
        />
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={onSubmit}
          disabled={
            submitting ||
            !form.raw_material_id ||
            !form.quantity
          }
        >
          {submitting ? "Guardando..." : "Guardar"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
