"use client";

import { useState } from "react";
import { dypai } from "@/lib/dypai";
import { sileo } from "sileo";
import { ClipboardList, Plus, Trash2, Pencil, Save, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormInput } from "@/components/ui/FormInput";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { formatCurrency } from "@/lib/utils";

interface NoteLine {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number | null;
  product_name: string;
  sku: string;
  unit_of_measure: string;
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  purchase_price: number;
}

interface Props {
  noteId: string;
  lines: NoteLine[];
  products: ProductOption[];
  canEdit: boolean;
  onLinesChanged: () => void;
}

export function DeliveryNoteLines({ noteId, lines, products, canEdit, onLinesChanged }: Props) {
  // Add line
  const [newLine, setNewLine] = useState({ product_id: "", quantity: "", unit_price: "" });
  const [addingLine, setAddingLine] = useState(false);

  // Edit line
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [lineForm, setLineForm] = useState({ product_id: "", quantity: "", unit_price: "" });
  const [savingLine, setSavingLine] = useState(false);

  // Delete
  const [deleteLineId, setDeleteLineId] = useState<string | null>(null);

  const totalQty = lines.reduce((s, l) => s + Number(l.quantity), 0);
  const totalValue = lines.reduce((s, l) => s + Number(l.quantity) * Number(l.unit_price || 0), 0);
  const productOptions = products.map((p) => ({ value: p.id, label: `${p.sku} - ${p.name}` }));

  // Add
  const handleProductSelect = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    setNewLine({ ...newLine, product_id: productId, unit_price: prod?.purchase_price ? String(prod.purchase_price) : "" });
  };

  const handleAddLine = async () => {
    if (!newLine.product_id || !newLine.quantity) return;
    setAddingLine(true);
    const { error } = await dypai.api.post("add_delivery_note_line", {
      delivery_note_id: noteId,
      product_id: newLine.product_id,
      quantity: Number(newLine.quantity),
      unit_price: newLine.unit_price ? Number(newLine.unit_price) : null,
    });
    setAddingLine(false);
    if (error) { sileo.error({ title: "Error al anadir linea" }); return; }
    setNewLine({ product_id: "", quantity: "", unit_price: "" });
    onLinesChanged();
  };

  // Edit
  const startEditLine = (line: NoteLine) => {
    setEditingLineId(line.id);
    setLineForm({
      product_id: line.product_id,
      quantity: String(line.quantity),
      unit_price: line.unit_price != null ? String(line.unit_price) : "",
    });
  };

  const handleLineProductSelect = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    setLineForm({ ...lineForm, product_id: productId, unit_price: prod?.purchase_price ? String(prod.purchase_price) : lineForm.unit_price });
  };

  const saveLine = async () => {
    if (!editingLineId) return;
    setSavingLine(true);
    const { error } = await dypai.api.put("update_delivery_note_line", {
      id: editingLineId,
      product_id: lineForm.product_id,
      quantity: Number(lineForm.quantity),
      unit_price: lineForm.unit_price ? Number(lineForm.unit_price) : null,
    });
    setSavingLine(false);
    if (error) { sileo.error({ title: "Error al actualizar linea" }); return; }
    setEditingLineId(null);
    onLinesChanged();
  };

  // Delete
  const handleDeleteLine = async (lineId: string) => {
    const { error } = await dypai.api.delete("delete_delivery_note_line", { params: { id: lineId } });
    setDeleteLineId(null);
    if (error) { sileo.error({ title: "Error al eliminar linea" }); return; }
    onLinesChanged();
  };

  return (
    <>
      {/* Add Line */}
      {canEdit && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/30">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus size={16} className="text-primary" />
              Anadir Linea
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-end gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <SearchableSelect
                  label="Producto"
                  value={newLine.product_id}
                  onChange={handleProductSelect}
                  placeholder="Buscar producto..."
                  searchPlaceholder="Nombre o SKU..."
                  options={productOptions}
                />
              </div>
              <div className="w-28">
                <FormInput label="Cantidad" type="number" value={newLine.quantity} onChange={(e) => setNewLine({ ...newLine, quantity: e.target.value })} placeholder="0" />
              </div>
              <div className="w-32">
                <FormInput label="Precio Ud." type="number" value={newLine.unit_price} onChange={(e) => setNewLine({ ...newLine, unit_price: e.target.value })} placeholder="0.00" />
              </div>
              <Button onClick={handleAddLine} disabled={addingLine || !newLine.product_id || !newLine.quantity} className="gap-2">
                <Plus size={16} />
                Anadir
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lines Table */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList size={16} className="text-primary" />
              Lineas del Albaran
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              {lines.length} {lines.length === 1 ? "articulo" : "articulos"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {lines.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground italic">
              No hay lineas. Anade productos al albaran.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/20">
                  <tr className="border-none">
                    <th className="text-[10px] font-black uppercase text-muted-foreground py-3 px-6 text-left w-[35%]">Producto</th>
                    <th className="text-[10px] font-black uppercase text-muted-foreground py-3 text-left w-[12%]">SKU</th>
                    <th className="text-[10px] font-black uppercase text-muted-foreground py-3 text-center w-[13%]">Cantidad</th>
                    <th className="text-[10px] font-black uppercase text-muted-foreground py-3 text-right w-[15%]">Precio Ud.</th>
                    <th className="text-[10px] font-black uppercase text-muted-foreground py-3 text-right pr-6 w-[15%]">Total</th>
                    {canEdit && <th className="py-3 w-[10%]" />}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => {
                    const isEditing = editingLineId === line.id;
                    const lineTotal = Number(line.quantity) * Number(line.unit_price || 0);

                    if (isEditing) {
                      return (
                        <tr key={line.id} className="bg-primary/5">
                          <td className="px-6 py-3 align-middle">
                            <SearchableSelect
                              value={lineForm.product_id}
                              onChange={handleLineProductSelect}
                              placeholder="Producto..."
                              searchPlaceholder="SKU o nombre..."
                              options={productOptions}
                            />
                          </td>
                          <td className="py-3 align-middle">
                            <span className="font-mono text-xs text-muted-foreground">
                              {products.find((p) => p.id === lineForm.product_id)?.sku || "-"}
                            </span>
                          </td>
                          <td className="py-3 px-2 align-middle">
                            <input type="number" value={lineForm.quantity} onChange={(e) => setLineForm({ ...lineForm, quantity: e.target.value })} className="w-full text-center text-sm bg-background border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
                          </td>
                          <td className="py-3 px-2 align-middle">
                            <input type="number" step="0.01" value={lineForm.unit_price} onChange={(e) => setLineForm({ ...lineForm, unit_price: e.target.value })} className="w-full text-right text-sm bg-background border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
                          </td>
                          <td className="py-3 pr-6 text-right align-middle">
                            <span className="text-sm font-bold text-muted-foreground">
                              {lineForm.quantity && lineForm.unit_price ? formatCurrency(Number(lineForm.quantity) * Number(lineForm.unit_price)) : "-"}
                            </span>
                          </td>
                          <td className="py-3 align-middle">
                            <div className="flex items-center gap-1 justify-center">
                              <button onClick={saveLine} disabled={savingLine} className="p-1.5 rounded-md text-primary hover:bg-primary/10 transition-colors cursor-pointer">
                                {savingLine ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                              </button>
                              <button onClick={() => setEditingLineId(null)} className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors cursor-pointer">
                                <X size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr
                        key={line.id}
                        className={`border-none hover:bg-muted/20 group transition-colors ${canEdit ? "cursor-pointer" : ""}`}
                        onDoubleClick={() => canEdit && startEditLine(line)}
                      >
                        <td className="px-6 py-4 align-top">
                          <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                            {line.product_name}
                          </span>
                        </td>
                        <td className="py-4 align-middle">
                          <span className="font-mono text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md border border-muted-foreground/10 group-hover:bg-background group-hover:border-primary/20 transition-all">
                            {line.sku}
                          </span>
                        </td>
                        <td className="py-4 text-center align-middle">
                          <span className="text-sm font-black text-foreground">{Number(line.quantity).toLocaleString()}</span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase ml-1">{line.unit_of_measure || "uds"}</span>
                        </td>
                        <td className="py-4 text-right text-sm text-muted-foreground align-middle">
                          {line.unit_price != null ? formatCurrency(Number(line.unit_price)) : "-"}
                        </td>
                        <td className="py-4 text-right pr-6 font-black text-foreground text-sm align-middle">
                          {line.unit_price != null ? formatCurrency(lineTotal) : "-"}
                        </td>
                        {canEdit && (
                          <td className="py-4 text-center align-middle">
                            <div className="flex items-center gap-0.5 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => startEditLine(line)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer">
                                <Pencil size={13} />
                              </button>
                              <button onClick={() => setDeleteLineId(line.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-muted/10">
                    <td colSpan={2} className="px-6 py-4" />
                    <td className="py-4 text-center">
                      <span className="text-sm font-bold">{totalQty.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase ml-1">uds</span>
                    </td>
                    <td className="py-4 text-right text-xs font-bold text-muted-foreground uppercase">Total</td>
                    <td className="py-4 text-right pr-6 text-base font-black text-primary">{formatCurrency(totalValue)}</td>
                    {canEdit && <td />}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteLineId}
        onClose={() => setDeleteLineId(null)}
        onConfirm={() => deleteLineId && handleDeleteLine(deleteLineId)}
        title="Eliminar Linea"
        message="Se eliminara esta linea del albaran."
      />
    </>
  );
}
