import { exportWorkbook, type ExportSheetSpec } from "./exportExcel";

type ApiGet = (
  name: string,
  opts?: { params?: Record<string, unknown> }
) => Promise<{ data?: unknown; error?: unknown }>;

interface FinalProduct {
  id: string;
  sku: string;
  name: string;
  unit_of_measure: string;
  sale_price: number;
}

/** Línea de BOM tal como devuelve `get_bill_of_materials`. */
interface BomLine {
  raw_material_sku?: string;
  raw_material_name?: string;
  quantity: number;
  raw_material_unit?: string;
  raw_material_price?: number;
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Descarga un Excel con dos hojas: resumen por producto final y detalle por línea de escandallo.
 * Recorre todos los productos finales y consulta el BOM de cada uno.
 */
export async function exportEscandallosWorkbook(apiGet: ApiGet): Promise<
  | { ok: true }
  | { ok: false; message: string }
> {
  const { data: raw, error } = await apiGet("list_products", {
    params: { product_type: "final", page_size: 10000 },
  });
  if (error) {
    return { ok: false, message: "No se pudo cargar el catálogo de productos finales." };
  }
  const products = (Array.isArray(raw) ? raw : []) as FinalProduct[];
  if (products.length === 0) {
    return { ok: false, message: "No hay productos finales para exportar." };
  }

  const CHUNK = 14;
  const pairs: { product: FinalProduct; bom: BomLine[] }[] = [];

  for (let i = 0; i < products.length; i += CHUNK) {
    const chunk = products.slice(i, i + CHUNK);
    const part = await Promise.all(
      chunk.map(async (p) => {
        const { data: bomRaw } = await apiGet("get_bill_of_materials", {
          params: { product_id: p.id },
        });
        const bom = (Array.isArray(bomRaw) ? bomRaw : []) as BomLine[];
        return { product: p, bom };
      })
    );
    pairs.push(...part);
  }

  const summaryRows: Record<string, unknown>[] = [];
  const detailRows: Record<string, unknown>[] = [];

  for (const { product: p, bom } of pairs) {
    const totalCost = bom.reduce(
      (s, line) => s + num(line.quantity) * num(line.raw_material_price),
      0
    );
    const sale = num(p.sale_price);
    const margin = sale - totalCost;
    const marginPct = sale > 0 ? (margin / sale) * 100 : 0;

    summaryRows.push({
      sku_final: p.sku,
      nombre_final: p.name,
      unidad: p.unit_of_measure ?? "",
      pvp: Math.round(sale * 100) / 100,
      coste_escandallo: Math.round(totalCost * 100) / 100,
      margen_unidad: Math.round(margin * 100) / 100,
      margen_pct: Math.round(marginPct * 100) / 100,
      lineas_bom: bom.length,
    });

    for (const line of bom) {
      const subtotal = num(line.quantity) * num(line.raw_material_price);
      const pctCost = totalCost > 0 ? (subtotal / totalCost) * 100 : 0;
      detailRows.push({
        sku_producto_final: p.sku,
        nombre_producto_final: p.name,
        pvp: Math.round(sale * 100) / 100,
        sku_materia_prima: line.raw_material_sku ?? "",
        materia_prima: line.raw_material_name ?? "",
        cantidad: num(line.quantity),
        unidad_materia_prima: line.raw_material_unit ?? "",
        precio_unitario: Math.round(num(line.raw_material_price) * 100) / 100,
        subtotal_linea: Math.round(subtotal * 100) / 100,
        pct_sobre_coste_total: Math.round(pctCost * 100) / 100,
      });
    }
  }

  const summarySpec: ExportSheetSpec = {
    name: "Resumen escandallos",
    columns: [
      { key: "sku_final", label: "SKU producto final" },
      { key: "nombre_final", label: "Nombre producto final" },
      { key: "unidad", label: "Unidad" },
      { key: "pvp", label: "PVP (€)", format: (v) => Number(v) },
      { key: "coste_escandallo", label: "Coste escandallo (€)", format: (v) => Number(v) },
      { key: "margen_unidad", label: "Margen / unidad (€)", format: (v) => Number(v) },
      { key: "margen_pct", label: "% Margen", format: (v) => Number(v) },
      { key: "lineas_bom", label: "Nº líneas BOM", format: (v) => Number(v) },
    ],
    data: summaryRows,
  };

  const detailSpec: ExportSheetSpec = {
    name: "Detalle componentes",
    columns: [
      { key: "sku_producto_final", label: "SKU producto final" },
      { key: "nombre_producto_final", label: "Nombre producto final" },
      { key: "pvp", label: "PVP (€)", format: (v) => Number(v) },
      { key: "sku_materia_prima", label: "SKU materia prima" },
      { key: "materia_prima", label: "Materia prima" },
      { key: "cantidad", label: "Cantidad", format: (v) => Number(v) },
      { key: "unidad_materia_prima", label: "Unidad MP" },
      { key: "precio_unitario", label: "Precio unitario MP (€)", format: (v) => Number(v) },
      { key: "subtotal_linea", label: "Subtotal línea (€)", format: (v) => Number(v) },
      { key: "pct_sobre_coste_total", label: "% sobre coste total", format: (v) => Number(v) },
    ],
    data: detailRows,
  };

  exportWorkbook([summarySpec, detailSpec], "escandallos", { skipEmpty: false });
  return { ok: true };
}

/** Exporta el escandallo del producto seleccionado (misma estructura que el informe global). */
export function exportSingleBomWorkbook(
  product: FinalProduct,
  bom: BomLine[]
): void {
  const totalCost = bom.reduce(
    (s, line) => s + num(line.quantity) * num(line.raw_material_price),
    0
  );
  const sale = num(product.sale_price);
  const margin = sale - totalCost;
  const marginPct = sale > 0 ? (margin / sale) * 100 : 0;

  const summaryRows: Record<string, unknown>[] = [
    {
      sku_final: product.sku,
      nombre_final: product.name,
      unidad: product.unit_of_measure ?? "",
      pvp: Math.round(sale * 100) / 100,
      coste_escandallo: Math.round(totalCost * 100) / 100,
      margen_unidad: Math.round(margin * 100) / 100,
      margen_pct: Math.round(marginPct * 100) / 100,
      lineas_bom: bom.length,
    },
  ];

  const detailRows: Record<string, unknown>[] = bom.map((line) => {
    const subtotal = num(line.quantity) * num(line.raw_material_price);
    const pctCost = totalCost > 0 ? (subtotal / totalCost) * 100 : 0;
    return {
      sku_producto_final: product.sku,
      nombre_producto_final: product.name,
      pvp: Math.round(sale * 100) / 100,
      sku_materia_prima: line.raw_material_sku ?? "",
      materia_prima: line.raw_material_name ?? "",
      cantidad: num(line.quantity),
      unidad_materia_prima: line.raw_material_unit ?? "",
      precio_unitario: Math.round(num(line.raw_material_price) * 100) / 100,
      subtotal_linea: Math.round(subtotal * 100) / 100,
      pct_sobre_coste_total: Math.round(pctCost * 100) / 100,
    };
  });

  const summarySpec: ExportSheetSpec = {
    name: "Resumen escandallo",
    columns: [
      { key: "sku_final", label: "SKU producto final" },
      { key: "nombre_final", label: "Nombre producto final" },
      { key: "unidad", label: "Unidad" },
      { key: "pvp", label: "PVP (€)", format: (v) => Number(v) },
      { key: "coste_escandallo", label: "Coste escandallo (€)", format: (v) => Number(v) },
      { key: "margen_unidad", label: "Margen / unidad (€)", format: (v) => Number(v) },
      { key: "margen_pct", label: "% Margen", format: (v) => Number(v) },
      { key: "lineas_bom", label: "Nº líneas BOM", format: (v) => Number(v) },
    ],
    data: summaryRows,
  };

  const detailSpec: ExportSheetSpec = {
    name: "Detalle componentes",
    columns: [
      { key: "sku_producto_final", label: "SKU producto final" },
      { key: "nombre_producto_final", label: "Nombre producto final" },
      { key: "pvp", label: "PVP (€)", format: (v) => Number(v) },
      { key: "sku_materia_prima", label: "SKU materia prima" },
      { key: "materia_prima", label: "Materia prima" },
      { key: "cantidad", label: "Cantidad", format: (v) => Number(v) },
      { key: "unidad_materia_prima", label: "Unidad MP" },
      { key: "precio_unitario", label: "Precio unitario MP (€)", format: (v) => Number(v) },
      { key: "subtotal_linea", label: "Subtotal línea (€)", format: (v) => Number(v) },
      { key: "pct_sobre_coste_total", label: "% sobre coste total", format: (v) => Number(v) },
    ],
    data: detailRows,
  };

  const safeSku = product.sku.replace(/[/\\?*[\]:]/g, "_").slice(0, 80);
  exportWorkbook([summarySpec, detailSpec], `escandallo_${safeSku}`, { skipEmpty: false });
}
