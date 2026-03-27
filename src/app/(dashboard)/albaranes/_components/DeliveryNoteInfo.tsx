"use client";

import { useState } from "react";
import { dypai } from "@/lib/dypai";
import { sileo } from "sileo";
import { FileText, Pencil, Save, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormInput } from "@/components/ui/FormInput";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

interface DeliveryNote {
  id: string;
  supplier_id: string | null;
  warehouse_id: string;
  note_number: string;
  note_date: string;
  notes: string | null;
  supplier_name: string | null;
  warehouse_name: string;
}

interface CatalogOption {
  id: string;
  name: string;
}

interface Props {
  note: DeliveryNote;
  canEdit: boolean;
  suppliers: CatalogOption[];
  warehouses: CatalogOption[];
  onSaved: () => void;
}

export function DeliveryNoteInfo({ note, canEdit, suppliers, warehouses, onSaved }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    note_number: "",
    note_date: "",
    supplier_id: "",
    warehouse_id: "",
    notes: "",
  });

  const startEdit = () => {
    setForm({
      note_number: note.note_number,
      note_date: note.note_date,
      supplier_id: note.supplier_id || "",
      warehouse_id: note.warehouse_id,
      notes: note.notes || "",
    });
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    const { error } = await dypai.api.put("update_delivery_note", {
      id: note.id,
      ...form,
    });
    setSaving(false);
    if (error) {
      sileo.error({ title: "Error al actualizar albaran" });
      return;
    }
    setEditing(false);
    sileo.success({ title: "Albaran actualizado" });
    onSaved();
  };

  return (
    <Card className="lg:col-span-2 shadow-sm">
      <CardHeader className="pb-3 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Informacion del Albaran
          </CardTitle>
          {canEdit && !editing && (
            <Button variant="ghost" size="sm" onClick={startEdit} className="gap-1.5 h-7 text-xs text-muted-foreground">
              <Pencil className="h-3 w-3" />
              Editar
            </Button>
          )}
          {editing && (
            <div className="flex gap-1.5">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="gap-1 h-7 text-xs" disabled={saving}>
                <X className="h-3 w-3" />
                Cancelar
              </Button>
              <Button size="sm" onClick={save} className="gap-1 h-7 text-xs" disabled={saving}>
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                Guardar
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {editing ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <FormInput
              label="N Albaran"
              value={form.note_number}
              onChange={(e) => setForm({ ...form, note_number: e.target.value })}
            />
            <FormInput
              label="Fecha"
              type="date"
              value={form.note_date}
              onChange={(e) => setForm({ ...form, note_date: e.target.value })}
            />
            <SearchableSelect
              label="Almacen"
              value={form.warehouse_id}
              onChange={(v) => setForm({ ...form, warehouse_id: v })}
              placeholder="Seleccionar..."
              searchPlaceholder="Buscar almacen..."
              options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
            />
            <SearchableSelect
              label="Proveedor"
              value={form.supplier_id}
              onChange={(v) => setForm({ ...form, supplier_id: v })}
              placeholder="Sin proveedor"
              searchPlaceholder="Buscar proveedor..."
              options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
            />
            <div className="col-span-2">
              <FormInput
                label="Notas"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Observaciones (opcional)"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">N Albaran</p>
              <p className="font-medium mt-0.5">{note.note_number}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fecha</p>
              <p className="font-medium mt-0.5">{note.note_date}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Almacen</p>
              <p className="font-medium mt-0.5">{note.warehouse_name}</p>
            </div>
            {note.supplier_name && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Proveedor</p>
                <p className="font-medium mt-0.5">{note.supplier_name}</p>
              </div>
            )}
            {note.notes && (
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Notas</p>
                <p className="text-sm mt-0.5 text-muted-foreground">{note.notes}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
