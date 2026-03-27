"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { dypai } from "@/lib/dypai";
import { useAuth } from "@/hooks/useAuth";
import { sileo } from "sileo";
import { FileText, Eye, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface DeliveryNote {
  id: string;
  note_number: string;
  note_date: string;
  supplier_name: string | null;
  warehouse_name: string;
  total_lines: number;
  total_qty: number;
  total_value: number;
  confirmed_at: string | null;
  created_at: string;
  total_count?: number;
}

const PAGE_SIZE = 15;

export default function AlbaranesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const canCreate = user?.role === "admin" || user?.role === "warehouse_manager";

  const [notes, setNotes] = useState<DeliveryNote[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchNotes = useCallback(async (p: number) => {
    setLoading(true);
    const { data } = await dypai.api.get("list_delivery_notes", {
      params: { page: p, page_size: PAGE_SIZE },
    });
    if (data && Array.isArray(data)) {
      setNotes(data);
      setTotalItems(data.length > 0 ? Number(data[0].total_count) : 0);
    } else {
      setNotes([]);
      setTotalItems(0);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchNotes(page); }, [page, fetchNotes]);

  const handleDelete = async (id: string) => {
    const { error } = await dypai.api.delete("delete_delivery_note", { params: { id } });
    setConfirmDeleteId(null);
    if (error) { sileo.error({ title: "Error al eliminar" }); return; }
    sileo.success({ title: "Albaran eliminado" });
    fetchNotes(page);
  };

  const columns = [
    { key: "note_number", label: "N Albaran" },
    { key: "note_date", label: "Fecha", render: (r: DeliveryNote) => r.note_date },
    { key: "supplier_name", label: "Proveedor", render: (r: DeliveryNote) => r.supplier_name || "-" },
    { key: "warehouse_name", label: "Almacen" },
    { key: "total_lines", label: "Lineas" },
    {
      key: "total_value",
      label: "Valor Total",
      render: (r: DeliveryNote) => formatCurrency(Number(r.total_value)),
    },
    {
      key: "status",
      label: "Estado",
      render: (r: DeliveryNote) =>
        r.confirmed_at ? (
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
            Confirmado
          </Badge>
        ) : (
          <Badge variant="secondary">Borrador</Badge>
        ),
    },
    {
      key: "actions",
      label: "Acciones",
      render: (r: DeliveryNote) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/albaranes/${r.id}`)}>
            <Eye size={16} />
          </Button>
          {!r.confirmed_at && canCreate && (
            <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteId(r.id)} className="text-destructive">
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<FileText size={24} className="text-primary" />}
        title="Albaranes de Entrada"
        actionLabel="Nuevo Albaran"
        onAction={() => router.push("/albaranes/nuevo")}
        showAction={canCreate}
      />

      <DataTable
        columns={columns}
        data={notes}
        loading={loading}
        emptyMessage="No hay albaranes registrados"
        serverPagination={{ page, pageSize: PAGE_SIZE, totalItems, onPageChange: setPage }}
      />

      <ConfirmDialog
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        title="Eliminar Albaran"
        message="Se eliminara el albaran y todas sus lineas. Esta accion no se puede deshacer."
      />
    </div>
  );
}
