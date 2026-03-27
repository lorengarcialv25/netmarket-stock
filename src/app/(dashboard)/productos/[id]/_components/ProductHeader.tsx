"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil } from "lucide-react";
import { productTypeLabel } from "@/lib/utils";
import { ProductImage } from "@/components/shared/ProductImage";
import type { Product } from "@/lib/types";

interface ProductHeaderProps {
  product: Product;
  isAdmin: boolean;
  onEdit: () => void;
}

export function ProductHeader({ product, isAdmin, onEdit }: ProductHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/productos")}>
          <ArrowLeft size={18} />
        </Button>
        <ProductImage filePath={product.image_url} alt={product.name} />
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-foreground">{product.name}</h1>
            <Badge
              variant="secondary"
              className={
                product.product_type === "final"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0"
                  : ""
              }
            >
              {productTypeLabel(product.product_type)}
            </Badge>
            <Badge
              variant={product.is_active ? "secondary" : "default"}
              className={
                product.is_active
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0"
                  : ""
              }
            >
              {product.is_active ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">SKU: {product.sku}</p>
        </div>
      </div>
      {isAdmin && (
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil size={14} />
          Editar
        </Button>
      )}
    </div>
  );
}
