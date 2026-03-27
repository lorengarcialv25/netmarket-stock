"use client";

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
  return (
    <div className="rounded-xl border border-border bg-card p-5 ring-1 ring-foreground/5">
      <h2 className="text-sm font-semibold text-foreground mb-4">Informacion General</h2>
      <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
        <Field label="Categoria" value={product.category_name} />
        <Field label="Proveedor" value={product.supplier_name} />
        <Field label="Precio Compra" value={formatCurrency(product.purchase_price)} />
        <Field label="Precio Venta" value={formatCurrency(product.sale_price)} />
        <Field label="Unidad de Medida" value={product.unit_of_measure} />
        <Field label="Peso" value={product.weight != null ? `${product.weight} ${product.weight_unit}` : null} />
        <Field label="Unidades / Caja" value={product.units_per_box != null ? String(product.units_per_box) : null} />
        <Field label="Kg / Caja" value={product.kg_per_box != null ? String(product.kg_per_box) : null} />
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
