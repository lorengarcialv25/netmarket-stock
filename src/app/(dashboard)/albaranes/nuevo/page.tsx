"use client";

import { useState, useEffect, useRef } from "react";
import { useWarehouse } from "@/hooks/useWarehouse";
import { useRouter } from "next/navigation";
import { dypai } from "@/lib/dypai";
import { sileo } from "sileo";
import { ArrowLeft, ScanLine, Save, CheckCircle, Loader2, Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DeliveryNoteForm, type DraftLine, type HeaderFields } from "../_components/DeliveryNoteForm";
import { useAuth } from "@/hooks/useAuth";
import { canManageInventory } from "@/lib/utils";

interface ProductOption { id: string; name: string; sku: string; purchase_price: number; unit_of_measure: string; }
interface CatalogOption { id: string; name: string; }

export default function NuevoAlbaranPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { selected } = useWarehouse();
  const warehouseLocked = selected !== null && selected !== "all";
  const ocrInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && !canManageInventory(user.role)) router.replace("/albaranes");
  }, [user, router]);

  useEffect(() => {
    if (selected === null) return;
    if (selected === "all") {
      setHeader((h) => ({ ...h, warehouseId: "" }));
    } else {
      setHeader((h) => ({ ...h, warehouseId: selected.id }));
    }
  }, [selected]);

  const [header, setHeader] = useState<HeaderFields>({
    noteNumber: "", noteDate: new Date().toISOString().split("T")[0], supplierId: "", warehouseId: "", notes: "",
  });
  const [lines, setLines] = useState<DraftLine[]>([]);

  const [suppliers, setSuppliers] = useState<CatalogOption[]>([]);
  const [warehouses, setWarehouses] = useState<CatalogOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);

  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [supRes, whRes, prodRes] = await Promise.all([
        dypai.api.get("list_suppliers"),
        dypai.api.get("list_warehouses"),
        dypai.api.get("list_products", { params: { page_size: 10000 } }),
      ]);
      if (supRes.data) setSuppliers(supRes.data);
      if (whRes.data) setWarehouses(whRes.data);
      if (prodRes.data) setProducts(prodRes.data);
    })();
  }, []);

  // OCR
  const handleOcrFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (ocrInputRef.current) ocrInputRef.current.value = "";

    setScanning(true);
    setDocumentFile(file);
    setDocumentPreviewUrl(URL.createObjectURL(file));
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

      // Fill header
      if (parsed.note_number && !header.noteNumber) setHeader((h) => ({ ...h, noteNumber: parsed.note_number }));
      if (parsed.note_date && header.noteDate === new Date().toISOString().split("T")[0]) setHeader((h) => ({ ...h, noteDate: parsed.note_date }));
      if (parsed.supplier_name && !header.supplierId) {
        const match = suppliers.find((s) => s.name.toLowerCase().includes(parsed.supplier_name.toLowerCase()) || parsed.supplier_name.toLowerCase().includes(s.name.toLowerCase()));
        if (match) setHeader((h) => ({ ...h, supplierId: match.id }));
      }
      if (parsed.notes) setHeader((h) => ({ ...h, notes: parsed.notes }));

      // Fill lines
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
        setLines((prev) => [...prev, ...newLines]);
        const matched = newLines.filter((l) => l.matched).length;
        const unmatched = newLines.length - matched;
        sileo.success({
          title: `${parsed.lines.length} lineas detectadas, ${matched} asociadas`,
          description: unmatched > 0 ? `${unmatched} sin asociar — selecciona el producto manualmente` : undefined,
        });
      }
    } catch (err) {
      console.error("OCR error:", err);
      sileo.error({ title: "Error al procesar documento" });
    } finally {
      setScanning(false);
    }
  };

  // Save
  const handleSave = async (confirm: boolean) => {
    if (!header.warehouseId) { sileo.error({ title: "Selecciona un almacen" }); return; }
    if (!header.noteNumber) { sileo.error({ title: "Introduce el numero de albaran" }); return; }
    const validLines = lines.filter((l) => l.product_id && l.quantity);
    if (validLines.length === 0) { sileo.error({ title: "Anade al menos una linea" }); return; }
    if (confirm && validLines.some((l) => !l.unit_price || Number(l.unit_price) <= 0)) {
      sileo.error({ title: "Para confirmar el albaran todas las lineas necesitan precio unitario" });
      return;
    }

    setSaving(true);

    let documentUrl = "";
    if (documentFile) {
      const ext = documentFile.name.split(".").pop() || "jpg";
      const filePath = `delivery-notes/${Date.now()}-${header.noteNumber.replace(/[^a-zA-Z0-9-]/g, "_")}.${ext}`;
      const { data: upData, error: upErr } = await dypai.api.upload("storage_delivery_notes", documentFile, { params: { operation: "upload", file_path: filePath } });
      if (!upErr) documentUrl = upData?.path || upData?.name || upData?.file_path || "";
    }

    const { data: noteData, error: noteError } = await dypai.api.post("create_delivery_note", {
      warehouse_id: header.warehouseId, note_number: header.noteNumber, note_date: header.noteDate,
      supplier_id: header.supplierId || "", notes: header.notes, document_url: documentUrl,
    });
    if (noteError || !noteData?.[0]?.id) { sileo.error({ title: "Error al crear albaran" }); setSaving(false); return; }

    const noteId = noteData[0].id;
    for (const line of validLines) {
      await dypai.api.post("add_delivery_note_line", {
        delivery_note_id: noteId, product_id: line.product_id,
        quantity: Number(line.quantity), unit_price: line.unit_price ? Number(line.unit_price) : null,
        expiry_date: line.expiry_date || "",
      });
    }

    if (confirm) {
      const { error } = await dypai.api.post("confirm_delivery_note", { id: noteId });
      if (error) { sileo.warning({ title: "Guardado pero no se pudo confirmar" }); setSaving(false); router.push(`/albaranes/${noteId}`); return; }
      sileo.success({ title: "Albaran confirmado — stock actualizado" });
    } else {
      sileo.success({ title: "Albaran guardado como borrador" });
    }
    setSaving(false);
    router.push(`/albaranes/${noteId}`);
  };

  const validCount = lines.filter((l) => l.product_id && l.quantity).length;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/albaranes")}>
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Nuevo Albaran de Entrada</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => ocrInputRef.current?.click()} disabled={scanning}>
            {scanning ? <Loader2 size={16} className="animate-spin" /> : <ScanLine size={16} />}
            {scanning ? "Procesando..." : "Escanear con IA"}
          </Button>
          <input ref={ocrInputRef} type="file" accept="image/*,application/pdf" onChange={handleOcrFile} className="hidden" />
        </div>
      </div>

      {/* Scanning overlay */}
      {scanning && (
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

      {/* Document preview */}
      {documentPreviewUrl && (
        <Card>
          <CardContent className="flex items-center gap-3 py-3">
            <FileText size={18} className="text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{documentFile?.name}</p>
              <p className="text-xs text-muted-foreground">Documento escaneado — se guardara con el albaran</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.open(documentPreviewUrl, "_blank")}>
              <Eye size={14} />
              Ver documento
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Shared form */}
      <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
        <CardContent className="py-3 text-sm text-emerald-800 dark:text-emerald-300">
          Al confirmar el albarán se generará un lote automático por cada línea de entrada y ese precio unitario alimentará el coste medio del producto.
        </CardContent>
      </Card>

      <DeliveryNoteForm
        header={header}
        onHeaderChange={setHeader}
        lines={lines}
        onLinesChange={setLines}
        suppliers={suppliers}
        warehouses={warehouses}
        products={products}
        onScanClick={() => ocrInputRef.current?.click()}
        scanDisabled={scanning}
        lockWarehouse={warehouseLocked}
      />

      {/* Actions */}
      <div className="flex items-center justify-between pb-8">
        <Button variant="ghost" onClick={() => router.push("/albaranes")}>Cancelar</Button>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving || validCount === 0 || !header.warehouseId || !header.noteNumber}>
            <Save size={16} />
            Guardar Borrador
          </Button>
          <Button onClick={() => setConfirmOpen(true)} disabled={saving || validCount === 0 || !header.warehouseId || !header.noteNumber}>
            <CheckCircle size={16} />
            Confirmar ({validCount} lineas)
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => { setConfirmOpen(false); handleSave(true); }}
        title="Confirmar Albaran"
        message={`Se creara el albaran con ${validCount} lineas, se generaran lotes automaticos y se actualizara el coste medio del stock.`}
      />
    </div>
  );
}
