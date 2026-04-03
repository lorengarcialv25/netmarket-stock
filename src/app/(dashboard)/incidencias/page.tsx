"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { dypai } from "@/lib/dypai";
import { useAuth } from "@/hooks/useAuth";
import { sileo } from "sileo";
import { AlertCircle, Plus, Paperclip } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { FilterBar } from "@/components/shared/FilterBar";
import { FormSelect } from "@/components/ui/FormInput";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Incident } from "@/lib/types";

const typeConfig: Record<string, { label: string; className: string }> = {
  damaged: { label: "Dañado", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  missing: { label: "Faltante", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  quality: { label: "Calidad", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  other: { label: "Otro", className: "bg-slate-100 text-slate-600 dark:bg-slate-800/30 dark:text-slate-400" },
};

const severityConfig: Record<string, { label: string; className: string }> = {
  baja: { label: "Baja", className: "bg-slate-100 text-slate-600 dark:bg-slate-800/30 dark:text-slate-400" },
  media: { label: "Media", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  alta: { label: "Alta", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  critica: { label: "Critica", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

const statusConfig: Record<string, { label: string; className: string }> = {
  abierta: { label: "Abierta", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  en_revision: { label: "En revision", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  resuelta: { label: "Resuelta", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  cerrada: { label: "Cerrada", className: "bg-slate-100 text-slate-600 dark:bg-slate-800/30 dark:text-slate-400" },
};

export default function IncidenciasPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canManage = user?.role === "admin" || user?.role === "colaborador" || user?.role === "warehouse_manager";

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await dypai.api.get("list_incidents");
    if (!error && data) setIncidents(data as Incident[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

  const handleDelete = async (id: string) => {
    const { error } = await dypai.api.delete("delete_incident", { params: { id } });
    setConfirmDeleteId(null);
    if (error) { sileo.error({ title: "Error al eliminar" }); return; }
    sileo.success({ title: "Incidencia eliminada" });
    fetchIncidents();
  };

  const filtered = incidents.filter((i) => {
    const matchSearch = i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.incident_number.toLowerCase().includes(search.toLowerCase()) ||
      (i.description || "").toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || i.incident_type === typeFilter;
    const matchStatus = !statusFilter || i.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const columns = [
    {
      key: "incident_number",
      label: "Numero",
      render: (row: Incident) => (
        <span className="font-mono text-sm text-muted-foreground">{row.incident_number}</span>
      ),
    },
    {
      key: "title",
      label: "Incidencia",
      render: (row: Incident) => (
        <div
          className="cursor-pointer group/title min-w-[200px]"
          onClick={() => router.push(`/incidencias/${row.id}`)}
        >
          <p className="text-sm font-medium text-foreground group-hover/title:text-primary transition-colors">
            {row.title}
          </p>
          {row.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{row.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            {row.warehouse_name && <span className="text-xs text-muted-foreground">{row.warehouse_name}</span>}
            {(row.attachment_count ?? 0) > 0 && (
              <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                <Paperclip size={10} /> {row.attachment_count}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "incident_type",
      label: "Tipo",
      render: (row: Incident) => {
        const cfg = typeConfig[row.incident_type] || typeConfig.other;
        return <Badge className={cfg.className}>{cfg.label}</Badge>;
      },
    },
    {
      key: "severity",
      label: "Severidad",
      render: (row: Incident) => {
        const cfg = severityConfig[row.severity] || severityConfig.media;
        return <Badge className={cfg.className}>{cfg.label}</Badge>;
      },
    },
    {
      key: "status",
      label: "Estado",
      render: (row: Incident) => {
        const cfg = statusConfig[row.status] || statusConfig.abierta;
        return <Badge className={cfg.className}>{cfg.label}</Badge>;
      },
    },
    {
      key: "incident_date",
      label: "Fecha",
      render: (row: Incident) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.incident_date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<AlertCircle size={24} className="text-red-500" />}
        title="Incidencias"
        actionLabel="Nueva Incidencia"
        onAction={() => router.push("/incidencias/nueva")}
        showAction={canManage}
      />

      <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Buscar incidencias...">
        <FormSelect
          label="Tipo"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          options={[
            { value: "", label: "Todos" },
            { value: "damaged", label: "Dañado" },
            { value: "missing", label: "Faltante" },
            { value: "quality", label: "Calidad" },
            { value: "other", label: "Otro" },
          ]}
          triggerClassName="w-[140px]"
        />
        <FormSelect
          label="Estado"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: "", label: "Todos" },
            { value: "abierta", label: "Abierta" },
            { value: "en_revision", label: "En revision" },
            { value: "resuelta", label: "Resuelta" },
            { value: "cerrada", label: "Cerrada" },
          ]}
          triggerClassName="w-[140px]"
        />
      </FilterBar>

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No hay incidencias" pageSize={15} />

      <ConfirmDialog
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        title="Eliminar incidencia"
        message="Se eliminara la incidencia y todos sus adjuntos. Esta accion no se puede deshacer."
      />
    </div>
  );
}
