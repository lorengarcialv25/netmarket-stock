"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { dypai } from "@/lib/dypai";
import { useAuth } from "@/hooks/useAuth";
import { sileo } from "sileo";
import { Spinner } from "@/components/ui/Spinner";
import { ProductHeader } from "./_components/ProductHeader";
import { ProductInfo } from "./_components/ProductInfo";
import { ProductStockSection } from "./_components/ProductStockSection";
import { StockChart } from "./_components/StockChart";
import { ProductMovements } from "./_components/ProductMovements";
import { ProductBom } from "./_components/ProductBom";
import { ProductForm, type ProductFormData } from "../_components/ProductForm";
import type { Product, WarehouseStock, StockMovement, BillOfMaterial } from "@/lib/types";

const MOVEMENTS_PAGE_SIZE = 10;

interface CatalogOption {
  id: string;
  name: string;
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const [stock, setStock] = useState<WarehouseStock[]>([]);
  const [stockLoading, setStockLoading] = useState(true);

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementsTotal, setMovementsTotal] = useState(0);
  const [movementsPage, setMovementsPage] = useState(1);
  const [movementsLoading, setMovementsLoading] = useState(true);

  const [bomItems, setBomItems] = useState<BillOfMaterial[]>([]);
  const [bomLoading, setBomLoading] = useState(false);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [categories, setCategories] = useState<CatalogOption[]>([]);
  const [suppliers, setSuppliers] = useState<CatalogOption[]>([]);
  const [editForm, setEditForm] = useState<ProductFormData>({
    sku: "", name: "", description: "", product_type: "final",
    category_id: "", supplier_id: "", unit_of_measure: "unidades",
    purchase_price: "", sale_price: "", min_stock: "",
    weight: "", weight_unit: "gramo", units_per_box: "", kg_per_box: "",
    image_url: "",
  });

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    const { data } = await dypai.api.get("get_product", {
      params: { product_id: id },
    });
    if (data && Array.isArray(data) && data.length > 0) {
      setProduct(data[0]);
    }
    setLoading(false);
  }, [id]);

  // Fetch product details
  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // Fetch stock
  useEffect(() => {
    async function fetchStock() {
      setStockLoading(true);
      const { data } = await dypai.api.get("get_product_stock", {
        params: { product_id: id },
      });
      if (data && Array.isArray(data)) {
        setStock(data);
      }
      setStockLoading(false);
    }
    fetchStock();
  }, [id]);

  // Fetch movements (paginated)
  const fetchMovements = useCallback(async (page: number) => {
    setMovementsLoading(true);
    const { data } = await dypai.api.get("get_product_movements", {
      params: { product_id: id, page, page_size: MOVEMENTS_PAGE_SIZE },
    });
    if (data && Array.isArray(data)) {
      setMovements(data);
      setMovementsTotal(data.length > 0 ? Number(data[0].total_count) : 0);
    } else {
      setMovements([]);
      setMovementsTotal(0);
    }
    setMovementsLoading(false);
  }, [id]);

  useEffect(() => {
    fetchMovements(movementsPage);
  }, [movementsPage, fetchMovements]);

  // Fetch BOM (only for "final" products)
  useEffect(() => {
    if (!product || product.product_type !== "final") return;
    async function fetchBom() {
      setBomLoading(true);
      const { data } = await dypai.api.get("get_bill_of_materials", {
        params: { product_id: id },
      });
      if (data && Array.isArray(data)) {
        setBomItems(data);
      }
      setBomLoading(false);
    }
    fetchBom();
  }, [id, product]);

  const handleEdit = async () => {
    // Load catalogs if not yet loaded
    if (categories.length === 0 || suppliers.length === 0) {
      const [catRes, supRes] = await Promise.all([
        dypai.api.get("list_categories"),
        dypai.api.get("list_suppliers"),
      ]);
      if (catRes.data) setCategories(catRes.data);
      if (supRes.data) setSuppliers(supRes.data);
    }
    // Populate form with current product data
    if (product) {
      setEditForm({
        sku: product.sku,
        name: product.name,
        description: product.description || "",
        product_type: product.product_type,
        category_id: product.category_id || "",
        supplier_id: product.supplier_id || "",
        unit_of_measure: product.unit_of_measure,
        purchase_price: String(product.purchase_price),
        sale_price: String(product.sale_price),
        min_stock: String(product.min_stock),
        weight: product.weight != null ? String(product.weight) : "",
        weight_unit: product.weight_unit || "gramo",
        units_per_box: product.units_per_box != null ? String(product.units_per_box) : "",
        kg_per_box: product.kg_per_box != null ? String(product.kg_per_box) : "",
        image_url: product.image_url || "",
      });
    }
    setEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    const body = {
      ...editForm,
      purchase_price: parseFloat(editForm.purchase_price) || 0,
      sale_price: parseFloat(editForm.sale_price) || 0,
      min_stock: parseInt(editForm.min_stock) || 0,
      weight: parseFloat(editForm.weight) || null,
      units_per_box: parseInt(editForm.units_per_box) || null,
      kg_per_box: parseFloat(editForm.kg_per_box) || null,
    };
    const { error } = await dypai.api.put("update_product", { ...body, id });
    if (error) { sileo.error({ title: "Error al actualizar producto" }); return; }
    sileo.success({ title: "Producto actualizado" });
    setEditModalOpen(false);
    fetchProduct();
  };

  if (loading) {
    return (
      <div className="py-24">
        <Spinner size="md" label="Cargando producto..." />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-24 text-center text-muted-foreground">
        Producto no encontrado
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProductHeader product={product} isAdmin={isAdmin ?? false} onEdit={handleEdit} />
      <ProductInfo product={product} />
      <ProductStockSection
        stock={stock}
        loading={stockLoading}
        purchasePrice={product.purchase_price}
        minStock={product.min_stock}
      />
      <StockChart productId={id} unitOfMeasure={product.unit_of_measure} />
      <ProductMovements
        movements={movements}
        loading={movementsLoading}
        totalItems={movementsTotal}
        page={movementsPage}
        pageSize={MOVEMENTS_PAGE_SIZE}
        onPageChange={setMovementsPage}
      />
      {product.product_type === "final" && (
        <ProductBom
          bomItems={bomItems}
          loading={bomLoading}
          salePrice={product.sale_price}
          exportMeta={{
            sku: product.sku,
            name: product.name,
            unit_of_measure: product.unit_of_measure,
            sale_price: product.sale_price,
          }}
        />
      )}

      <ProductForm
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        editingProduct={product}
        form={editForm}
        setForm={setEditForm}
        onSubmit={handleEditSubmit}
        categories={categories}
        suppliers={suppliers}
      />
    </div>
  );
}
