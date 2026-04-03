"use client";

import { useState, useMemo } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { getBomUnitOptions } from "@/lib/unitConversion";
import { Plus, Trash2, Pencil, Check, X, Package, Euro, TrendingUp, Percent, Download } from "lucide-react";
import { BomForm } from "./BomForm";

interface Product {
  id: string;
  sku: string;
  name: string;
  product_type: "final" | "raw_material";
  sale_price: number;
  purchase_price: number;
  unit_of_measure: string;
}

interface BomItem {
  id: string;
  product_id: string;
  raw_material_id: string;
  quantity: number;
  quantity_display?: number;
  quantity_unit?: string;
  display_quantity?: number;
  display_unit?: string;
  created_at: string;
  raw_material_name: string;
  raw_material_sku: string;
  raw_material_unit: string;
  raw_material_price: number;
}

interface RawMaterial {
  id: string;
  name: string;
  sku: string;
  unit_of_measure: string;
}

interface BomDetailProps {
  product: Product;
  bomItems: BomItem[];
  bomLoading: boolean;
  isAdmin: boolean;
  /** Exportar este escandallo a Excel (resumen + detalle). */
  onExportExcel?: () => void;
  onAddItem: () => void;
  onDeleteItem: (bomId: string) => void;
  onUpdateItem: (bomId: string, quantity: number, quantityUnit: string) => void;
  showAddForm: boolean;
  setShowAddForm: (show: boolean) => void;
  availableRawMaterials: RawMaterial[];
  addForm: { raw_material_id: string; quantity: string; quantity_unit: string };
  setAddForm: (form: { raw_material_id: string; quantity: string; quantity_unit: string }) => void;
  addSubmitting: boolean;
}

export function BomDetail({
  product,
  bomItems,
  bomLoading,
  isAdmin,
  onExportExcel,
  onAddItem,
  onDeleteItem,
  onUpdateItem,
  showAddForm,
  setShowAddForm,
  availableRawMaterials,
  addForm,
  setAddForm,
  addSubmitting,
}: BomDetailProps) {
  const [confirmDeleteBomId, setConfirmDeleteBomId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [editQuantityUnit, setEditQuantityUnit] = useState("");

  const totalCost = useMemo(() => {
    return bomItems.reduce((sum, item) => sum + item.quantity * item.raw_material_price, 0);
  }, [bomItems]);

  const margin = product.sale_price - totalCost;
  const marginPercent = product.sale_price > 0 ? (margin / product.sale_price) * 100 : 0;
  const costPercent = product.sale_price > 0 ? (totalCost / product.sale_price) * 100 : 0;

  const bomColumns = [
    { key: "raw_material_name", label: "Materia Prima" },
    { key: "raw_material_sku", label: "SKU" },
    {
      key: "quantity",
      label: "Cantidad",
      render: (item: BomItem) => {
        const displayQuantity = item.display_quantity ?? item.quantity_display ?? item.quantity;
        const displayUnit = item.display_unit ?? item.quantity_unit ?? item.raw_material_unit;
        const editOptions = getBomUnitOptions(item.raw_material_unit).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ));

        return editingId === item.id ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={editQuantity}
              onChange={(e) => setEditQuantity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const qty = parseFloat(editQuantity);
                  if (!isNaN(qty) && qty > 0 && editQuantityUnit) {
                    onUpdateItem(item.id, qty, editQuantityUnit);
                    setEditingId(null);
                  }
                }
                if (e.key === "Escape") setEditingId(null);
              }}
              autoFocus
              className="w-20 h-7 rounded border border-input bg-transparent px-2 text-sm outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
            />
            <select
              value={editQuantityUnit}
              onChange={(e) => setEditQuantityUnit(e.target.value)}
              className="h-7 rounded border border-input bg-transparent px-2 text-sm outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
            >
              {editOptions}
            </select>
          </div>
        ) : (
          <span className="font-semibold">
            {formatNumber(displayQuantity)} {displayUnit}
          </span>
        );
      },
    },
    {
      key: "raw_material_price",
      label: "Coste Unit.",
      render: (item: BomItem) => formatCurrency(item.raw_material_price),
    },
    {
      key: "subtotal",
      label: "Subtotal",
      render: (item: BomItem) => (
        <span className="font-semibold">
          {formatCurrency(item.quantity * item.raw_material_price)}
        </span>
      ),
    },
    {
      key: "weight",
      label: "% del Coste",
      render: (item: BomItem) => {
        const pct = totalCost > 0 ? ((item.quantity * item.raw_material_price) / totalCost) * 100 : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">{pct.toFixed(1)}%</span>
          </div>
        );
      },
    },
    ...(isAdmin
      ? [
          {
            key: "actions",
            label: "",
            render: (item: BomItem) =>
              editingId === item.id ? (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const qty = parseFloat(editQuantity);
                      if (!isNaN(qty) && qty > 0 && editQuantityUnit) {
                        onUpdateItem(item.id, qty, editQuantityUnit);
                        setEditingId(null);
                      }
                    }}
                    className="text-emerald-600"
                  >
                    <Check size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingId(null)}
                  >
                    <X size={14} />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingId(item.id);
                      setEditQuantity(String(item.display_quantity ?? item.quantity_display ?? item.quantity));
                      setEditQuantityUnit(item.display_unit ?? item.quantity_unit ?? item.raw_material_unit);
                    }}
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDeleteBomId(item.id)}
                    className="text-destructive"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ),
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Product header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">{product.name}</h2>
            <Badge variant="secondary" className="text-xs">{product.sku}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {bomItems.length} {bomItems.length === 1 ? "componente" : "componentes"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onExportExcel && (
            <Button size="sm" variant="outline" onClick={onExportExcel}>
              <Download size={14} />
              Exportar Excel
            </Button>
          )}
          {isAdmin && !showAddForm && (
            <Button size="sm" onClick={() => setShowAddForm(true)}>
              <Plus size={14} />
              Anadir componente
            </Button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Euro size={14} className="text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Coste</span>
          </div>
          <p className="text-xl font-bold text-foreground">{formatCurrency(totalCost)}</p>
          <p className="text-xs text-muted-foreground mt-1">{costPercent.toFixed(1)}% del PVP</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package size={14} className="text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">PVP</span>
          </div>
          <p className="text-xl font-bold text-foreground">{formatCurrency(product.sale_price)}</p>
          <p className="text-xs text-muted-foreground mt-1">Precio de venta</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className={margin >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"} />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Margen</span>
          </div>
          <p className={`text-xl font-bold ${margin >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
            {formatCurrency(margin)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Beneficio por unidad</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Percent size={14} className={marginPercent >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"} />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">% Margen</span>
          </div>
          <p className={`text-xl font-bold ${marginPercent >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
            {marginPercent.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">Rentabilidad</p>
        </div>
      </div>

      {/* Add form */}
      {isAdmin && (
        <BomForm
          open={showAddForm}
          onClose={() => {
            setShowAddForm(false);
            setAddForm({ raw_material_id: "", quantity: "", quantity_unit: "" });
          }}
          availableRawMaterials={availableRawMaterials}
          form={addForm}
          setForm={setAddForm}
          onSubmit={onAddItem}
          submitting={addSubmitting}
        />
      )}

      {/* BOM Table */}
      <DataTable
        columns={bomColumns}
        data={bomItems}
        loading={bomLoading}
        emptyMessage="No hay componentes en este escandallo. Anade materias primas para calcular el coste."
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!confirmDeleteBomId}
        onClose={() => setConfirmDeleteBomId(null)}
        onConfirm={() => {
          if (confirmDeleteBomId) {
            onDeleteItem(confirmDeleteBomId);
            setConfirmDeleteBomId(null);
          }
        }}
        title="Eliminar componente"
        message="Se eliminara esta materia prima del escandallo. Esta accion no se puede deshacer."
      />
    </div>
  );
}
