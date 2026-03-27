"use client";

import { useState } from "react";
import { Plus, Trash2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormInput } from "@/components/ui/FormInput";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { formatCurrency } from "@/lib/utils";

// -- Types --

export interface DraftLine {
  key: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: string;
  unit_price: string;
  unit_of_measure: string;
  matched: boolean;
}

export interface HeaderFields {
  noteNumber: string;
  noteDate: string;
  supplierId: string;
  warehouseId: string;
  notes: string;
}

interface CatalogOption { id: string; name: string; }

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  purchase_price: number;
  unit_of_measure: string;
}

interface Props {
  header: HeaderFields;
  onHeaderChange: (h: HeaderFields) => void;
  lines: DraftLine[];
  onLinesChange: (lines: DraftLine[]) => void;
  suppliers: CatalogOption[];
  warehouses: CatalogOption[];
  products: ProductOption[];
  onScanClick?: () => void;
  scanDisabled?: boolean;
}

// -- Component --

export function DeliveryNoteForm({
  header, onHeaderChange,
  lines, onLinesChange,
  suppliers, warehouses, products,
  onScanClick, scanDisabled,
}: Props) {
  const productOptions = products.map((p) => ({ value: p.id, label: `${p.sku} - ${p.name}` }));

  const addLine = () => {
    onLinesChange([
      ...lines,
      { key: crypto.randomUUID(), product_id: "", product_name: "", sku: "", quantity: "", unit_price: "", unit_of_measure: "", matched: true },
    ]);
  };

  const updateLine = (key: string, field: string, value: string) => {
    onLinesChange(
      lines.map((l) => {
        if (l.key !== key) return l;
        if (field === "product_id") {
          const prod = products.find((p) => p.id === value);
          return { ...l, product_id: value, product_name: prod?.name || "", sku: prod?.sku || "", unit_price: prod?.purchase_price ? String(prod.purchase_price) : l.unit_price, unit_of_measure: prod?.unit_of_measure || "", matched: true };
        }
        return { ...l, [field]: value };
      })
    );
  };

  const removeLine = (key: string) => {
    onLinesChange(lines.filter((l) => l.key !== key));
  };

  const totalQty = lines.reduce((s, l) => s + (Number(l.quantity) || 0), 0);
  const totalValue = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header fields */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FormInput
              label="N Albaran"
              value={header.noteNumber}
              onChange={(e) => onHeaderChange({ ...header, noteNumber: e.target.value })}
              placeholder="ALB-001"
            />
            <FormInput
              label="Fecha"
              type="date"
              value={header.noteDate}
              onChange={(e) => onHeaderChange({ ...header, noteDate: e.target.value })}
            />
            <SearchableSelect
              label="Proveedor"
              value={header.supplierId}
              onChange={(v) => onHeaderChange({ ...header, supplierId: v })}
              placeholder="Seleccionar..."
              searchPlaceholder="Buscar proveedor..."
              options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
            />
            <SearchableSelect
              label="Almacen destino"
              value={header.warehouseId}
              onChange={(v) => onHeaderChange({ ...header, warehouseId: v })}
              placeholder="Seleccionar..."
              searchPlaceholder="Buscar almacen..."
              options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lines */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-foreground">
              Lineas {lines.length > 0 && <span className="text-muted-foreground font-normal">({lines.length})</span>}
            </p>
            <Button variant="outline" size="sm" onClick={addLine}>
              <Plus size={14} />
              Anadir linea
            </Button>
          </div>

          {lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-lg">
              <p className="text-muted-foreground mb-3">No hay lineas todavia</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={addLine}>
                  <Plus size={14} />
                  Anadir manualmente
                </Button>
                {onScanClick && (
                  <Button variant="outline" size="sm" onClick={onScanClick} disabled={scanDisabled}>
                    <ScanLine size={14} />
                    Escanear documento
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground text-xs">
                    <th className="py-2 pr-2 w-[40%]">Producto</th>
                    <th className="py-2 pr-2">SKU</th>
                    <th className="py-2 pr-2 text-right w-24">Cantidad</th>
                    <th className="py-2 pr-2 text-right w-28">Precio Ud.</th>
                    <th className="py-2 pr-2 text-right w-28">Total</th>
                    <th className="py-2 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => {
                    const lineTotal = (Number(line.quantity) || 0) * (Number(line.unit_price) || 0);
                    const needsMatch = !line.matched && !line.product_id;
                    return (
                      <tr key={line.key} className={`border-b last:border-0 group ${needsMatch ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}`}>
                        <td className="py-2 pr-2">
                          {needsMatch && line.product_name && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                              Albaran: &ldquo;{line.product_name}&rdquo;
                            </p>
                          )}
                          <SearchableSelect
                            value={line.product_id}
                            onChange={(v) => updateLine(line.key, "product_id", v)}
                            placeholder={needsMatch ? "Seleccionar producto..." : "Buscar producto..."}
                            searchPlaceholder="SKU o nombre..."
                            options={productOptions}
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <span className="text-muted-foreground text-xs font-mono">{line.sku || "-"}</span>
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="number"
                            value={line.quantity}
                            onChange={(e) => updateLine(line.key, "quantity", e.target.value)}
                            placeholder="0"
                            className="w-full text-right text-sm bg-transparent border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="number"
                            value={line.unit_price}
                            onChange={(e) => updateLine(line.key, "unit_price", e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                            className="w-full text-right text-sm bg-transparent border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                          />
                        </td>
                        <td className="py-2 pr-2 text-right font-mono text-sm font-medium">
                          {lineTotal > 0 ? formatCurrency(lineTotal) : "-"}
                        </td>
                        <td className="py-2">
                          <button
                            onClick={() => removeLine(line.key)}
                            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t">
                    <td colSpan={2} className="py-3 pr-2">
                      <button onClick={addLine} className="text-xs text-primary hover:underline cursor-pointer">
                        + Anadir otra linea
                      </button>
                    </td>
                    <td className="py-3 pr-2 text-right font-mono text-sm font-semibold">{totalQty > 0 ? totalQty : ""}</td>
                    <td className="py-3 pr-2 text-right text-xs text-muted-foreground">Total</td>
                    <td className="py-3 pr-2 text-right font-mono text-sm font-bold">{formatCurrency(totalValue)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardContent>
          <FormInput
            label="Notas"
            value={header.notes}
            onChange={(e) => onHeaderChange({ ...header, notes: e.target.value })}
            placeholder="Observaciones del albaran (opcional)"
          />
        </CardContent>
      </Card>
    </div>
  );
}
