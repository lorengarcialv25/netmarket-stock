"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ClipboardList,
  Eye,
  Download,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentViewerProps {
  url: string;
  title: string;
  onClose: () => void;
  onBack: () => void;
}

export function DocumentViewer({ url, title, onClose, onBack }: DocumentViewerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Fetch failed");
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        setBlobUrl(URL.createObjectURL(blob));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  // Cleanup blob on unmount
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `documento-${title}.pdf`;
    a.click();
  };

  return (
    <div className="-m-4 lg:-m-6 flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header bar */}
      <div className="flex shrink-0 items-center justify-between border-b bg-background/80 backdrop-blur-md px-4 py-2.5 sm:px-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-2" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver</span>
          </Button>
          <div className="h-5 w-px bg-border" />
          <h2 className="text-sm font-medium text-muted-foreground truncate">{title}</h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-muted p-0.5 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="gap-1.5 h-7 text-xs"
            >
              <ClipboardList className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Detalle</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 h-7 text-xs"
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Documento</span>
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="gap-1.5 h-7 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Descargar</span>
          </Button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 bg-neutral-100 dark:bg-neutral-900">
        {loading && (
          <div className="flex h-full items-center justify-center">
            <div className="flex items-center gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <span className="text-base font-medium text-muted-foreground">
                Cargando documento...
              </span>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-center max-w-sm">
              <div className="w-20 h-20 rounded-2xl bg-muted/40 border border-dashed border-muted-foreground/20 flex items-center justify-center">
                <FileText className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.2} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Documento no disponible</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  No se pudo cargar el documento. Prueba a descargarlo directamente.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} className="gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Ver detalle
                </Button>
                <Button variant="outline" onClick={handleDownload} className="gap-2">
                  <Download className="h-4 w-4" />
                  Descargar
                </Button>
              </div>
            </div>
          </div>
        )}

        {blobUrl && !loading && (
          <iframe
            src={blobUrl}
            className="w-full h-full border-0"
            title={title}
          />
        )}
      </div>
    </div>
  );
}
