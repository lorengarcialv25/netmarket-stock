"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { dypai } from "@/lib/dypai";
import { sileo } from "sileo";
import { useDebounce } from "@/hooks/useDebounce";
import { useWarehouseId } from "@/hooks/useWarehouse";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/shared/PageHeader";
import { FilterBar } from "@/components/shared/FilterBar";
import { Button } from "@/components/ui/button";
import { PackageSearch, Download, CalendarClock, Package, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { exportToExcel } from "@/lib/exportExcel";
import { StockSummary } from "./_components/StockSummary";
import { StockTable } from "./_components/StockTable";

interface StockItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  warehouse_id: string;
  total_quantity: number;
  quantity: number;
  min_stock: number;
  unit_of_measure: string;
  purchase_price: number;
  average_cost?: number;
  sale_price: number;
  lot_number?: string | null;
  lot_quantity?: number | null;
  lot_unit_cost?: number | null;
  expiry_date?: string | null;
  total_count?: string;
}

const PAGE_SIZE = 50;

function groupByProduct(items: StockItem[]): StockItem[] {
  const map = new Map<string, StockItem>();
  for (const item of items) {
    const key = `${item.product_id}-${item.warehouse_id}`;
    if (!map.has(key)) {
      map.set(key, { ...item, lot_number: null, lot_quantity: null, lot_unit_cost: null, expiry_date: null });
    }
  }
  return Array.from(map.values());
}

export default function StockPage() {
  const searchParams = useSearchParams();
  const selectedWarehouseId = useWarehouseId();
  const { user } = useAuth();
  const showPrices = user?.role !== "worker";

  const [stock, setStock] = useState<StockItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [onlyLowStock, setOnlyLowStock] = useState(searchParams.get("low") === "true");
  const [viewMode, setViewMode] = useState<"products" | "lots">("products");
  const [exporting, setExporting] = useState(false);
  const [expiringLots, setExpiringLots] = useState<{id: string; lot_number: string; product_name: string; product_sku: string; warehouse_name: string; expiry_date: string; quantity_available: number; expiry_status: string}[]>([]);

  const fetchStock = useCallback(async (p: number) => {
    setLoading(true);
    const params: Record<string, unknown> = { page: p, page_size: PAGE_SIZE };
    if (debouncedSearch) params.search = debouncedSearch;
    if (selectedWarehouseId) params.warehouse_id = selectedWarehouseId;
    if (onlyLowStock) params.low_stock_only = true;

    const { data, error } = await dypai.api.get("list_warehouse_stock", { params });
    if (!error && data && Array.isArray(data)) {
      setStock(data);
      setTotalItems(data[0]?.total_count ? Number(data[0].total_count) : data.length);
    }
    setLoading(false);
  }, [debouncedSearch, selectedWarehouseId, onlyLowStock]);

  useEffect(() => { setPage(1); }, [debouncedSearch, selectedWarehouseId, onlyLowStock]);
  useEffect(() => { fetchStock(page); }, [fetchStock, page]);

  useEffect(() => {
    async function fetchExpiring() {
      const { data } = await dypai.api.get("list_expiring_lots", {
        params: selectedWarehouseId ? { warehouse_id: selectedWarehouseId } : {},
      });
      if (data && Array.isArray(data)) setExpiringLots(data);
    }
    fetchExpiring();
  }, [selectedWarehouseId]);

  const totalValue = useMemo(
    () =>
      stock.reduce(
        (sum, item) =>
          sum + Number(item.quantity) * Number(item.average_cost ?? item.purchase_price ?? 0),
        0
      ),
    [stock]
  );
  const lowStockCount = useMemo(() => stock.filter((item) => Number(item.quantity) <= Number(item.min_stock)).length, [stock]);

  async function handleExportExcel() {
    setExporting(true);
    try {
      const params: Record<string, unknown> = { page_size: 10000 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedWarehouseId) params.warehouse_id = selectedWarehouseId;
      if (onlyLowStock) params.low_stock_only = true;

      const { data, error } = await dypai.api.get("list_warehouse_stock", { params });
      if (error || !data || !Array.isArray(data)) {
        sileo.error({ title: "Error al exportar stock" });
        return;
      }
      if (data.length === 0) {
        sileo.warning({ title: "No hay datos para exportar" });
        return;
      }
      const withValor = data.map((item: StockItem) => ({
        ...item,
        valor_inventario: Number(item.quantity) * Number(item.average_cost ?? item.purchase_price ?? 0),
      }));
      exportToExcel(withValor as unknown as Record<string, unknown>[], [
        { key: "product_name", label: "Producto" },
        { key: "product_sku", label: "SKU" },
        { key: "lot_number", label: "Lote" },
        { key: "total_quantity", label: "Stock Total", format: (v) => Number(v) },
        { key: "lot_quantity", label: "Qty Lote", format: (v) => v ? Number(v) : "" },
        { key: "min_stock", label: "Stock minimo", format: (v) => Number(v) },
        { key: "unit_of_measure", label: "Unidad" },
        { key: "lot_unit_cost", label: "Coste Lote", format: (v) => v ? Number(v) : "" },
        { key: "average_cost", label: "Coste medio", format: (v) => Number(v) },
        { key: "purchase_price", label: "Ultimo precio compra", format: (v) => Number(v) },
        { key: "sale_price", label: "Precio venta", format: (v) => Number(v) },
        { key: "expiry_date", label: "Caducidad" },
        { key: "valor_inventario", label: "Valor inventario", format: (v) => Math.round(Number(v) * 100) / 100 },
      ], "inventario");
      sileo.success({ title: "Exportacion completada" });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={<PackageSearch size={28} className="text-primary" />}
        title="Control de Stock"
        showAction={false}
        extraActions={user?.role === "admin" ? (
          <Button variant="outline" size="sm" disabled={exporting} onClick={handleExportExcel}>
            <Download size={14} />
            {exporting ? "Exportando..." : "Exportar Excel"}
          </Button>
        ) : undefined}
      />

      <StockSummary
        totalValue={totalValue}
        itemCount={totalItems}
        lowStockCount={lowStockCount}
        showValue={showPrices}
      />

      {expiringLots.length > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CalendarClock size={18} className="text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Lotes proximos a caducar ({expiringLots.length})
            </h3>
          </div>
          <div className="divide-y divide-amber-200/50 dark:divide-amber-800/50">
            {expiringLots.slice(0, 5).map((lot) => {
              const isExpired = lot.expiry_status === "expired";
              return (
                <div key={lot.id} className="flex items-center justify-between py-2 text-sm">
                  <div className="flex items-center gap-3">
                    <span className={`font-medium ${isExpired ? "text-destructive" : "text-amber-700 dark:text-amber-300"}`}>
                      {lot.product_name}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">{lot.lot_number}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{lot.warehouse_name}</span>
                    <span className="font-mono text-xs">{Number(lot.quantity_available).toLocaleString()} uds</span>
                    <span className={`text-xs font-semibold ${isExpired ? "text-destructive" : "text-amber-600 dark:text-amber-400"}`}>
                      {isExpired ? "CADUCADO" : new Date(lot.expiry_date).toLocaleDateString("es-ES")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {expiringLots.length > 5 && (
            <p className="text-xs text-muted-foreground">...y {expiringLots.length - 5} lotes mas</p>
          )}
        </div>
      )}

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre o SKU..."
      >
        {/* View toggle */}
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode("products")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
              viewMode === "products"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            <Package size={13} />
            Productos
          </button>
          <button
            onClick={() => setViewMode("lots")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
              viewMode === "lots"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            <Layers size={13} />
            Lotes
          </button>
        </div>
        <div className="flex items-end">
          <Button
            variant={onlyLowStock ? "destructive" : "outline"}
            size="sm"
            className="h-9"
            onClick={() => setOnlyLowStock(!onlyLowStock)}
          >
            Stock bajo
            {onlyLowStock && ` (${totalItems})`}
          </Button>
        </div>
      </FilterBar>

      <StockTable
        data={viewMode === "products" ? groupByProduct(stock) : stock}
        loading={loading}
        showPrices={showPrices}
        showLots={viewMode === "lots"}
        serverPagination={{
          page,
          pageSize: PAGE_SIZE,
          totalItems,
          onPageChange: setPage,
        }}
      />
    </div>
  );
}
