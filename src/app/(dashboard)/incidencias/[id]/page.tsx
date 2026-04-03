"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { dypai } from "@/lib/dypai";
import { sileo } from "sileo";
import {
  AlertCircle,
  ArrowLeft,
  Paperclip,
  Upload,
  Download,
  Trash2,
  Image,
  FileText,
  File,
  Calendar,
  Warehouse,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Pencil,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormInput, FormSelect, FormTextarea } from "@/components/ui/FormInput";
import { Spinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";
import type { Incident, IncidentAttachment } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api = dypai.api as any;

const typeLabels: Record<string, string> = { damaged: "Dañado", missing: "Faltante", quality: "Calidad", other: "Otro" };
const severityLabels: Record<string, string> = { baja: "Baja", media: "Media", alta: "Alta", critica: "Critica" };

const statusConfig: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  abierta: { label: "Abierta", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Clock },
  en_revision: { label: "En revision", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Eye },
  resuelta: { label: "Resuelta", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  cerrada: { label: "Cerrada", className: "bg-slate-100 text-slate-600 dark:bg-slate-800/30 dark:text-slate-400", icon: XCircle },
};

interface SelectOption { value: string; label: string }

function getFileIcon(mime: string | null) {
  if (!mime) return File;
  if (mime.startsWith("image/")) return Image;
  if (mime.includes("pdf")) return FileText;
  return File;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [attachments, setAttachments] = useState<IncidentAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [warehouses, setWarehouses] = useState<SelectOption[]>([]);
  const [suppliers, setSuppliers] = useState<SelectOption[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit form state
  const [form, setForm] = useState({
    title: "", incident_type: "", severity: "", incident_date: "",
    warehouse_id: "", supplier_id: "", description: "",
    affected_products: "", resolution: "", notes: "",
  });

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const fetchIncident = useCallback(async () => {
    const { data } = await dypai.api.get("get_incident", { params: { id } });
    if (data && Array.isArray(data) && data[0]) {
      setIncident(data[0] as Incident);
    }
    setLoading(false);
  }, [id]);

  const fetchAttachments = useCallback(async () => {
    const { data } = await dypai.api.get("list_incident_attachments", { params: { incident_id: id } });
    if (data && Array.isArray(data)) setAttachments(data as IncidentAttachment[]);
  }, [id]);

  const fetchOptions = useCallback(async () => {
    const [whRes, supRes] = await Promise.all([
      dypai.api.get("list_warehouses"),
      dypai.api.get("list_suppliers"),
    ]);
    if (whRes.data && Array.isArray(whRes.data))
      setWarehouses((whRes.data as { id: string; name: string }[]).map((w) => ({ value: w.id, label: w.name })));
    if (supRes.data && Array.isArray(supRes.data))
      setSuppliers((supRes.data as { id: string; name: string }[]).map((s) => ({ value: s.id, label: s.name })));
  }, []);

  useEffect(() => { fetchIncident(); fetchAttachments(); fetchOptions(); }, [fetchIncident, fetchAttachments, fetchOptions]);

  const startEditing = () => {
    if (!incident) return;
    setForm({
      title: incident.title,
      incident_type: incident.incident_type,
      severity: incident.severity,
      incident_date: incident.incident_date,
      warehouse_id: incident.warehouse_id || "",
      supplier_id: incident.supplier_id || "",
      description: incident.description || "",
      affected_products: incident.affected_products || "",
      resolution: incident.resolution || "",
      notes: incident.notes || "",
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!incident || !form.title.trim()) return;
    setSaving(true);
    const { error } = await dypai.api.put("update_incident", { id: incident.id, ...form });
    if (error) {
      sileo.error({ title: "Error al guardar" });
    } else {
      sileo.success({ title: "Incidencia actualizada" });
      setEditing(false);
      fetchIncident();
    }
    setSaving(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!incident) return;
    const { error } = await dypai.api.put("update_incident", { id: incident.id, status: newStatus });
    if (error) sileo.error({ title: "Error al actualizar estado" });
    else { sileo.success({ title: `Estado: ${statusConfig[newStatus]?.label}` }); fetchIncident(); }
  };

  const handleDelete = async () => {
    if (!incident) return;
    const { error } = await dypai.api.delete("delete_incident", { params: { id: incident.id } });
    setConfirmDelete(false);
    if (error) { sileo.error({ title: "Error al eliminar" }); return; }
    sileo.success({ title: "Incidencia eliminada" });
    router.push("/incidencias");
  };

  // --- File uploads ---
  const uploadFile = async (file: globalThis.File) => {
    if (!incident) return;
    setUploading(true);
    const filePath = `incidents/${incident.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await api.upload("storage_incidents", file, {
      params: { operation: "upload", file_path: filePath },
    });
    if (upErr) { sileo.error({ title: "Error al subir archivo" }); setUploading(false); return; }
    const { error: dbErr } = await dypai.api.post("add_incident_attachment", {
      incident_id: incident.id, file_name: file.name, file_path: filePath,
      file_size: file.size, mime_type: file.type,
    });
    if (dbErr) { sileo.error({ title: "Error al registrar archivo" }); setUploading(false); return; }
    sileo.success({ title: "Archivo subido" });
    fetchAttachments();
    setUploading(false);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((f) => uploadFile(f));
  };

  const handleDownload = async (att: IncidentAttachment) => {
    const { data } = await dypai.api.post("storage_incidents", { operation: "download", file_path: att.file_path });
    if (data) {
      const url = (data as Record<string, string>).signed_url || (data as Record<string, string>).url;
      if (url) window.open(url, "_blank");
    }
  };

  const handleDeleteAttachment = async (att: IncidentAttachment) => {
    await dypai.api.post("storage_incidents", { operation: "delete", file_path: att.file_path });
    await dypai.api.delete("delete_incident_attachment", { params: { id: att.id } });
    sileo.success({ title: "Archivo eliminado" });
    fetchAttachments();
  };

  if (loading) return <div className="py-12"><Spinner size="md" label="Cargando..." /></div>;
  if (!incident) return <div className="py-12 text-center text-muted-foreground">Incidencia no encontrada</div>;

  const sCfg = statusConfig[incident.status] || statusConfig.abierta;
  const StatusIcon = sCfg.icon;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/incidencias" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft size={18} className="text-muted-foreground" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-muted-foreground">{incident.incident_number}</span>
              <Badge className={sCfg.className}>
                <StatusIcon size={12} className="mr-1" />
                {sCfg.label}
              </Badge>
            </div>
            <h1 className="text-xl font-bold text-foreground mt-1">{incident.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editing && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={startEditing}>
              <Pencil size={14} />
              Editar
            </Button>
          )}
          {incident.status !== "cerrada" && (
            <FormSelect
              label=""
              value={incident.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              options={[
                { value: "abierta", label: "Abierta" },
                { value: "en_revision", label: "En revision" },
                { value: "resuelta", label: "Resuelta" },
                { value: "cerrada", label: "Cerrada" },
              ]}
              triggerClassName="w-[150px]"
            />
          )}
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      {/* === EDIT MODE === */}
      {editing ? (
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <FormInput label="Titulo *" value={form.title} onChange={(e) => set("title", e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormSelect label="Tipo" value={form.incident_type} onChange={(e) => set("incident_type", e.target.value)}
              options={[{ value: "damaged", label: "Dañado" }, { value: "missing", label: "Faltante" }, { value: "quality", label: "Calidad" }, { value: "other", label: "Otro" }]} />
            <FormSelect label="Severidad" value={form.severity} onChange={(e) => set("severity", e.target.value)}
              options={[{ value: "baja", label: "Baja" }, { value: "media", label: "Media" }, { value: "alta", label: "Alta" }, { value: "critica", label: "Critica" }]} />
            <FormInput label="Fecha" type="date" value={form.incident_date} onChange={(e) => set("incident_date", e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect label="Almacen" value={form.warehouse_id} onChange={(e) => set("warehouse_id", e.target.value)}
              options={[{ value: "", label: "Seleccionar..." }, ...warehouses]} />
            <FormSelect label="Proveedor" value={form.supplier_id} onChange={(e) => set("supplier_id", e.target.value)}
              options={[{ value: "", label: "Ninguno" }, ...suppliers]} />
          </div>
          <FormTextarea label="Descripcion" value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} placeholder="Describe la incidencia..." />
          <FormTextarea label="Productos afectados" value={form.affected_products} onChange={(e) => set("affected_products", e.target.value)} rows={3} placeholder="Ej: 50x Botella FlexiVox (rotas)..." />
          <FormTextarea label="Resolucion" value={form.resolution} onChange={(e) => set("resolution", e.target.value)} rows={3} placeholder="Como se ha resuelto..." />
          <FormTextarea label="Notas" value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Informacion adicional..." />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.title.trim()}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* === VIEW MODE === */}
          {/* Info cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <InfoCard icon={<AlertCircle size={14} />} label="Tipo" value={typeLabels[incident.incident_type] || incident.incident_type} />
            <InfoCard icon={<Calendar size={14} />} label="Fecha" value={new Date(incident.incident_date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })} />
            {incident.warehouse_name && <InfoCard icon={<Warehouse size={14} />} label="Almacen" value={incident.warehouse_name} />}
            {incident.supplier_name && <InfoCard icon={<Truck size={14} />} label="Proveedor" value={incident.supplier_name} />}
          </div>

          {/* Content */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            {incident.description && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-1">Descripcion</h3>
                <p className="text-sm text-foreground whitespace-pre-wrap">{incident.description}</p>
              </div>
            )}
            {incident.affected_products && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-1">Productos afectados</h3>
                <p className="text-sm text-foreground whitespace-pre-wrap">{incident.affected_products}</p>
              </div>
            )}
            {incident.notes && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-1">Notas</h3>
                <p className="text-sm text-foreground whitespace-pre-wrap">{incident.notes}</p>
              </div>
            )}
            {!incident.description && !incident.affected_products && !incident.notes && (
              <p className="text-sm text-muted-foreground italic">Sin descripcion. Haz clic en Editar para añadir detalles.</p>
            )}
          </div>

          {/* Resolution */}
          {incident.resolution && (
            <div className="rounded-xl border border-green-200 dark:border-green-900/30 bg-green-50/50 dark:bg-green-950/10 p-5">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                <CheckCircle size={14} className="text-green-500" />
                Resolucion
              </h3>
              <p className="text-sm text-foreground whitespace-pre-wrap">{incident.resolution}</p>
              {incident.resolved_at && (
                <p className="text-xs text-muted-foreground mt-2">
                  Resuelta el {new Date(incident.resolved_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* Attachments (always visible) */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Paperclip size={14} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            Adjuntos {attachments.length > 0 && `(${attachments.length})`}
          </h3>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all",
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
          )}
        >
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <Spinner size="sm" />
              <span className="text-sm text-muted-foreground">Subiendo...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Upload size={16} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Arrastra fotos, albaranes o documentos — o haz clic para seleccionar</span>
            </div>
          )}
        </div>

        {attachments.length > 0 && (
          <div className="space-y-1.5">
            {attachments.map((att) => {
              const Icon = getFileIcon(att.mime_type);
              return (
                <div key={att.id} className="group flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors">
                  <Icon size={18} className="text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{att.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(att.file_size)}
                      {att.uploaded_by_name && ` · ${att.uploaded_by_name}`}
                      {" · "}{new Date(att.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDownload(att)}>
                      <Download size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDeleteAttachment(att)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="text-xs text-muted-foreground space-y-1">
        {incident.created_by_name && <p>Creada por {incident.created_by_name}</p>}
        <p>Creada el {new Date(incident.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Eliminar incidencia"
        message="Se eliminara la incidencia y todos sus adjuntos. Esta accion no se puede deshacer."
      />
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">{icon}{label}</div>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
