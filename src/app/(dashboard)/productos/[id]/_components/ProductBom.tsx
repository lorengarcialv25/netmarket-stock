"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { exportSingleBomWorkbook } from "@/lib/bomExport";
import { sileo } from "sileo";
import { Euro, TrendingUp, Download } from "lucide-react";
import type { BillOfMaterial } from "@/lib/types";

interface ProductBomProps {
  bomItems: BillOfMaterial[];
  loading: boolean;
  salePrice: number;
  /** Si se indica, se puede exportar el escandallo a Excel desde la ficha de producto. */
  exportMeta?: {
    sku: string;
    name: string;
    unit_of_measure: string;
    sale_price: number;
  };
}

export function ProductBom({ bomItems, loading, salePrice, exportMeta }: ProductBomProps) {
  const totalCost = useMemo(
    () => bomItems.reduce((sum, item) => sum + item.quantity * (item.raw_material_price ?? 0), 0),
    [bomItems]
  );

  const margin = salePrice - totalCost;
  const marginPercent = salePrice > 0 ? (margin / salePrice) * 100 : 0;

  const columns = [
    { key: "raw_material_name", label: "Materia Prima" },
    { key: "raw_material_sku", label: "SKU" },
    {
      key: "quantity",
      label: "Cantidad",
      render: (item: BillOfMaterial) => (
        <span className="font-semibold">
          {formatNumber(item.display_quantity ?? item.quantity_display ?? item.quantity)} {item.display_unit ?? item.quantity_unit ?? item.raw_material_unit}
        </span>
      ),
    },
    {
      key: "raw_material_price",
      label: "Coste Unitario",
      render: (item: BillOfMaterial) => formatCurrency(item.raw_material_price ?? 0),
    },
    {
      key: "total",
      label: "Coste Total",
      render: (item: BillOfMaterial) => formatCurrency(item.quantity * (item.raw_material_price ?? 0)),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-semibold text-foreground">Escandallo</h2>
        {exportMeta && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              exportSingleBomWorkbook(
                {
                  id: "",
                  sku: exportMeta.sku,
                  name: exportMeta.name,
                  unit_of_measure: exportMeta.unit_of_measure,
                  sale_price: exportMeta.sale_price,
                },
                bomItems
              );
              sileo.success({ title: "Escandallo exportado" });
            }}
          >
            <Download size={14} />
            Exportar Excel
          </Button>
        )}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        <div className="bg-muted rounded-lg p-4 flex items-center gap-3">
          <Euro size={20} className="text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Coste Total</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(totalCost)}</p>
          </div>
        </div>
        <div className="bg-muted rounded-lg p-4 flex items-center gap-3">
          <Euro size={20} className="text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="text-xs text-muted-foreground">Precio Venta</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(salePrice)}
            </p>
          </div>
        </div>
        <div className="bg-muted rounded-lg p-4 flex items-center gap-3">
          <TrendingUp
            size={20}
            className={margin >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}
          />
          <div>
            <p className="text-xs text-muted-foreground">Margen</p>
            <p className={`text-xl font-bold ${margin >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
              {formatCurrency(margin)}{" "}
              <span className="text-sm font-medium">({marginPercent.toFixed(1)}%)</span>
            </p>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={bomItems}
        loading={loading}
        emptyMessage="No hay materias primas en este escandallo"
      />
    </div>
  );
}
