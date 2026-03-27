"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { dypai } from "@/lib/dypai";
import { sileo } from "sileo";
import { useDebounce } from "@/hooks/useDebounce";
import { PageHeader } from "@/components/shared/PageHeader";
import { FilterBar } from "@/components/shared/FilterBar";
import { FormSelect } from "@/components/ui/FormInput";
import { Button } from "@/components/ui/button";
import { PackageSearch, Download } from "lucide-react";
import { exportToExcel } from "@/lib/exportExcel";
import { StockSummary } from "./_components/StockSummary";
import { StockTable } from "./_components/StockTable";

interface StockItem {
  id: string;
  product_name: string;
  product_sku: string;
  warehouse_id: string;
  warehouse_name: string;
  quantity: number;
  min_stock: number;
  unit_of_measure: string;
  purchase_price: number;
  sale_price: number;
  total_count?: string;
}

interface Warehouse {
  id: string;
  name: string;
}

const PAGE_SIZE = 15;

export default function StockPage() {
  const searchParams = useSearchParams();

  const [stock, setStock] = useState<StockItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [onlyLowStock, setOnlyLowStock] = useState(searchParams.get("low") === "true");
  const [exporting, setExporting] = useState(false);

  const fetchStock = useCallback(async (p: number) => {
    setLoading(true);
    const params: Record<string, unknown> = { page: p, page_size: PAGE_SIZE };
    if (debouncedSearch) params.search = debouncedSearch;
    if (selectedWarehouse) params.warehouse_id = selectedWarehouse;
    if (onlyLowStock) params.low_stock_only = true;

    const { data, error } = await dypai.api.get("list_warehouse_stock", { params });
    if (!error && data && Array.isArray(data)) {
      setStock(data);
      setTotalItems(data[0]?.total_count ? Number(data[0].total_count) : data.length);
    }
    setLoading(false);
  }, [debouncedSearch, selectedWarehouse, onlyLowStock]);

  const fetchWarehouses = useCallback(async () => {
    const { data } = await dypai.api.get("list_warehouses");
    if (data) setWarehouses(data);
  }, []);

  useEffect(() => { fetchWarehouses(); }, [fetchWarehouses]);
  useEffect(() => { setPage(1); }, [debouncedSearch, selectedWarehouse, onlyLowStock]);
  useEffect(() => { fetchStock(page); }, [fetchStock, page]);

  const totalValue = useMemo(() => stock.reduce((sum, item) => sum + Number(item.quantity) * Number(item.purchase_price), 0), [stock]);
  const lowStockCount = useMemo(() => stock.filter((item) => Number(item.quantity) <= Number(item.min_stock)).length, [stock]);

  async function handleExportExcel() {
    setExporting(true);
    try {
      const params: Record<string, unknown> = { page_size: 10000 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedWarehouse) params.warehouse_id = selectedWarehouse;
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
        valor_inventario: Number(item.quantity) * Number(item.purchase_price ?? 0),
      }));
      exportToExcel(withValor as unknown as Record<string, unknown>[], [
        { key: "product_name", label: "Producto" },
        { key: "product_sku", label: "SKU" },
        { key: "warehouse_name", label: "Almacen" },
        { key: "quantity", label: "Cantidad", format: (v) => Number(v) },
        { key: "min_stock", label: "Stock minimo", format: (v) => Number(v) },
        { key: "unit_of_measure", label: "Unidad" },
        { key: "purchase_price", label: "Precio compra", format: (v) => Number(v) },
        { key: "sale_price", label: "Precio venta", format: (v) => Number(v) },
        { key: "valor_inventario", label: "Valor inventario", format: (v) => Math.round(Number(v) * 100) / 100 },
      ], "stock_por_almacen");
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
        extraActions={
          <Button variant="outline" size="sm" disabled={exporting} onClick={handleExportExcel}>
            <Download size={14} />
            {exporting ? "Exportando..." : "Exportar Excel"}
          </Button>
        }
      />

      <StockSummary
        totalValue={totalValue}
        itemCount={totalItems}
        lowStockCount={lowStockCount}
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre o SKU..."
      >
        <div className="flex-[0_1_220px]">
          <FormSelect
            label="Almacen"
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            placeholder="Todos los almacenes"
            options={[
              { value: "", label: "Todos los almacenes" },
              ...warehouses.map((w) => ({ value: w.id, label: w.name })),
            ]}
          />
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
        data={stock}
        loading={loading}
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
