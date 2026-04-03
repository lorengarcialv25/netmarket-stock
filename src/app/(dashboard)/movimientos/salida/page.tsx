"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { dypai } from "@/lib/dypai";
import { useWarehouseId } from "@/hooks/useWarehouse";
import { sileo } from "sileo";
import {
  ArrowLeft, ScanLine, Plus, Trash2, Save, Loader2,
  FileText, Eye, ArrowUpFromLine, Warehouse, StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSelect } from "@/components/ui/FormInput";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";
import { movementReasonLabel, canCreateMovements } from "@/lib/utils";

interface ProductOption { id: string; name: string; sku: string; purchase_price: number; unit_of_measure: string; }
interface CatalogOption { id: string; name: string; }
interface DraftLine {
  key: string; product_id: string; product_name: string; sku: string;
  quantity: string; matched: boolean;
}

const EXIT_REASONS = ["sale", "waste", "damage", "production_consumption", "adjustment_out", "recount", "other"];

export default function SalidaStockPage() {
  const router = useRouter();
  const { user } = useAuth();
  const ocrRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && !canCreateMovements(user.role)) router.replace("/movimientos");
  }, [user, router]);

  const warehouseId = useWarehouseId() || "";
  const [reason, setReason] = useState("sale");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);

  const [warehouses, setWarehouses] = useState<CatalogOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);

  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [docName, setDocName] = useState("");

  useEffect(() => {
    (async () => {
      const [whRes, prodRes] = await Promise.all([
        dypai.api.get("list_warehouses"),
        dypai.api.get("list_products", { params: { page_size: 10000 } }),
      ]);
      if (whRes.data) setWarehouses(whRes.data);
      if (prodRes.data) setProducts(prodRes.data);
    })();
  }, []);

  const productOptions = products.map((p) => ({ value: p.id, label: `${p.sku} - ${p.name}` }));

  const addLine = () => setLines((prev) => [...prev, { key: crypto.randomUUID(), product_id: "", product_name: "", sku: "", quantity: "", matched: true }]);

  const updateLine = (key: string, field: string, value: string) => {
    setLines((prev) => prev.map((l) => {
      if (l.key !== key) return l;
      if (field === "product_id") {
        const prod = products.find((p) => p.id === value);
        return { ...l, product_id: value, product_name: prod?.name || "", sku: prod?.sku || "", matched: true };
      }
      return { ...l, [field]: value };
    }));
  };

  const removeLine = (key: string) => setLines((prev) => prev.filter((l) => l.key !== key));

  const handleOcr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (ocrRef.current) ocrRef.current.value = "";
    setScanning(true);
    setDocPreview(URL.createObjectURL(file));
    setDocName(file.name);
    try {
      const base64 = await new Promise<string>((r) => { const reader = new FileReader(); reader.onload = () => r(reader.result as string); reader.readAsDataURL(file); });
      const isPdf = file.type === "application/pdf";
      const content = isPdf
        ? [{ type: "text", text: "Procesa este documento de salida de stock y extrae todos los productos con cantidades." }, { type: "file", data: base64.split(",")[1], mimeType: file.type }]
        : [{ type: "text", text: "Procesa este documento de salida de stock y extrae todos los productos con cantidades." }, { type: "image", image: base64 }];
      const { data, error } = await dypai.api.post("ocr_exit_document", { messages: [{ role: "user", content }] });
      if (error) { sileo.error({ title: "Error al procesar documento" }); return; }
      const text = data?.content || data?.message || (typeof data === "string" ? data : "");
      let parsed;
      try { const m = text.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : null; } catch { sileo.error({ title: "No se pudo interpretar" }); return; }
      if (!parsed) { sileo.error({ title: "No se extrajeron datos" }); return; }
      if (parsed.notes && !notes) setNotes(parsed.notes);
      if (parsed.lines?.length) {
        const newLines: DraftLine[] = parsed.lines.map((l: any) => {
          const matched = !!l.product_id;
          const prod = matched ? products.find((p) => p.id === l.product_id) : null;
          return { key: crypto.randomUUID(), product_id: l.product_id || "", product_name: l.product_name_original || l.product_name || "", sku: l.product_sku || prod?.sku || "", quantity: String(l.quantity || ""), matched };
        });
        setLines((prev) => [...prev, ...newLines]);
        const m = newLines.filter((l) => l.matched).length;
        sileo.success({ title: `${newLines.length} lineas detectadas, ${m} asociadas` });
      }
    } catch { sileo.error({ title: "Error al procesar documento" }); } finally { setScanning(false); }
  };

  const handleSave = async () => {
    if (!warehouseId) { sileo.error({ title: "Selecciona un almacen" }); return; }
    if (!reason) { sileo.error({ title: "Selecciona un motivo" }); return; }
    const valid = lines.filter((l) => l.product_id && l.quantity);
    if (valid.length === 0) { sileo.error({ title: "Anade al menos una linea" }); return; }
    setSaving(true);
    let ok = 0, fail = 0;
    for (const line of valid) {
      const { error } = await dypai.api.post("create_stock_movement", {
        movement_type: "exit", warehouse_id: warehouseId, product_id: line.product_id,
        quantity: Number(line.quantity), reason, notes: notes || undefined,
      });
      if (error) fail++; else ok++;
    }
    setSaving(false);
    if (fail > 0) sileo.warning({ title: `${ok} salidas creadas, ${fail} fallaron` });
    else sileo.success({ title: `${ok} salidas de stock registradas` });
    router.push("/movimientos");
  };

  const totalQty = lines.reduce((s, l) => s + (Number(l.quantity) || 0), 0);
  const validCount = lines.filter((l) => l.product_id && l.quantity).length;
  const unmatchedCount = lines.filter((l) => !l.matched && !l.product_id).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/movimientos")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight">Salida de Stock</h1>
              <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 uppercase text-[10px] font-bold">
                <ArrowUpFromLine className="h-3 w-3 mr-1" />
                Salida
              </Badge>
            </div>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Registra la salida de productos del inventario
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => ocrRef.current?.click()} disabled={scanning} className="gap-2">
            {scanning ? <Loader2 size={16} className="animate-spin" /> : <ScanLine size={16} />}
            {scanning ? "Procesando..." : "Escanear documento"}
          </Button>
          <input ref={ocrRef} type="file" accept="image/*,application/pdf" onChange={handleOcr} className="hidden" />
        </div>
      </div>

      {/* Scanning */}
      {scanning && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-center py-8 gap-4">
            <Spinner size="md" />
            <div>
              <p className="font-medium">Analizando documento con IA...</p>
              <p className="text-sm text-muted-foreground">Extrayendo productos y cantidades</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document preview */}
      {docPreview && !scanning && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="flex items-center gap-3 py-3">
            <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
              <FileText size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{docName}</p>
              <p className="text-xs text-muted-foreground">Documento procesado correctamente</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.open(docPreview, "_blank")} className="gap-1.5">
              <Eye size={14} /> Ver documento
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Config */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/30">
          <CardTitle className="text-base flex items-center gap-2">
            <Warehouse className="h-4 w-4 text-primary" />
            Configuracion
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect label="Motivo de salida" value={reason} onChange={(e) => setReason(e.target.value)} options={EXIT_REASONS.map((r) => ({ value: r, label: movementReasonLabel(r) }))} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
        <CardContent className="py-3 text-sm text-blue-800 dark:text-blue-300">
          No hace falta indicar lote manualmente. Al guardar, la salida se asignará automáticamente por FIFO usando los lotes disponibles.
        </CardContent>
      </Card>

      {/* Lines */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowUpFromLine className="h-4 w-4 text-primary" />
                Productos a dar salida
              </CardTitle>
              {lines.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {lines.length} {lines.length === 1 ? "producto" : "productos"}
                  {unmatchedCount > 0 && <span className="text-amber-600"> · {unmatchedCount} sin asociar</span>}
                </p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={addLine} className="gap-1.5">
              <Plus size={14} /> Anadir
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="size-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <ArrowUpFromLine className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground mb-1 font-medium">No hay productos todavia</p>
              <p className="text-xs text-muted-foreground mb-5">Anade productos manualmente o escanea un documento</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={addLine} className="gap-1.5">
                  <Plus size={14} /> Anadir manualmente
                </Button>
                <Button variant="outline" size="sm" onClick={() => ocrRef.current?.click()} disabled={scanning} className="gap-1.5">
                  <ScanLine size={14} /> Escanear documento
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/20">
                  <tr>
                    <th className="text-[10px] font-black uppercase text-muted-foreground py-3 px-6 text-left w-[50%]">Producto</th>
                    <th className="text-[10px] font-black uppercase text-muted-foreground py-3 text-left w-[15%]">SKU</th>
                    <th className="text-[10px] font-black uppercase text-muted-foreground py-3 text-right pr-6 w-[25%]">Cantidad</th>
                    <th className="py-3 w-[10%]" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => {
                    const needsMatch = !line.matched && !line.product_id;
                    return (
                      <tr key={line.key} className={`hover:bg-muted/20 group transition-colors ${needsMatch ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}`}>
                        <td className="px-6 py-3">
                          {needsMatch && line.product_name && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                              Documento: &ldquo;{line.product_name}&rdquo;
                            </p>
                          )}
                          <SearchableSelect value={line.product_id} onChange={(v) => updateLine(line.key, "product_id", v)} placeholder={needsMatch ? "Seleccionar producto..." : "Buscar producto..."} searchPlaceholder="SKU o nombre..." options={productOptions} />
                        </td>
                        <td className="py-3">
                          <span className="font-mono text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md border border-muted-foreground/10">{line.sku || "-"}</span>
                        </td>
                        <td className="py-3 px-2 pr-6">
                          <input type="number" value={line.quantity} onChange={(e) => updateLine(line.key, "quantity", e.target.value)} placeholder="0" min="1" className="w-full text-right text-sm bg-background border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
                        </td>
                        <td className="py-3 text-center">
                          <button onClick={() => removeLine(line.key)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-muted/10">
                    <td className="px-6 py-4">
                      <button onClick={addLine} className="text-xs text-primary hover:underline cursor-pointer font-medium">+ Anadir otra linea</button>
                    </td>
                    <td className="py-4 text-right text-xs font-bold text-muted-foreground uppercase">Total</td>
                    <td className="py-4 text-right pr-6">
                      <span className="text-base font-black text-primary">{totalQty > 0 ? totalQty.toLocaleString() : "0"}</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase ml-1">uds</span>
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/30">
          <CardTitle className="text-base flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-primary" />
            Notas
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observaciones sobre esta salida de stock (opcional)..."
            rows={3}
            className="w-full text-sm bg-transparent border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground/60"
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between pb-8">
        <Button variant="ghost" onClick={() => router.push("/movimientos")}>Cancelar</Button>
        <Button onClick={handleSave} disabled={saving || validCount === 0 || !warehouseId || !reason} className="gap-2 min-w-[200px]">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Registrando..." : `Registrar ${validCount} salida${validCount !== 1 ? "s" : ""}`}
        </Button>
      </div>
    </div>
  );
}
