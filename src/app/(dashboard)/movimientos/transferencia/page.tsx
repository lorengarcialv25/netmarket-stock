"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { dypai } from "@/lib/dypai";
import { useAuth } from "@/hooks/useAuth";
import { sileo } from "sileo";
import {
  ArrowLeft, Plus, Trash2, Save, Loader2, ArrowRightLeft, Warehouse,StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormInput } from "@/components/ui/FormInput";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { canCreateMovements } from "@/lib/utils";

interface ProductOption { id: string; name: string; sku: string; }
interface CatalogOption { id: string; name: string; }
interface DraftLine { key: string; product_id: string; product_name: string; sku: string; quantity: string; }

export default function TransferenciaPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [originId, setOriginId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);

  const [warehouses, setWarehouses] = useState<CatalogOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && !canCreateMovements(user.role)) router.replace("/movimientos");
  }, [user, router]);

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
  const destOptions = warehouses.filter((w) => w.id !== originId).map((w) => ({ value: w.id, label: w.name }));

  const addLine = () => setLines((prev) => [...prev, { key: crypto.randomUUID(), product_id: "", product_name: "", sku: "", quantity: "" }]);

  const updateLine = (key: string, field: string, value: string) => {
    setLines((prev) => prev.map((l) => {
      if (l.key !== key) return l;
      if (field === "product_id") {
        const prod = products.find((p) => p.id === value);
        return { ...l, product_id: value, product_name: prod?.name || "", sku: prod?.sku || "" };
      }
      return { ...l, [field]: value };
    }));
  };

  const removeLine = (key: string) => setLines((prev) => prev.filter((l) => l.key !== key));

  const handleSave = async () => {
    if (!originId) { sileo.error({ title: "Selecciona almacen de origen" }); return; }
    if (!destinationId) { sileo.error({ title: "Selecciona almacen de destino" }); return; }
    if (originId === destinationId) { sileo.error({ title: "Origen y destino deben ser diferentes" }); return; }
    const valid = lines.filter((l) => l.product_id && l.quantity);
    if (valid.length === 0) { sileo.error({ title: "Anade al menos una linea" }); return; }
    setSaving(true);
    let ok = 0, fail = 0;
    for (const line of valid) {
      const { error } = await dypai.api.post("create_stock_movement", {
        movement_type: "transfer", warehouse_id: originId, product_id: line.product_id,
        quantity: Number(line.quantity), reason: "transfer",
        destination_warehouse_id: destinationId, notes: notes || undefined,
      });
      if (error) fail++; else ok++;
    }
    setSaving(false);
    if (fail > 0) sileo.warning({ title: `${ok} transferencias creadas, ${fail} fallaron` });
    else sileo.success({ title: `${ok} transferencias registradas` });
    router.push("/movimientos");
  };

  const totalQty = lines.reduce((s, l) => s + (Number(l.quantity) || 0), 0);
  const validCount = lines.filter((l) => l.product_id && l.quantity).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/movimientos")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight">Transferencia de Stock</h1>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 uppercase text-[10px] font-bold">
                <ArrowRightLeft className="h-3 w-3 mr-1" />
                Transferencia
              </Badge>
            </div>
            <p className="text-muted-foreground mt-0.5 text-sm">Mueve productos entre almacenes</p>
          </div>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/30">
          <CardTitle className="text-base flex items-center gap-2">
            <Warehouse className="h-4 w-4 text-primary" />
            Almacenes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SearchableSelect label="Almacen de origen" value={originId} onChange={(v) => { setOriginId(v); if (v === destinationId) setDestinationId(""); }} placeholder="Seleccionar..." searchPlaceholder="Buscar almacen..." options={warehouses.map((w) => ({ value: w.id, label: w.name }))} />
            <SearchableSelect label="Almacen de destino" value={destinationId} onChange={setDestinationId} placeholder="Seleccionar..." searchPlaceholder="Buscar almacen..." options={destOptions} />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-primary" />
                Productos a transferir
              </CardTitle>
              {lines.length > 0 && <p className="text-xs text-muted-foreground mt-1">{lines.length} producto{lines.length !== 1 ? "s" : ""}</p>}
            </div>
            <Button variant="outline" size="sm" onClick={addLine} className="gap-1.5"><Plus size={14} /> Anadir</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="size-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <ArrowRightLeft className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground mb-1 font-medium">No hay productos todavia</p>
              <p className="text-xs text-muted-foreground mb-5">Anade los productos que quieres transferir</p>
              <Button variant="outline" size="sm" onClick={addLine} className="gap-1.5"><Plus size={14} /> Anadir producto</Button>
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
                  {lines.map((line) => (
                    <tr key={line.key} className="hover:bg-muted/20 group transition-colors">
                      <td className="px-6 py-3">
                        <SearchableSelect value={line.product_id} onChange={(v) => updateLine(line.key, "product_id", v)} placeholder="Buscar producto..." searchPlaceholder="SKU o nombre..." options={productOptions} />
                      </td>
                      <td className="py-3">
                        <span className="font-mono text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md border border-muted-foreground/10">{line.sku || "-"}</span>
                      </td>
                      <td className="py-3 px-2 pr-6">
                        <input type="number" value={line.quantity} onChange={(e) => updateLine(line.key, "quantity", e.target.value)} placeholder="0" min="1" className="w-full text-right text-sm bg-background border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
                      </td>
                      <td className="py-3 text-center">
                        <button onClick={() => removeLine(line.key)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-muted/10">
                    <td className="px-6 py-4"><button onClick={addLine} className="text-xs text-primary hover:underline cursor-pointer font-medium">+ Anadir otra linea</button></td>
                    <td className="py-4 text-right text-xs font-bold text-muted-foreground uppercase">Total</td>
                    <td className="py-4 text-right pr-6"><span className="text-base font-black text-primary">{totalQty > 0 ? totalQty.toLocaleString() : "0"}</span><span className="text-[10px] font-bold text-muted-foreground uppercase ml-1">uds</span></td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/30">
          <CardTitle className="text-base flex items-center gap-2"><StickyNote className="h-4 w-4 text-primary" /> Notas</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones sobre esta transferencia (opcional)..." rows={3} className="w-full text-sm bg-transparent border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground/60" />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between pb-8">
        <Button variant="ghost" onClick={() => router.push("/movimientos")}>Cancelar</Button>
        <Button onClick={handleSave} disabled={saving || validCount === 0 || !originId || !destinationId} className="gap-2 min-w-[200px]">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Registrando..." : `Transferir ${validCount} producto${validCount !== 1 ? "s" : ""}`}
        </Button>
      </div>
    </div>
  );
}
