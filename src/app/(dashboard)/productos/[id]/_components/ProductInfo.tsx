"use client";

import { getPackagingOptions } from "@/lib/masterBox";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/types";

interface ProductInfoProps {
  product: Product;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value || "-"}</dd>
    </div>
  );
}

export function ProductInfo({ product }: ProductInfoProps) {
  const packagingOptions = getPackagingOptions(product);
  const blister = packagingOptions.find((option) => option.key === "blister");
  const box60 = packagingOptions.find((option) => option.key === "60cm");
  const weightValue =
    product.weight_display && product.weight_display.trim() !== ""
      ? `${product.weight_display} ${product.weight_unit}`.trim()
      : product.weight != null
        ? `${product.weight} ${product.weight_unit}`.trim()
        : null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 ring-1 ring-foreground/5">
      <h2 className="text-sm font-semibold text-foreground mb-4">Informacion General</h2>
      <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
        <Field label="Categoria" value={product.category_name} />
        <Field label="Proveedor" value={product.supplier_name} />
        <Field label="Precio Compra" value={formatCurrency(product.purchase_price)} />
        <Field label="Coste Medio" value={formatCurrency(product.average_cost ?? product.purchase_price)} />
        <Field label="Precio Venta" value={formatCurrency(product.sale_price)} />
        <Field label="Unidad de Medida" value={product.unit_of_measure} />
        <Field label="Peso" value={weightValue} />
        <Field
          label="Caja Blister"
          value={blister ? [blister.unitsLabel, blister.weightLabel].filter(Boolean).join(" · ") : null}
        />
        <Field
          label="Caja 60cm"
          value={box60 ? [box60.unitsLabel, box60.weightLabel].filter(Boolean).join(" · ") : null}
        />
        <Field label="Stock Minimo" value={String(product.min_stock)} />
        {product.description && (
          <div className="col-span-full">
            <Field label="Descripcion" value={product.description} />
          </div>
        )}
      </dl>
    </div>
  );
}
