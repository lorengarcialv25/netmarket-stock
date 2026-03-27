export interface StockItemLike {
  product_name: string;
  product_sku: string;
  warehouse_id: string;
  quantity: number;
  min_stock: number;
}

export function filterStockItems<T extends StockItemLike>(
  items: T[],
  opts: {
    warehouseId: string;
    search: string;
    onlyLowStock: boolean;
  }
): T[] {
  const q = opts.search.trim().toLowerCase();
  return items.filter((item) => {
    const matchesWarehouse =
      !opts.warehouseId || item.warehouse_id === opts.warehouseId;
    const matchesSearch =
      !q ||
      item.product_name.toLowerCase().includes(q) ||
      item.product_sku.toLowerCase().includes(q);
    const matchesLow =
      !opts.onlyLowStock || item.quantity <= item.min_stock;
    return matchesWarehouse && matchesSearch && matchesLow;
  });
}
