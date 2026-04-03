"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { dypai } from "@/lib/dypai";
import { useAuth } from "@/hooks/useAuth";
import { useWarehouseId } from "@/hooks/useWarehouse";
import { useDebounce } from "@/hooks/useDebounce";
import { sileo } from "sileo";
import { useRouter } from "next/navigation";
import { ClipboardList, Download, ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { MovementTable } from "./_components/MovementTable";
import { MovementFilters } from "./_components/MovementFilters";
import { MovementForm, type MovementFormState } from "./_components/MovementForm";
import { MovementDetailModal } from "./_components/MovementDetailModal";
import { MovementEntryEditModal } from "./_components/MovementEntryEditModal";
import { exportToExcel } from "@/lib/exportExcel";
import type { StockMovement } from "@/lib/types";
import { formatDateTime, formatDateOnly, movementReasonLabel } from "@/lib/utils";

interface Warehouse {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
}

const PAGE_SIZE = 15;

const INITIAL_FORM: MovementFormState = {
  movement_type: "entry",
  warehouse_id: "",
  product_id: "",
  quantity: "",
  reason: "",
  unit_cost: "",
  lot_number: "",
  expiry_date: "",
  destination_warehouse_id: "",
  notes: "",
};

export default function MovimientosPage() {
  const router = useRouter();
  const { user } = useAuth();
  const selectedWarehouseId = useWarehouseId();
  const searchParams = useSearchParams();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  // Form state
  const [form, setForm] = useState<MovementFormState>({ ...INITIAL_FORM });
  const [exporting, setExporting] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);
  const [editingMovement, setEditingMovement] = useState<StockMovement | null>(null);
  const [deletingMovement, setDeletingMovement] = useState<StockMovement | null>(null);
  const [editingEntry, setEditingEntry] = useState(false);
  const [deletingEntry, setDeletingEntry] = useState(false);

  const canCreate =
    user?.role === "admin" ||
    user?.role === "warehouse_manager" ||
    user?.role === "worker";
  const canManageHistory =
    user?.role === "admin" || user?.role === "warehouse_manager";

  const fetchMovements = useCallback(async (p: number) => {
    setLoading(true);
    const params: Record<string, unknown> = { page: p, page_size: PAGE_SIZE };
    if (debouncedSearch) params.search = debouncedSearch;
    if (filterType) params.movement_type = filterType;
    if (selectedWarehouseId) params.warehouse_id = selectedWarehouseId;

    const { data } = await dypai.api.get("list_movements", { params });
    if (data && Array.isArray(data)) {
      setMovements(data as StockMovement[]);
      setTotalItems(data.length > 0 ? Number(data[0].total_count) : 0);
    } else {
      setMovements([]);
      setTotalItems(0);
    }
    setLoading(false);
  }, [debouncedSearch, filterType, selectedWarehouseId]);

  const fetchCatalogs = useCallback(async () => {
    const [whRes, prodRes] = await Promise.all([
      dypai.api.get("list_warehouses"),
      dypai.api.get("list_products", { params: { page_size: 10000 } }),
    ]);
    if (whRes.data) setWarehouses(whRes.data);
    if (prodRes.data) setProducts(prodRes.data);
  }, []);

  useEffect(() => {
    fetchCatalogs();
  }, [fetchCatalogs]);

  useEffect(() => {
    fetchMovements(page);
  }, [page, fetchMovements]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterType, selectedWarehouseId]);

  // Auto-open create modal from quick actions (with optional type preset)
  useEffect(() => {
    if (searchParams.get("action") === "create" && canCreate) {
      const typeParam = searchParams.get("type") as "entry" | "exit" | "transfer" | null;
      resetForm();
      if (typeParam) {
        setForm((prev) => ({ ...prev, movement_type: typeParam }));
      }
      setShowModal(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const handler = (e: Event) => {
      if (!canCreate) return;
      const type = (e as CustomEvent).detail?.type as "entry" | "exit" | "transfer" | undefined;
      if (type) openWithType(type);
      else { resetForm(); setShowModal(true); }
    };
    window.addEventListener("quick-action-create", handler);
    return () => window.removeEventListener("quick-action-create", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canCreate]);

  function openWithType(type: "entry" | "exit" | "transfer") {
    setForm({
      ...INITIAL_FORM,
      movement_type: type,
      warehouse_id: selectedWarehouseId ?? "",
    });
    setShowModal(true);
  }

  function resetForm() {
    setForm({ ...INITIAL_FORM, warehouse_id: selectedWarehouseId ?? "" });
  }

  async function handleSubmit() {
    if (!form.warehouse_id || !form.product_id || !form.quantity || !form.reason)
      return;

    setSubmitting(true);
    const body: Record<string, unknown> = {
      movement_type: form.movement_type,
      warehouse_id: form.warehouse_id,
      product_id: form.product_id,
      quantity: Number(form.quantity),
      reason: form.reason,
    };
    if (form.movement_type === "entry") {
      body.unit_cost = Number(form.unit_cost);
      if (form.lot_number) body.lot_number = form.lot_number;
      if (form.expiry_date) body.expiry_date = form.expiry_date;
    }
    if (form.movement_type === "transfer" && form.destination_warehouse_id) {
      body.destination_warehouse_id = form.destination_warehouse_id;
    }
    if (form.notes) body.notes = form.notes;

    const { error } = await dypai.api.post("create_stock_movement", body);
    setSubmitting(false);
    if (error) {
      sileo.error({ title: "Error al crear movimiento" });
      return;
    }
    sileo.success({ title: "Movimiento registrado" });
    setShowModal(false);

    // Check low stock alert (fire and forget — don't block the UI)
    if (form.movement_type === "exit" || form.movement_type === "transfer") {
      dypai.api.post("create_low_stock_alert", {
        product_id: form.product_id,
        warehouse_id: form.warehouse_id,
      }).then(({ data }) => {
        if (data?.trello_card_url) {
          sileo.warning({ title: "Stock bajo detectado — alerta creada en Trello" });
        }
      }).catch(() => {});
    }

    resetForm();
    fetchMovements(page);
  }

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data, error } = await dypai.api.get("list_movements", {
        params: {
          page_size: 10000,
          warehouse_id: selectedWarehouseId ?? undefined,
          movement_type: filterType || undefined,
          search: debouncedSearch || undefined,
        },
      });
      if (error || !data || !Array.isArray(data)) {
        sileo.error({ title: "Error al exportar movimientos" });
        return;
      }
      const exportRows = data.map((item) => ({
        ...item,
        display_lot: item.lot_allocations || item.lot_number,
      }));
      const typeLabels: Record<string, string> = {
        entry: "Entrada",
        exit: "Salida",
        transfer: "Transferencia",
        adjustment: "Ajuste",
      };
      exportToExcel(exportRows as Record<string, unknown>[], [
        {
          key: "created_at",
          label: "Fecha y hora",
          format: (v) => formatDateTime(String(v)),
        },
        { key: "product_name", label: "Producto" },
        { key: "product_sku", label: "SKU" },
        {
          key: "movement_type",
          label: "Tipo",
          format: (v) => typeLabels[String(v)] || String(v),
        },
        { key: "quantity", label: "Cantidad", format: (v) => Number(v) },
        { key: "warehouse_name", label: "Almacén origen" },
        {
          key: "destination_warehouse_name",
          label: "Almacén destino",
          format: (v) => (v == null || String(v) === "" ? "—" : String(v)),
        },
        {
          key: "reason",
          label: "Motivo",
          format: (v) => (v ? movementReasonLabel(String(v)) : "—"),
        },
        {
          key: "display_lot",
          label: "Lote",
          format: (v) => (v == null || String(v) === "" ? "—" : String(v)),
        },
        {
          key: "unit_cost",
          label: "Coste ud.",
          format: (v) => (v == null || String(v) === "" ? "—" : Number(v)),
        },
        {
          key: "total_cost",
          label: "Coste total",
          format: (v) => (v == null || String(v) === "" ? "—" : Number(v)),
        },
        {
          key: "expiry_date",
          label: "Caducidad",
          format: (v) =>
            v == null || String(v) === "" ? "—" : formatDateOnly(String(v)),
        },
        {
          key: "user_email",
          label: "Responsable",
          format: (v) => (v == null || String(v) === "" ? "—" : String(v)),
        },
        {
          key: "notes",
          label: "Notas",
          format: (v) => (v == null || String(v) === "" ? "—" : String(v)),
        },
      ], "historial_movimientos", "Movimientos");
      sileo.success({ title: "Exportación completada" });
    } finally {
      setExporting(false);
    }
  };

  function canEditMovement(movement: StockMovement) {
    return (
      canManageHistory &&
      movement.movement_type === "entry" &&
      !movement.delivery_note_id
    );
  }

  function canDeleteMovement(movement: StockMovement) {
    return canManageHistory && !movement.delivery_note_id;
  }

  function getDeleteMessage(movement: StockMovement) {
    if (movement.movement_type === "entry") {
      return "Se revertirá la entrada y se recalculará el coste medio. Solo se podrá eliminar si el lote no ha sido consumido.";
    }
    if (movement.movement_type === "exit") {
      return "Se revertirá la salida y se devolverán las cantidades a sus lotes FIFO originales.";
    }
    return "Se revertirá la transferencia entre almacenes y se restaurará la trazabilidad de los lotes en origen.";
  }

  async function handleEditEntry(values: {
    quantity: string;
    reason: string;
    unit_cost: string;
    lot_number: string;
    expiry_date: string;
    notes: string;
  }) {
    if (!editingMovement) return;

    setEditingEntry(true);
    const { error } = await dypai.api.put("update_stock_movement_entry", {
      movement_id: editingMovement.id,
      quantity: Number(values.quantity),
      reason: values.reason,
      unit_cost: Number(values.unit_cost),
      lot_number: values.lot_number,
      expiry_date: values.expiry_date || undefined,
      notes: values.notes,
    });
    setEditingEntry(false);

    if (error) {
      sileo.error({ title: "No se pudo actualizar la entrada" });
      return;
    }

    sileo.success({ title: "Entrada actualizada" });
    setEditingMovement(null);
    fetchMovements(page);
  }

  async function handleDeleteMovement() {
    if (!deletingMovement) return;

    setDeletingEntry(true);
    const { error } = await dypai.api.delete("delete_stock_movement", {
      params: { movement_id: deletingMovement.id },
    });
    setDeletingEntry(false);

    if (error) {
      sileo.error({ title: "No se pudo eliminar el movimiento" });
      return;
    }

    sileo.success({ title: "Movimiento eliminado" });
    setDeletingMovement(null);
    setSelectedMovement(null);
    fetchMovements(page);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={<ClipboardList size={28} className="text-primary" />}
        title="Movimientos de Stock"
        showAction={false}
        extraActions={
          <div className="flex gap-2">
            {canCreate && (
              <>
                <Button size="sm" onClick={() => router.push("/movimientos/entrada")} className="gap-1.5">
                  <ArrowDownToLine size={14} />
                  Entrada
                </Button>
                <Button size="sm" variant="outline" onClick={() => router.push("/movimientos/salida")} className="gap-1.5">
                  <ArrowUpFromLine size={14} />
                  Salida
                </Button>
                <Button size="sm" variant="outline" onClick={() => router.push("/movimientos/transferencia")} className="gap-1.5">
                  <ArrowRightLeft size={14} />
                  Transferencia
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exporting}
            >
              <Download size={14} />
              {exporting ? "Exportando…" : "Exportar Excel"}
            </Button>
          </div>
        }
      />

      <MovementFilters
        filterType={filterType}
        setFilterType={setFilterType}
        search={search}
        onSearchChange={setSearch}
      />

      <MovementTable
        data={movements}
        loading={loading}
        onView={setSelectedMovement}
        onEdit={setEditingMovement}
        onDelete={setDeletingMovement}
        canEdit={canEditMovement}
        canDelete={canDeleteMovement}
        serverPagination={{
          page,
          pageSize: PAGE_SIZE,
          totalItems,
          onPageChange: setPage,
        }}
      />

      <MovementForm
        open={showModal}
        onClose={() => setShowModal(false)}
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        submitting={submitting}
        warehouses={warehouses}
        products={products}
      />

      <MovementDetailModal
        open={!!selectedMovement}
        movement={selectedMovement}
        canEdit={selectedMovement ? canEditMovement(selectedMovement) : false}
        canDelete={selectedMovement ? canDeleteMovement(selectedMovement) : false}
        deleting={deletingEntry}
        onClose={() => setSelectedMovement(null)}
        onEdit={() => {
          if (!selectedMovement) return;
          setEditingMovement(selectedMovement);
          setSelectedMovement(null);
        }}
        onDelete={() => {
          if (!selectedMovement) return;
          setDeletingMovement(selectedMovement);
          setSelectedMovement(null);
        }}
      />

      <MovementEntryEditModal
        open={!!editingMovement}
        movement={editingMovement}
        submitting={editingEntry}
        onClose={() => setEditingMovement(null)}
        onSubmit={handleEditEntry}
      />

      <ConfirmDialog
        open={!!deletingMovement}
        onClose={() => setDeletingMovement(null)}
        onConfirm={handleDeleteMovement}
        title="Eliminar movimiento"
        message={
          deletingMovement ? getDeleteMessage(deletingMovement) : undefined
        }
        confirmLabel={deletingEntry ? "Eliminando..." : "Eliminar"}
      />
    </div>
  );
}
