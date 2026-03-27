"use client";

import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  sku: string;
  name: string;
  product_type: "final" | "raw_material";
  sale_price: number;
  purchase_price: number;
  unit_of_measure: string;
}

interface ProductListProps {
  products: Product[];
  selectedId: string | null;
  onSelect: (product: Product) => void;
  loading: boolean;
}

export function ProductList({ products, selectedId, onSelect, loading }: ProductListProps) {
  if (loading) {
    return (
      <div className="py-12">
        <Spinner size="md" label="Cargando..." />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No se encontraron productos
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {products.map((product) => (
        <button
          key={product.id}
          onClick={() => onSelect(product)}
          className={cn(
            "flex items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors border-b border-border/50 cursor-pointer w-full",
            selectedId === product.id
              ? "bg-primary/5 border-l-2 border-l-primary"
              : "hover:bg-muted/50 border-l-2 border-l-transparent"
          )}
        >
          <div className="min-w-0 flex-1">
            <p className={cn(
              "text-sm font-medium truncate",
              selectedId === product.id ? "text-primary" : "text-foreground"
            )}>
              {product.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{product.sku}</p>
          </div>
          <Badge variant="secondary" className="shrink-0 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
            {formatCurrency(product.sale_price)}
          </Badge>
        </button>
      ))}
    </div>
  );
}
