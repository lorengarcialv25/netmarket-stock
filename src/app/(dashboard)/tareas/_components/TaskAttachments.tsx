"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { dypai } from "@/lib/dypai";
import { sileo } from "sileo";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";
import { Paperclip, Upload, Trash2, Download, FileText, Image, File } from "lucide-react";
import type { TaskAttachment } from "@/lib/types";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api = dypai.api as any;

interface TaskAttachmentsProps {
  taskId: string;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File;
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.includes("pdf")) return FileText;
  return File;
}

export function TaskAttachments({ taskId }: TaskAttachmentsProps) {
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAttachments = useCallback(async () => {
    const { data, error } = await dypai.api.get("list_task_attachments", { params: { task_id: taskId } });
    if (!error && data) {
      setAttachments(data as TaskAttachment[]);
    }
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    const filePath = `tasks/${taskId}/${Date.now()}-${file.name}`;

    try {
      // 1. Upload file to storage
      const { error: uploadError } = await api.upload("storage_task_attachments", file, {
        params: { operation: "upload", file_path: filePath },
      });
      if (uploadError) {
        sileo.error({ title: "Error al subir archivo" });
        setUploading(false);
        return;
      }

      // 2. Register in DB
      const { error: dbError } = await dypai.api.post("add_task_attachment", {
        task_id: taskId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
      });
      if (dbError) {
        sileo.error({ title: "Error al registrar archivo" });
        setUploading(false);
        return;
      }

      sileo.success({ title: "Archivo subido" });
      fetchAttachments();
    } catch {
      sileo.error({ title: "Error al subir archivo" });
    }
    setUploading(false);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    // Upload files sequentially
    Array.from(files).forEach((f) => uploadFile(f));
  };

  const handleDownload = async (att: TaskAttachment) => {
    const { data, error } = await dypai.api.post("storage_task_attachments", {
      operation: "download",
      file_path: att.file_path,
    });
    if (error || !data) {
      sileo.error({ title: "Error al descargar" });
      return;
    }
    const url = data.signed_url || data.url;
    if (url) window.open(url, "_blank");
  };

  const handleDelete = async (att: TaskAttachment) => {
    // Delete from storage
    await dypai.api.post("storage_task_attachments", {
      operation: "delete",
      file_path: att.file_path,
    });
    // Delete from DB
    const { error } = await dypai.api.delete("delete_task_attachment", { params: { id: att.id } });
    if (error) {
      sileo.error({ title: "Error al eliminar" });
      return;
    }
    sileo.success({ title: "Archivo eliminado" });
    fetchAttachments();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Paperclip size={16} className="text-muted-foreground" />
        <h4 className="text-sm font-medium text-foreground">
          Adjuntos {attachments.length > 0 && `(${attachments.length})`}
        </h4>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 py-1">
            <Spinner size="sm" />
            <span className="text-sm text-muted-foreground">Subiendo...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-1">
            <Upload size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Arrastra archivos o haz clic para subir
            </span>
          </div>
        )}
      </div>

      {/* File list */}
      {loading ? (
        <Spinner size="sm" />
      ) : attachments.length > 0 ? (
        <div className="space-y-1.5">
          {attachments.map((att) => {
            const Icon = getFileIcon(att.mime_type);
            return (
              <div
                key={att.id}
                className="group flex items-center gap-3 p-2.5 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
              >
                <Icon size={18} className="text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{att.file_name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatFileSize(att.file_size)}
                    {att.uploaded_by_name && ` · ${att.uploaded_by_name}`}
                    {" · "}
                    {new Date(att.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDownload(att)}>
                    <Download size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(att)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
