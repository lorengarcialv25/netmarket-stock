"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { dypai } from "@/lib/dypai";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { sileo } from "sileo";
import { PageHeader } from "@/components/shared/PageHeader";
import { FormInput } from "@/components/ui/FormInput";
import { Button } from "@/components/ui/button";
import { ProductList } from "./_components/ProductList";
import { BomDetail } from "./_components/BomDetail";
import { ClipboardList, Search, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { exportEscandallosWorkbook, exportSingleBomWorkbook } from "@/lib/bomExport";

const LIST_PAGE_SIZE = 15;

interface Product {
  id: string;
  sku: string;
  name: string;
  product_type: "final" | "raw_material";
  sale_price: number;
  purchase_price: number;
  unit_of_measure: string;
  total_count?: number;
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

export default function EscandallosPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // Final products (server-side paginated)
  const [products, setProducts] = useState<Product[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [listPage, setListPage] = useState(1);

  // Raw materials (for BomForm dropdown)
  const [rawMaterials, setRawMaterials] = useState<Product[]>([]);

  // BOM state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [bomItems, setBomItems] = useState<BomItem[]>([]);
  const [bomLoading, setBomLoading] = useState(false);

  // Add item form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ raw_material_id: "", quantity: "" });
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);

  const fetchFinalProducts = useCallback(async (page: number, searchTerm: string) => {
    setLoading(true);
    const params: Record<string, unknown> = {
      product_type: "final",
      page,
      page_size: LIST_PAGE_SIZE,
    };
    if (searchTerm) params.search = searchTerm;
    const { data } = await dypai.api.get("list_products", { params });
    if (data && Array.isArray(data)) {
      setProducts(data);
      setTotalItems(data.length > 0 ? Number(data[0].total_count) : 0);
    } else {
      setProducts([]);
      setTotalItems(0);
    }
    setLoading(false);
  }, []);

  // Fetch raw materials once for the BomForm dropdown
  useEffect(() => {
    async function fetchRawMaterials() {
      const { data } = await dypai.api.get("list_products", {
        params: { product_type: "raw_material", page_size: 10000 },
      });
      if (data && Array.isArray(data)) setRawMaterials(data);
    }
    fetchRawMaterials();
  }, []);

  // Fetch final products when page or search changes
  useEffect(() => {
    fetchFinalProducts(listPage, debouncedSearch);
  }, [listPage, debouncedSearch, fetchFinalProducts]);

  // Reset page when search changes
  useEffect(() => {
    setListPage(1);
  }, [debouncedSearch]);

  const listTotalPages = Math.max(1, Math.ceil(totalItems / LIST_PAGE_SIZE));

  const availableRawMaterials = useMemo(() => {
    const usedIds = new Set(bomItems.map((b) => b.raw_material_id));
    return rawMaterials.filter((rm) => !usedIds.has(rm.id));
  }, [rawMaterials, bomItems]);

  async function openBom(product: Product) {
    setSelectedProduct(product);
    setBomLoading(true);
    setShowAddForm(false);
    setAddForm({ raw_material_id: "", quantity: "" });
    const { data } = await dypai.api.get("get_bill_of_materials", {
      params: { product_id: product.id },
    });
    setBomItems(data || []);
    setBomLoading(false);
  }

  async function handleAddBomItem() {
    if (!selectedProduct || !addForm.raw_material_id || !addForm.quantity) return;
    setAddSubmitting(true);

    const qty = parseFloat(addForm.quantity);
    if (isNaN(qty) || qty <= 0) {
      sileo.error({ title: "Cantidad inválida" });
      setAddSubmitting(false);
      return;
    }

    const { error } = await dypai.api.post("add_bom_item", {
      product_id: selectedProduct.id,
      raw_material_id: addForm.raw_material_id,
      quantity: qty,
    });

    setAddSubmitting(false);

    if (error) {
      console.error("Error al añadir componente:", error);
      sileo.error({ title: "Error al añadir componente", description: error.message });
      return;
    }

    sileo.success({ title: "Componente añadido" });
    setAddForm({ raw_material_id: "", quantity: "" });
    setShowAddForm(false);

    const { data } = await dypai.api.get("get_bill_of_materials", {
      params: { product_id: selectedProduct.id },
    });
    setBomItems(data || []);
  }

  async function handleUpdateBomItem(bomId: string, quantity: number) {
    const { error } = await dypai.api.put("update_bom_item", { id: bomId, quantity });
    if (error) { sileo.error({ title: "Error al actualizar componente" }); return; }
    sileo.success({ title: "Cantidad actualizada" });

    if (selectedProduct) {
      const { data } = await dypai.api.get("get_bill_of_materials", {
        params: { product_id: selectedProduct.id },
      });
      setBomItems(data || []);
    }
  }

  async function handleDeleteBomItem(bomId: string) {
    const { error } = await dypai.api.delete("delete_bom_item", { params: { id: bomId } });
    if (error) { sileo.error({ title: "Error al eliminar componente" }); return; }
    sileo.success({ title: "Componente eliminado" });

    if (selectedProduct) {
      const { data } = await dypai.api.get("get_bill_of_materials", {
        params: { product_id: selectedProduct.id },
      });
      setBomItems(data || []);
    }
  }

  async function handleExportAll() {
    setExportingAll(true);
    try {
      const result = await exportEscandallosWorkbook((name, opts) =>
        dypai.api.get(name, opts)
      );
      if (!result.ok) {
        sileo.warning({ title: result.message });
        return;
      }
      sileo.success({ title: "Exportación completada" });
    } finally {
      setExportingAll(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={<ClipboardList size={24} className="text-primary" />}
        title="Escandallos"
        showAction={false}
        extraActions={
          <Button
            variant="outline"
            size="sm"
            disabled={exportingAll}
            onClick={handleExportAll}
          >
            <Download size={14} />
            {exportingAll ? "Exportando…" : "Exportar todos (Excel)"}
          </Button>
        }
      />

      <div className="flex gap-6 min-h-[calc(100vh-220px)]">
        {/* Left panel: product list */}
        <div className="w-80 shrink-0 rounded-xl border border-border bg-card ring-1 ring-foreground/5 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-border">
            <FormInput
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search size={14} />}
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            <ProductList
              products={products}
              selectedId={selectedProduct?.id ?? null}
              onSelect={openBom}
              loading={loading}
            />
          </div>
          <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">
              {totalItems} {totalItems === 1 ? "producto" : "productos"}
            </p>
            {listTotalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setListPage((p) => p - 1)}
                  disabled={listPage <= 1}
                >
                  <ChevronLeft size={14} />
                </Button>
                <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
                  {listPage} / {listTotalPages}
                </span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setListPage((p) => p + 1)}
                  disabled={listPage >= listTotalPages}
                >
                  <ChevronRight size={14} />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right panel: BOM detail */}
        <div className="flex-1 min-w-0">
          {selectedProduct ? (
            <div className="rounded-xl border border-border bg-card ring-1 ring-foreground/5 p-6 h-full overflow-y-auto">
              <BomDetail
                product={selectedProduct}
                bomItems={bomItems}
                bomLoading={bomLoading}
                isAdmin={isAdmin}
                onExportExcel={() => {
                  exportSingleBomWorkbook(selectedProduct, bomItems);
                  sileo.success({ title: "Escandallo exportado" });
                }}
                onAddItem={handleAddBomItem}
                onDeleteItem={handleDeleteBomItem}
                onUpdateItem={handleUpdateBomItem}
                showAddForm={showAddForm}
                setShowAddForm={setShowAddForm}
                availableRawMaterials={availableRawMaterials}
                addForm={addForm}
                setAddForm={setAddForm}
                addSubmitting={addSubmitting}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card ring-1 ring-foreground/5 h-full flex items-center justify-center">
              <div className="text-center">
                <ClipboardList size={48} className="text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">Selecciona un producto</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Elige un producto final de la lista para ver su escandallo
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
