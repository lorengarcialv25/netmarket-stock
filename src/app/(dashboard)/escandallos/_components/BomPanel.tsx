"use client";

import { useState, useMemo } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Plus, Trash2, Euro, TrendingUp } from "lucide-react";
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
}

interface BomPanelProps {
  product: Product | null;
  bomItems: BomItem[];
  bomLoading: boolean;
  isAdmin: boolean;
  onAddItem: () => void;
  onDeleteItem: (bomId: string) => void;
  onClose: () => void;
  // BomForm props
  showAddForm: boolean;
  setShowAddForm: (show: boolean) => void;
  availableRawMaterials: RawMaterial[];
  addForm: { raw_material_id: string; quantity: string };
  setAddForm: (form: { raw_material_id: string; quantity: string }) => void;
  addSubmitting: boolean;
}

export function BomPanel({
  product,
  bomItems,
  bomLoading,
  isAdmin,
  onAddItem,
  onDeleteItem,
  onClose,
  showAddForm,
  setShowAddForm,
  availableRawMaterials,
  addForm,
  setAddForm,
  addSubmitting,
}: BomPanelProps) {
  const [confirmDeleteBomId, setConfirmDeleteBomId] = useState<string | null>(null);

  const totalCost = useMemo(() => {
    return bomItems.reduce(
      (sum, item) => sum + item.quantity * item.raw_material_price,
      0
    );
  }, [bomItems]);

  const margin = product ? product.sale_price - totalCost : 0;
  const marginPercent =
    product && product.sale_price > 0
      ? (margin / product.sale_price) * 100
      : 0;

  const bomColumns = [
    {
      key: "raw_material_name",
      label: "Materia Prima",
    },
    {
      key: "raw_material_sku",
      label: "SKU",
    },
    {
      key: "quantity",
      label: "Cantidad",
      render: (item: BomItem) => (
        <span className="font-semibold">
          {formatNumber(item.quantity)} {item.raw_material_unit}
        </span>
      ),
    },
    {
      key: "raw_material_price",
      label: "Coste Unitario",
      render: (item: BomItem) => formatCurrency(item.raw_material_price),
    },
    {
      key: "total",
      label: "Coste Total",
      render: (item: BomItem) =>
        formatCurrency(item.quantity * item.raw_material_price),
    },
    ...(isAdmin
      ? [
          {
            key: "actions",
            label: "",
            render: (item: BomItem) => (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDeleteBomId(item.id)}
                className="text-destructive"
              >
                <Trash2 size={16} />
              </Button>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <Modal
        open={!!product}
        onClose={onClose}
        title={
          product
            ? `Escandallo: ${product.name}`
            : "Escandallo"
        }
        size="xl"
      >
        {product && (
          <div className="flex flex-col gap-5">
            {/* Summary Cards */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
              <div className="bg-muted rounded-md p-4 flex items-center gap-3">
                <Euro size={20} className="text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Coste Total
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    {formatCurrency(totalCost)}
                  </p>
                </div>
              </div>
              <div className="bg-muted rounded-md p-4 flex items-center gap-3">
                <Euro size={20} className="text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Precio Venta
                  </p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(product.sale_price)}
                  </p>
                </div>
              </div>
              <div className="bg-muted rounded-md p-4 flex items-center gap-3">
                <TrendingUp
                  size={20}
                  className={margin >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}
                />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Margen
                  </p>
                  <p className={`text-xl font-bold ${margin >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                    {formatCurrency(margin)}{" "}
                    <span className="text-sm font-medium">
                      ({marginPercent.toFixed(1)}%)
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* BOM Table */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Materias Primas ({bomItems.length})
                </h3>
                {isAdmin && !showAddForm && (
                  <Button size="sm" onClick={() => setShowAddForm(true)}>
                    <Plus size={14} />
                    Anadir
                  </Button>
                )}
              </div>

              {/* Add form */}
              {isAdmin && (
                <BomForm
                  open={showAddForm}
                  onClose={() => {
                    setShowAddForm(false);
                    setAddForm({ raw_material_id: "", quantity: "" });
                  }}
                  availableRawMaterials={availableRawMaterials}
                  form={addForm}
                  setForm={setAddForm}
                  onSubmit={onAddItem}
                  submitting={addSubmitting}
                />
              )}

              <DataTable
                columns={bomColumns}
                data={bomItems}
                loading={bomLoading}
                emptyMessage="No hay materias primas en este escandallo"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Delete BOM Item */}
      <Modal
        open={!!confirmDeleteBomId}
        onClose={() => setConfirmDeleteBomId(null)}
        title="Eliminar Materia Prima"
      >
        <p className="text-muted-foreground mb-6">
          Esta seguro de que desea eliminar esta materia prima del escandallo?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmDeleteBomId(null)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirmDeleteBomId) {
                onDeleteItem(confirmDeleteBomId);
                setConfirmDeleteBomId(null);
              }
            }}
          >
            Eliminar
          </Button>
        </div>
      </Modal>
    </>
  );
}
