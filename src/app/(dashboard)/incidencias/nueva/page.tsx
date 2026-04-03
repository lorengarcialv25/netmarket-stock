"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { dypai } from "@/lib/dypai";
import { sileo } from "sileo";
import { AlertCircle, ArrowLeft, Upload, X, Image, FileText, File, Paperclip } from "lucide-react";
import { FormInput, FormSelect, FormTextarea } from "@/components/ui/FormInput";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api = dypai.api as any;

interface SelectOption { value: string; label: string }

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return Image;
  if (type.includes("pdf")) return FileText;
  return File;
}

export default function NuevaIncidenciaPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [warehouses, setWarehouses] = useState<SelectOption[]>([]);
  const [suppliers, setSuppliers] = useState<SelectOption[]>([]);
  const [pendingFiles, setPendingFiles] = useState<globalThis.File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    incident_type: "damaged",
    severity: "media",
    incident_date: new Date().toISOString().split("T")[0],
    warehouse_id: "",
    supplier_id: "",
    description: "",
    affected_products: "",
    notes: "",
  });

  const fetchOptions = useCallback(async () => {
    const [whRes, supRes] = await Promise.all([
      dypai.api.get("list_warehouses"),
      dypai.api.get("list_suppliers"),
    ]);
    if (whRes.data && Array.isArray(whRes.data)) {
      setWarehouses((whRes.data as { id: string; name: string }[]).map((w) => ({ value: w.id, label: w.name })));
    }
    if (supRes.data && Array.isArray(supRes.data)) {
      setSuppliers((supRes.data as { id: string; name: string }[]).map((s) => ({ value: s.id, label: s.name })));
    }
  }, []);

  useEffect(() => { fetchOptions(); }, [fetchOptions]);

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    setPendingFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const removeFile = (idx: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { sileo.error({ title: "El titulo es obligatorio" }); return; }
    setSubmitting(true);

    // 1. Create incident
    const { data, error } = await dypai.api.post("create_incident", form);
    if (error || !data) {
      sileo.error({ title: "Error al crear incidencia" });
      setSubmitting(false);
      return;
    }
    const created = (Array.isArray(data) ? data[0] : data) as { id: string };
    const incidentId = created.id;

    // 2. Upload pending files
    if (pendingFiles.length > 0) {
      for (const file of pendingFiles) {
        const filePath = `incidents/${incidentId}/${Date.now()}-${file.name}`;
        const { error: upErr } = await api.upload("storage_incidents", file, {
          params: { operation: "upload", file_path: filePath },
        });
        if (!upErr) {
          await dypai.api.post("add_incident_attachment", {
            incident_id: incidentId,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
          });
        }
      }
    }

    sileo.success({ title: `Incidencia creada${pendingFiles.length > 0 ? ` con ${pendingFiles.length} adjunto${pendingFiles.length > 1 ? "s" : ""}` : ""}` });
    router.push(`/incidencias/${incidentId}`);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/incidencias" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft size={18} className="text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <AlertCircle size={22} className="text-red-500" />
            Nueva Incidencia
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Registra una incidencia de mercancia con fotos y documentos adjuntos.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <FormInput
          label="Titulo *"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Ej: Mercancia dañada en recepcion pedido #1234"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormSelect
            label="Tipo"
            value={form.incident_type}
            onChange={(e) => set("incident_type", e.target.value)}
            options={[
              { value: "damaged", label: "Dañado" },
              { value: "missing", label: "Faltante" },
              { value: "quality", label: "Calidad" },
              { value: "other", label: "Otro" },
            ]}
          />
          <FormSelect
            label="Severidad"
            value={form.severity}
            onChange={(e) => set("severity", e.target.value)}
            options={[
              { value: "baja", label: "Baja" },
              { value: "media", label: "Media" },
              { value: "alta", label: "Alta" },
              { value: "critica", label: "Critica" },
            ]}
          />
          <FormInput
            label="Fecha"
            type="date"
            value={form.incident_date}
            onChange={(e) => set("incident_date", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormSelect
            label="Almacen"
            value={form.warehouse_id}
            onChange={(e) => set("warehouse_id", e.target.value)}
            options={[{ value: "", label: "Seleccionar..." }, ...warehouses]}
          />
          <FormSelect
            label="Proveedor (opcional)"
            value={form.supplier_id}
            onChange={(e) => set("supplier_id", e.target.value)}
            options={[{ value: "", label: "Ninguno" }, ...suppliers]}
          />
        </div>

        <FormTextarea
          label="Descripcion"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Describe la incidencia en detalle..."
          rows={4}
        />

        <FormTextarea
          label="Productos afectados"
          value={form.affected_products}
          onChange={(e) => set("affected_products", e.target.value)}
          placeholder="Ej: 50x Botella FlexiVox (rotas), 10x Calcio 4pcs (mojado)..."
          rows={3}
        />

        <FormTextarea
          label="Notas adicionales"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Cualquier informacion relevante..."
          rows={2}
        />

        {/* Attachments zone */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Paperclip size={14} className="text-muted-foreground" />
            <h3 className="text-sm font-medium text-foreground">
              Adjuntos {pendingFiles.length > 0 && `(${pendingFiles.length})`}
            </h3>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all",
              dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              className="hidden"
              onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
            />
            <div className="flex items-center justify-center gap-2">
              <Upload size={16} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Arrastra fotos, albaranes o documentos — o haz clic para seleccionar
              </span>
            </div>
          </div>

          {/* Pending files list */}
          {pendingFiles.length > 0 && (
            <div className="space-y-1.5">
              {pendingFiles.map((file, idx) => {
                const Icon = getFileIcon(file.type);
                const isImage = file.type.startsWith("image/");
                return (
                  <div key={`${file.name}-${idx}`} className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-card">
                    {isImage ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-10 h-10 rounded object-cover shrink-0"
                      />
                    ) : (
                      <Icon size={18} className="text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                      className="p-1 rounded hover:bg-destructive/10 cursor-pointer shrink-0"
                    >
                      <X size={14} className="text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={() => router.back()}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting || !form.title.trim()}>
            {submitting
              ? pendingFiles.length > 0 ? "Creando y subiendo..." : "Creando..."
              : `Crear Incidencia${pendingFiles.length > 0 ? ` (${pendingFiles.length} adjunto${pendingFiles.length > 1 ? "s" : ""})` : ""}`
            }
          </Button>
        </div>
      </div>
    </div>
  );
}
