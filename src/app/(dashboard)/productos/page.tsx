"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { dypai } from "@/lib/dypai";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { sileo } from "sileo";
import { Package, Download } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { ProductTable } from "./_components/ProductTable";
import { ProductFilters } from "./_components/ProductFilters";
import { ProductForm, type ProductFormData } from "./_components/ProductForm";
import { exportToExcel } from "@/lib/exportExcel";
import type { Product } from "@/lib/types";

interface Category {
  id: string;
  name: string;
}

interface SupplierOption {
  id: string;
  name: string;
}

const PAGE_SIZE = 15;

const initialForm: ProductFormData = {
  sku: "",
  name: "",
  description: "",
  product_type: "final" as "final" | "raw_material",
  category_id: "",
  supplier_id: "",
  unit_of_measure: "unidades",
  purchase_price: "",
  sale_price: "",
  min_stock: "",
  weight: "",
  weight_unit: "gramo",
  units_per_box: "",
  kg_per_box: "",
  image_url: "",
};

export default function ProductosPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const isAdmin = user?.role === "admin";

  const [products, setProducts] = useState<Product[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>(initialForm);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const debouncedSearch = useDebounce(search);
  const [exporting, setExporting] = useState(false);

  const fetchProducts = useCallback(async (p: number) => {
    setLoading(true);
    const params: Record<string, unknown> = { page: p, page_size: PAGE_SIZE };
    if (debouncedSearch) params.search = debouncedSearch;
    if (filterType) params.product_type = filterType;
    if (filterCategory) params.category_id = filterCategory;

    const { data } = await dypai.api.get("list_products", { params });
    if (data && Array.isArray(data)) {
      setProducts(data);
      setTotalItems(data.length > 0 ? Number(data[0].total_count) : 0);
    } else {
      setProducts([]);
      setTotalItems(0);
    }
    setLoading(false);
  }, [debouncedSearch, filterType, filterCategory]);

  const fetchCatalogs = useCallback(async () => {
    const [categoriesRes, suppliersRes] = await Promise.all([
      dypai.api.get("list_categories"),
      dypai.api.get("list_suppliers"),
    ]);
    if (categoriesRes.data) setCategories(categoriesRes.data);
    if (suppliersRes.data) setSuppliers(suppliersRes.data);
  }, []);

  useEffect(() => {
    fetchCatalogs();
  }, [fetchCatalogs]);

  useEffect(() => {
    fetchProducts(page);
  }, [page, fetchProducts]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterType, filterCategory]);

  // Auto-open create modal from quick actions
  useEffect(() => {
    if (searchParams.get("action") === "create" && isAdmin) {
      openCreateModal();
      window.history.replaceState(null, "", window.location.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const handler = () => { if (isAdmin) openCreateModal(); };
    window.addEventListener("quick-action-create", handler);
    return () => window.removeEventListener("quick-action-create", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setForm({
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
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const body = {
      ...form,
      purchase_price: parseFloat(form.purchase_price) || 0,
      sale_price: parseFloat(form.sale_price) || 0,
      min_stock: parseInt(form.min_stock) || 0,
      weight: parseFloat(form.weight) || null,
      units_per_box: parseInt(form.units_per_box) || null,
      kg_per_box: parseFloat(form.kg_per_box) || null,
    };

    if (editingProduct) {
      const { error } = await dypai.api.put("update_product", { ...body, id: editingProduct.id });
      if (error) { sileo.error({ title: "Error al actualizar producto" }); return; }
      sileo.success({ title: "Producto actualizado" });
    } else {
      const { error } = await dypai.api.post("create_product", body);
      if (error) { sileo.error({ title: "Error al crear producto" }); return; }
      sileo.success({ title: "Producto creado" });
    }

    setModalOpen(false);
    fetchProducts(page);
  };

  const handleDelete = async (id: string) => {
    const { error } = await dypai.api.delete("delete_product", { params: { id } });
    setConfirmDeleteId(null);
    if (error) { sileo.error({ title: "Error al eliminar producto" }); return; }
    sileo.success({ title: "Producto eliminado" });
    fetchProducts(page);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data, error } = await dypai.api.get("list_products", {
        params: { page_size: 10000 },
      });
      if (error || !data || !Array.isArray(data)) {
        sileo.error({ title: "Error al exportar el catálogo" });
        return;
      }
      const rows = (data as Product[]).map((p) => {
        const w = p.weight;
        const pesoMedida =
          w != null && String(w) !== ""
            ? `${w} ${p.weight_unit ?? ""}`.trim()
            : "—";
        return {
          ...p,
          peso_medida: pesoMedida,
        } as Record<string, unknown>;
      });
      exportToExcel(rows, [
        { key: "sku", label: "SKU" },
        { key: "name", label: "Nombre" },
        {
          key: "description",
          label: "Descripción",
          format: (v) => (v == null || String(v) === "" ? "—" : String(v)),
        },
        {
          key: "product_type",
          label: "Tipo",
          format: (v) => (v === "final" ? "Producto final" : "Materia prima"),
        },
        { key: "category_name", label: "Categoría" },
        { key: "supplier_name", label: "Proveedor" },
        { key: "unit_of_measure", label: "Unidad" },
        {
          key: "purchase_price",
          label: "Precio compra (€)",
          format: (v) => Number(v) || 0,
        },
        {
          key: "sale_price",
          label: "Precio venta (€)",
          format: (v) => Number(v) || 0,
        },
        {
          key: "min_stock",
          label: "Stock mínimo",
          format: (v) => Number(v) || 0,
        },
        {
          key: "is_active",
          label: "Activo",
          format: (v) => (v === true ? "Sí" : "No"),
        },
        { key: "peso_medida", label: "Peso / unidad peso" },
      ], "catalogo_productos", "Catálogo");
      sileo.success({ title: "Exportación completada" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Package size={24} className="text-primary" />}
        title="Productos"
        actionLabel="Nuevo Producto"
        onAction={openCreateModal}
        showAction={isAdmin}
        extraActions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
          >
            <Download size={14} />
            {exporting ? "Exportando…" : "Exportar Excel"}
          </Button>
        }
      />

      <ProductFilters
        search={search}
        onSearchChange={setSearch}
        filterType={filterType}
        setFilterType={setFilterType}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        categories={categories}
      />

      <ProductTable
        products={products}
        loading={loading}
        isAdmin={isAdmin ?? false}
        onEdit={openEditModal}
        onDelete={setConfirmDeleteId}
        serverPagination={{
          page,
          pageSize: PAGE_SIZE,
          totalItems,
          onPageChange: setPage,
        }}
      />

      <ProductForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editingProduct={editingProduct}
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        categories={categories}
        suppliers={suppliers}
      />

      <ConfirmDialog
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        title="Confirmar Eliminacion"
        message="Esta seguro de que desea eliminar este producto? Esta accion no se puede deshacer."
      />
    </div>
  );
}
