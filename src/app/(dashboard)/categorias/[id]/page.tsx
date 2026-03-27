"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { dypai } from "@/lib/dypai";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/Spinner";
import { CategoryHeader } from "./_components/CategoryHeader";
import { CategoryStats } from "./_components/CategoryStats";
import { CategoryProductsTable } from "./_components/CategoryProductsTable";

interface CategoryDetail {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  product_count: number;
  total_stock: number;
  total_value: number;
  low_stock_count: number;
}

export default function CategoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const canManage = user?.role === "admin" || user?.role === "warehouse_manager";

  const [category, setCategory] = useState<CategoryDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    async function fetchCategory() {
      setLoading(true);
      const { data } = await dypai.api.get("get_category_detail", {
        params: { category_id: id },
      });
      if (data && Array.isArray(data) && data.length > 0) {
        const d = data[0];
        setCategory({
          ...d,
          product_count: Number(d.product_count),
          total_stock: Number(d.total_stock),
          total_value: Number(d.total_value),
          low_stock_count: Number(d.low_stock_count),
        });
      }
      setLoading(false);
    }
    fetchCategory();
  }, [id]);

  useEffect(() => {
    async function fetchProducts() {
      setProductsLoading(true);
      const { data } = await dypai.api.get("get_category_products", {
        params: { category_id: id },
      });
      if (data && Array.isArray(data)) {
        setProducts(data.map((p) => ({ ...p, total_stock: Number(p.total_stock) })));
      }
      setProductsLoading(false);
    }
    fetchProducts();
  }, [id]);

  const handleEdit = () => {
    window.location.href = `/categorias?edit=${id}`;
  };

  if (loading) {
    return (
      <div className="py-24">
        <Spinner size="md" label="Cargando categoria..." />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="py-24 text-center text-muted-foreground">
        Categoria no encontrada
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CategoryHeader
        name={category.name}
        description={category.description}
        canManage={canManage}
        onEdit={handleEdit}
      />
      <CategoryStats
        productCount={category.product_count}
        totalStock={category.total_stock}
        totalValue={category.total_value}
        lowStockCount={category.low_stock_count}
      />
      <CategoryProductsTable products={products} loading={productsLoading} />
    </div>
  );
}
