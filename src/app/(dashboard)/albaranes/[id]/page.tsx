"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { dypai } from "@/lib/dypai";
import { useAuth } from "@/hooks/useAuth";
import { sileo } from "sileo";
import { ArrowLeft, CheckCircle, Upload, Loader2, ClipboardList, Eye, Pencil, Save, X, ScanLine, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DocumentViewer } from "@/components/shared/DocumentViewer";
import { Spinner } from "@/components/ui/Spinner";
import { DeliveryNoteInfo } from "../_components/DeliveryNoteInfo";
import { DeliveryNoteSummary } from "../_components/DeliveryNoteSummary";
import { DeliveryNoteLines } from "../_components/DeliveryNoteLines";
import { DeliveryNoteForm, type DraftLine, type HeaderFields } from "../_components/DeliveryNoteForm";

interface DeliveryNote {
  id: string;
  supplier_id: string | null;
  warehouse_id: string;
  note_number: string;
  note_date: string;
  notes: string | null;
  confirmed_at: string | null;
  supplier_name: string | null;
  warehouse_name: string;
  document_url: string | null;
}

interface NoteLine {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number | null;
  product_name: string;
  sku: string;
  unit_of_measure: string;
  current_purchase_price: number;
}

interface CatalogOption { id: string; name: string; }
interface ProductOption { id: string; name: string; sku: string; purchase_price: number; unit_of_measure: string; }

export default function DeliveryNoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const canEdit = user?.role === "admin" || user?.role === "warehouse_manager";

  const [note, setNote] = useState<DeliveryNote | null>(null);
  const [lines, setLines] = useState<NoteLine[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [suppliers, setSuppliers] = useState<CatalogOption[]>([]);
  const [warehouses, setWarehouses] = useState<CatalogOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // View: "detail" | "edit" | "document"
  const [viewMode, setViewMode] = useState<"detail" | "edit" | "document">("detail");

  // Edit mode state
  const [editHeader, setEditHeader] = useState<HeaderFields>({ noteNumber: "", noteDate: "", supplierId: "", warehouseId: "", notes: "" });
  const [editLines, setEditLines] = useState<DraftLine[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editScanning, setEditScanning] = useState(false);
  const [editDocFile, setEditDocFile] = useState<File | null>(null);
  const [editDocPreview, setEditDocPreview] = useState<string | null>(null);
  const editOcrRef = useRef<HTMLInputElement>(null);
  const editDocRef = useRef<HTMLInputElement>(null);

  // Document
  const [documentSignedUrl, setDocumentSignedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);

  const isConfirmed = !!note?.confirmed_at;
  const hasDocument = !!note?.document_url;

  // -- Data fetching --
  const fetchNote = useCallback(async () => {
    const { data } = await dypai.api.get("get_delivery_note", { params: { id } });
    if (data?.[0]) setNote(data[0]);
    setLoading(false);
  }, [id]);

  const fetchLines = useCallback(async () => {
    const { data } = await dypai.api.get("get_delivery_note_lines", { params: { delivery_note_id: id } });
    if (data && Array.isArray(data)) setLines(data);
  }, [id]);

  const fetchProducts = useCallback(async () => {
    const { data } = await dypai.api.get("list_products", { params: { page_size: 10000 } });
    if (data && Array.isArray(data)) setProducts(data);
  }, []);

  const fetchCatalogs = useCallback(async () => {
    const [supRes, whRes] = await Promise.all([dypai.api.get("list_suppliers"), dypai.api.get("list_warehouses")]);
    if (supRes.data) setSuppliers(supRes.data);
    if (whRes.data) setWarehouses(whRes.data);
  }, []);

  useEffect(() => { fetchNote(); fetchLines(); fetchProducts(); fetchCatalogs(); }, [fetchNote, fetchLines, fetchProducts, fetchCatalogs]);

  // -- Enter edit mode (preload data) --
  const enterEditMode = () => {
    if (!note) return;
    setEditHeader({
      noteNumber: note.note_number,
      noteDate: note.note_date,
      supplierId: note.supplier_id || "",
      warehouseId: note.warehouse_id,
      notes: note.notes || "",
    });
    setEditLines(lines.map((l) => ({
      key: crypto.randomUUID(),
      product_id: l.product_id,
      product_name: l.product_name,
      sku: l.sku,
      quantity: String(l.quantity),
      unit_price: l.unit_price != null ? String(l.unit_price) : "",
      unit_of_measure: l.unit_of_measure,
      matched: true,
    })));
    setEditDocFile(null);
    setEditDocPreview(null);
    setViewMode("edit");
  };

  // -- OCR in edit mode --
  const handleEditOcr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (editOcrRef.current) editOcrRef.current.value = "";

    setEditScanning(true);
    setEditDocFile(file);
    setEditDocPreview(URL.createObjectURL(file));
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const isPdf = file.type === "application/pdf";
      const content = isPdf
        ? [{ type: "text", text: "Procesa este albaran de entrada y extrae todos los datos y lineas con productos." }, { type: "file", data: base64.split(",")[1], mimeType: file.type }]
        : [{ type: "text", text: "Procesa este albaran de entrada y extrae todos los datos y lineas con productos." }, { type: "image", image: base64 }];

      const { data, error } = await dypai.api.post("ocr_delivery_note", { messages: [{ role: "user", content }] });
      if (error) { sileo.error({ title: "Error al procesar documento" }); return; }

      const responseText = data?.content || data?.message || (typeof data === "string" ? data : "");
      let parsed;
      try { const m = responseText.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : null; }
      catch { sileo.error({ title: "No se pudo interpretar el documento" }); return; }
      if (!parsed) { sileo.error({ title: "No se extrajeron datos" }); return; }

      // Fill header from OCR
      if (parsed.note_number) setEditHeader((h) => ({ ...h, noteNumber: parsed.note_number }));
      if (parsed.note_date) setEditHeader((h) => ({ ...h, noteDate: parsed.note_date }));
      if (parsed.supplier_name) {
        const match = suppliers.find((s) => s.name.toLowerCase().includes(parsed.supplier_name.toLowerCase()) || parsed.supplier_name.toLowerCase().includes(s.name.toLowerCase()));
        if (match) setEditHeader((h) => ({ ...h, supplierId: match.id }));
      }
      if (parsed.notes) setEditHeader((h) => ({ ...h, notes: parsed.notes }));

      // Replace lines with OCR results
      if (parsed.lines?.length) {
        const newLines: DraftLine[] = parsed.lines.map((l: any) => {
          const agentMatched = !!l.product_id;
          const prod = agentMatched ? products.find((p) => p.id === l.product_id) : null;
          return {
            key: crypto.randomUUID(),
            product_id: l.product_id || "",
            product_name: l.product_name_original || l.product_name || "",
            sku: l.product_sku || prod?.sku || "",
            quantity: String(l.quantity || ""),
            unit_price: l.unit_price != null ? String(l.unit_price) : (prod?.purchase_price ? String(prod.purchase_price) : ""),
            unit_of_measure: prod?.unit_of_measure || "",
            expiry_date: l.expiry_date || "",
            matched: agentMatched,
          };
        });
        setEditLines(newLines);
        const matched = newLines.filter((l) => l.matched).length;
        sileo.success({ title: `${newLines.length} lineas detectadas, ${matched} asociadas` });
      }
    } catch {
      sileo.error({ title: "Error al procesar documento" });
    } finally {
      setEditScanning(false);
    }
  };

  // -- Attach document in edit mode --
  const handleEditDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (editDocRef.current) editDocRef.current.value = "";
    setEditDocFile(file);
    setEditDocPreview(URL.createObjectURL(file));
  };

  // -- Save edit --
  const saveEdit = async () => {
    if (!note) return;
    if (!editHeader.warehouseId) { sileo.error({ title: "Selecciona un almacen" }); return; }
    if (!editHeader.noteNumber) { sileo.error({ title: "Introduce el numero de albaran" }); return; }
    const validLines = editLines.filter((l) => l.product_id && l.quantity);
    if (validLines.length === 0) { sileo.error({ title: "Anade al menos una linea" }); return; }
    if (isConfirmed && validLines.some((l) => !l.unit_price || Number(l.unit_price) <= 0)) {
      sileo.error({ title: "Las lineas necesitan precio unitario para recalcular lotes y coste medio" });
      return;
    }

    setSavingEdit(true);

    // 0. Upload new document if changed
    let newDocUrl: string | undefined;
    if (editDocFile) {
      const ext = editDocFile.name.split(".").pop() || "jpg";
      const filePath = `delivery-notes/${Date.now()}-${editHeader.noteNumber.replace(/[^a-zA-Z0-9-]/g, "_")}.${ext}`;
      const { data: upData, error: upErr } = await dypai.api.upload("storage_delivery_notes", editDocFile, { params: { operation: "upload", file_path: filePath } });
      if (!upErr) newDocUrl = upData?.path || upData?.name || upData?.file_path || undefined;
    }

    // 1. Update header
    const { error: headerErr } = await dypai.api.put("update_delivery_note", {
      id: note.id,
      note_number: editHeader.noteNumber,
      note_date: editHeader.noteDate,
      supplier_id: editHeader.supplierId || "",
      warehouse_id: editHeader.warehouseId,
      notes: editHeader.notes,
      ...(newDocUrl ? { document_url: newDocUrl } : {}),
    });
    if (headerErr) { sileo.error({ title: "Error al actualizar cabecera" }); setSavingEdit(false); return; }

    // 2. Sync lines: delete all existing, then re-add
    for (const existing of lines) {
      await dypai.api.delete("delete_delivery_note_line", { params: { id: existing.id } });
    }
    for (const line of validLines) {
      await dypai.api.post("add_delivery_note_line", {
        delivery_note_id: note.id,
        product_id: line.product_id,
        quantity: Number(line.quantity),
        unit_price: line.unit_price ? Number(line.unit_price) : null,
      });
    }

    // 3. Reconfirm stock if the note was already confirmed
    if (isConfirmed) {
      const { error: reconfErr } = await dypai.api.post("reconfirm_delivery_note", { id: note.id });
      if (reconfErr) {
        sileo.warning({ title: "Albaran actualizado pero no se pudo recalcular el stock" });
      } else {
        sileo.success({ title: "Albaran actualizado — stock recalculado" });
      }
    } else {
      sileo.success({ title: "Albaran actualizado" });
    }

    setSavingEdit(false);
    if (newDocUrl) setDocumentSignedUrl(null);
    setViewMode("detail");
    fetchNote();
    fetchLines();
  };

  // -- Document --
  const fetchDocumentUrl = useCallback(async () => {
    if (!note?.document_url || documentSignedUrl) return;
    const { data, error } = await dypai.api.post("storage_delivery_notes", { operation: "download", file_path: note.document_url });
    if (!error && data?.signed_url) setDocumentSignedUrl(data.signed_url);
  }, [note?.document_url, documentSignedUrl]);

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !note) return;
    if (docInputRef.current) docInputRef.current.value = "";
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const filePath = `delivery-notes/${Date.now()}-${note.note_number.replace(/[^a-zA-Z0-9-]/g, "_")}.${ext}`;
    const { data: upData, error: upErr } = await dypai.api.upload("storage_delivery_notes", file, { params: { operation: "upload", file_path: filePath } });
    const docPath = upData?.path || upData?.name || upData?.file_path;
    if (upErr || !docPath) { sileo.error({ title: "Error al subir documento" }); setUploading(false); return; }
    const { error } = await dypai.api.put("update_delivery_note", { id: note.id, document_url: docPath });
    setUploading(false);
    if (error) { sileo.error({ title: "Documento subido pero no se pudo asociar" }); return; }
    setDocumentSignedUrl(null);
    sileo.success({ title: "Documento adjuntado" });
    fetchNote();
  };

  const handleConfirm = async () => {
    setConfirmDialogOpen(false);
    if (lines.length === 0) { sileo.error({ title: "Anade al menos una linea" }); return; }
    if (lines.some((line) => line.unit_price == null || Number(line.unit_price) <= 0)) {
      sileo.error({ title: "Todas las lineas necesitan precio unitario para confirmar" });
      return;
    }
    setConfirming(true);
    const { error } = await dypai.api.post("confirm_delivery_note", { id });
    setConfirming(false);
    if (error) { sileo.error({ title: "Error al confirmar albaran" }); return; }
    sileo.success({ title: "Albaran confirmado — stock actualizado" });
    fetchNote();
  };

  // Computed
  const totalValue = lines.reduce((s, l) => s + Number(l.quantity) * Number(l.unit_price || 0), 0);
  const totalQty = lines.reduce((s, l) => s + Number(l.quantity), 0);

  if (loading) return <div className="py-24"><Spinner size="md" label="Cargando albaran..." /></div>;
  if (!note) return <div className="py-24 text-center text-muted-foreground">Albaran no encontrado</div>;

  // ========= DOCUMENT VIEW =========
  if (viewMode === "document" && hasDocument) {
    if (!documentSignedUrl) return <div className="flex items-center justify-center py-24"><Spinner size="md" label="Cargando documento..." /></div>;
    return (
      <DocumentViewer
        url={documentSignedUrl}
        title={`Albaran ${note.note_number}`}
        onClose={() => setViewMode("detail")}
        onBack={() => router.push("/albaranes")}
      />
    );
  }

  // ========= EDIT VIEW =========
  if (viewMode === "edit") {
    const editValidCount = editLines.filter((l) => l.product_id && l.quantity).length;
    return (
      <div className="space-y-6 max-w-5xl">
        {/* Edit header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setViewMode("detail")}>
              <ArrowLeft size={18} />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Editar Albaran {note.note_number}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => editOcrRef.current?.click()} disabled={editScanning}>
              {editScanning ? <Loader2 size={16} className="animate-spin" /> : <ScanLine size={16} />}
              {editScanning ? "Procesando..." : "Escanear con IA"}
            </Button>
            <input ref={editOcrRef} type="file" accept="image/*,application/pdf" onChange={handleEditOcr} className="hidden" />
            <Button variant="outline" onClick={() => editDocRef.current?.click()}>
              <Upload size={16} />
              {editDocFile || note.document_url ? "Cambiar doc." : "Adjuntar doc."}
            </Button>
            <input ref={editDocRef} type="file" accept="image/*,application/pdf" onChange={handleEditDocUpload} className="hidden" />
          </div>
        </div>

        {/* Scanning overlay */}
        {editScanning && (
          <Card>
            <CardContent className="flex items-center justify-center py-8 gap-4">
              <Spinner size="md" />
              <div>
                <p className="font-medium">Analizando documento con IA...</p>
                <p className="text-sm text-muted-foreground">Extrayendo datos y buscando productos en el inventario</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Document preview (new file) */}
        {editDocPreview && (
          <Card>
            <CardContent className="flex items-center gap-3 py-3">
              <FileText size={18} className="text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{editDocFile?.name}</p>
                <p className="text-xs text-muted-foreground">Nuevo documento — se guardara al confirmar</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.open(editDocPreview, "_blank")}>
                <Eye size={14} />
                Ver
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Existing document indicator (if no new file) */}
        {!editDocPreview && note.document_url && (
          <Card>
            <CardContent className="flex items-center gap-3 py-3">
              <FileText size={18} className="text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Documento actual adjuntado</p>
                <p className="text-xs text-muted-foreground">Se mantendra si no subes uno nuevo</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="py-3 text-sm text-emerald-800 dark:text-emerald-300">
            {isConfirmed
              ? "Al guardar se recalcularán los movimientos del albarán, los lotes asociados y el coste medio."
              : "Al confirmar este albarán se generarán lotes automáticos por línea."}
          </CardContent>
        </Card>

        <DeliveryNoteForm
          header={editHeader}
          onHeaderChange={setEditHeader}
          lines={editLines}
          onLinesChange={setEditLines}
          suppliers={suppliers}
          warehouses={warehouses}
          products={products}
          onScanClick={() => editOcrRef.current?.click()}
          scanDisabled={editScanning}
        />

        {/* Actions */}
        <div className="flex items-center justify-between pb-8">
          <Button variant="ghost" onClick={() => setViewMode("detail")}>
            <X size={16} />
            Cancelar
          </Button>
          <Button onClick={saveEdit} disabled={savingEdit || editValidCount === 0 || !editHeader.warehouseId || !editHeader.noteNumber} className="gap-2">
            {savingEdit ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Guardar Cambios ({editValidCount} lineas)
          </Button>
        </div>
      </div>
    );
  }

  // ========= DETAIL VIEW (read-only) =========
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/albaranes")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight">Albaran {note.note_number}</h1>
              {isConfirmed ? (
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 uppercase text-[10px] font-bold">
                  Confirmado
                </Badge>
              ) : (
                <Badge variant="outline" className="uppercase text-[10px] font-bold">Borrador</Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {note.note_date} · {note.warehouse_name}
              {note.supplier_name && ` · ${note.supplier_name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View mode toggles */}
          {hasDocument && (
            <div className="flex bg-muted p-1 rounded-lg">
              <Button variant="secondary" size="sm" className="gap-2 h-8">
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline">Detalle</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { fetchDocumentUrl(); setViewMode("document"); }} className="gap-2 h-8">
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Documento</span>
              </Button>
            </div>
          )}
          {canEdit && (
            <Button variant="outline" size="sm" onClick={enterEditMode} className="gap-2">
              <Pencil size={15} />
              Editar
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => docInputRef.current?.click()} disabled={uploading} className="gap-2">
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            {uploading ? "Subiendo..." : hasDocument ? "Cambiar doc." : "Adjuntar"}
          </Button>
          <input ref={docInputRef} type="file" accept="image/*,application/pdf" onChange={handleUploadDocument} className="hidden" />
          {canEdit && !isConfirmed && (
            <Button size="sm" onClick={() => setConfirmDialogOpen(true)} disabled={confirming || lines.length === 0} className="gap-2">
              <CheckCircle size={15} />
              {confirming ? "Confirmando..." : "Confirmar"}
            </Button>
          )}
        </div>
      </div>

      {/* Info + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DeliveryNoteInfo note={note} canEdit={false} suppliers={suppliers} warehouses={warehouses} onSaved={fetchNote} />
        <DeliveryNoteSummary linesCount={lines.length} totalQty={totalQty} totalValue={totalValue} confirmedAt={note.confirmed_at} />
      </div>

      {/* Lines (read-only) */}
      <DeliveryNoteLines noteId={id} lines={lines} products={products} canEdit={false} onLinesChanged={fetchLines} />

      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleConfirm}
        title="Confirmar Albaran"
        message={`Se generaran ${lines.length} movimientos de entrada en ${note.warehouse_name}, con lotes automaticos y actualizacion del coste medio.`}
      />
    </div>
  );
}
