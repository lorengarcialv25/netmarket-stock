"use client";

import { useEffect, useState, useCallback } from "react";
import { dypai } from "@/lib/dypai";
import { useAuth } from "@/hooks/useAuth";
import { sileo } from "sileo";
import { Link2, Plus, Trash2, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { FilterBar } from "@/components/shared/FilterBar";
import { FormInput, FormSelect } from "@/components/ui/FormInput";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";
import type { SupplierProductRef } from "@/lib/types";

interface SelectOption { value: string; label: string }

export default function ReferenciasPage() {
  const { user } = useAuth();
  const [refs, setRefs] = useState<SupplierProductRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [suppliers, setSuppliers] = useState<SelectOption[]>([]);
  const [products, setProducts] = useState<SelectOption[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    supplier_id: "",
    product_id: "",
    supplier_sku: "",
    supplier_name: "",
    supplier_barcode: "",
    notes: "",
  });

  const canManage = user?.role === "admin" || user?.role === "warehouse_manager";

  const fetchRefs = useCallback(async () => {
    setLoading(true);
    const { data } = await dypai.api.get("list_supplier_refs", {
      params: supplierFilter ? { supplier_id: supplierFilter } : {},
    });
    if (data && Array.isArray(data)) {
      setRefs(data.map((r: Record<string, unknown>) => ({
        id: String(r.id),
        supplier_id: String(r.supplier_id),
        product_id: String(r.product_id),
        supplier_sku: String(r.supplier_sku ?? ""),
        supplier_name: r.supplier_name ? String(r.supplier_name) : null,
        supplier_barcode: r.supplier_barcode ? String(r.supplier_barcode) : null,
        notes: r.notes ? String(r.notes) : null,
        created_at: String(r.created_at),
        updated_at: String(r.updated_at),
        supplier_name_display: String(r.supplier_name_display ?? r.supplier_name ?? ""),
        product_sku: String(r.product_sku ?? ""),
        product_name: String(r.product_name ?? ""),
        product_type: String(r.product_type ?? ""),
      })));
    }
    setLoading(false);
  }, [supplierFilter]);

  const fetchOptions = useCallback(async () => {
    const [supRes, prodRes] = await Promise.all([
      dypai.api.get("list_suppliers"),
      dypai.api.get("list_products"),
    ]);
    if (supRes.data && Array.isArray(supRes.data))
      setSuppliers((supRes.data as { id: string; name: string }[]).map((s) => ({ value: s.id, label: s.name })));
    if (prodRes.data && Array.isArray(prodRes.data))
      setProducts((prodRes.data as { id: string; sku: string; name: string }[]).map((p) => ({ value: p.id, label: `${p.sku} — ${p.name}` })));
  }, []);

  useEffect(() => { fetchRefs(); }, [fetchRefs]);
  useEffect(() => { fetchOptions(); }, [fetchOptions]);

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const openCreate = () => {
    setForm({ supplier_id: supplierFilter, product_id: "", supplier_sku: "", supplier_name: "", supplier_barcode: "", notes: "" });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.supplier_id || !form.product_id || !form.supplier_sku.trim()) {
      sileo.error({ title: "Proveedor, producto y referencia son obligatorios" });
      return;
    }
    setSubmitting(true);
    const { error } = await dypai.api.post("create_supplier_ref", form);
    if (error) {
      sileo.error({ title: "Error al crear referencia" });
    } else {
      sileo.success({ title: "Referencia creada" });
      setModalOpen(false);
      fetchRefs();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await dypai.api.delete("delete_supplier_ref", { params: { id } });
    setConfirmDeleteId(null);
    if (error) { sileo.error({ title: "Error al eliminar" }); return; }
    sileo.success({ title: "Referencia eliminada" });
    fetchRefs();
  };

  const filtered = refs.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.supplier_sku.toLowerCase().includes(q) ||
      (r.supplier_name || "").toLowerCase().includes(q) ||
      (r.product_sku || "").toLowerCase().includes(q) ||
      (r.product_name || "").toLowerCase().includes(q) ||
      (r.supplier_barcode || "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Link2 size={24} className="text-primary" />}
        title="Referencias de Proveedor"
        actionLabel="Nueva Referencia"
        onAction={openCreate}
        showAction={canManage}
      />

      <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Buscar por SKU, nombre, codigo de barras...">
        <FormSelect
          label="Proveedor"
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
          options={[{ value: "", label: "Todos" }, ...suppliers]}
          triggerClassName="w-[200px]"
        />
      </FilterBar>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="px-5 py-12 text-center text-muted-foreground">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-muted-foreground">
            {refs.length === 0 ? "No hay referencias de proveedor. Crea la primera para vincular SKUs." : "Sin resultados para la busqueda"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="text-left px-4 py-3 font-semibold">Proveedor</th>
                  <th className="text-left px-4 py-3 font-semibold">Ref. Proveedor</th>
                  <th className="text-left px-4 py-3 font-semibold">Nombre Proveedor</th>
                  <th className="text-left px-4 py-3 font-semibold">Mi Producto</th>
                  <th className="text-left px-4 py-3 font-semibold">Mi SKU</th>
                  <th className="text-left px-4 py-3 font-semibold">Cod. Barras</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((ref) => (
                  <tr key={ref.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3 text-sm text-foreground">
                      {suppliers.find((s) => s.value === ref.supplier_id)?.label || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono font-medium text-foreground">{ref.supplier_sku}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{ref.supplier_name || "—"}</td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{ref.product_name || "—"}</td>
                    <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{ref.product_sku || "—"}</td>
                    <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{ref.supplier_barcode || "—"}</td>
                    <td className="px-4 py-3">
                      {canManage && (
                        <button
                          onClick={() => setConfirmDeleteId(ref.id)}
                          className="p-1 rounded hover:bg-destructive/10 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} className="text-destructive" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Referencia de Proveedor" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="Proveedor *"
              value={form.supplier_id}
              onChange={(e) => set("supplier_id", e.target.value)}
              options={[{ value: "", label: "Seleccionar..." }, ...suppliers]}
            />
            <FormSelect
              label="Mi Producto *"
              value={form.product_id}
              onChange={(e) => set("product_id", e.target.value)}
              options={[{ value: "", label: "Seleccionar..." }, ...products]}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Referencia del proveedor (SKU) *"
              value={form.supplier_sku}
              onChange={(e) => set("supplier_sku", e.target.value)}
              placeholder="Ej: REF-ABC-123"
            />
            <FormInput
              label="Nombre del proveedor para este articulo"
              value={form.supplier_name}
              onChange={(e) => set("supplier_name", e.target.value)}
              placeholder="Ej: Botella negra 1L"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Codigo de barras"
              value={form.supplier_barcode}
              onChange={(e) => set("supplier_barcode", e.target.value)}
              placeholder="EAN / UPC"
            />
            <FormInput
              label="Notas"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Cualquier info relevante"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={submitting || !form.supplier_id || !form.product_id || !form.supplier_sku.trim()}>
              {submitting ? "Guardando..." : "Crear Referencia"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        title="Eliminar referencia"
        message="Se eliminara la vinculacion entre la referencia del proveedor y tu producto."
      />
    </div>
  );
}
