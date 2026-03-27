"use client";

import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/utils";
import { Package } from "lucide-react";

interface Product {
  id: string;
  sku: string;
  name: string;
  product_type: "final" | "raw_material";
  sale_price: number;
  purchase_price: number;
  unit_of_measure: string;
}

interface ProductGridProps {
  products: Product[];
  onSelect: (product: Product) => void;
  loading: boolean;
}

export function ProductGrid({ products, onSelect, loading }: ProductGridProps) {
  if (loading) {
    return (
      <div className="py-12">
        <Spinner size="md" label="Cargando productos..." />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No se encontraron productos finales
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
      {products.map((product) => (
        <div
          key={product.id}
          onClick={() => onSelect(product)}
          className="bg-card rounded-lg border border-border p-5 cursor-pointer transition-all shadow-sm hover:border-primary hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package
                size={20}
                className="text-primary shrink-0"
              />
              <h3 className="text-base font-semibold text-foreground">
                {product.name}
              </h3>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">{product.sku}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Precio venta
            </span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(product.sale_price)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
