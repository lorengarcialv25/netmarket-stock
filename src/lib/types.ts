export interface Warehouse {
  id: string;
  name: string;
  address: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export type ProductType = "final" | "raw_material";
export type UnitOfMeasure = "unidades" | "kg" | "litros" | "metros" | "cajas";

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category_id: string | null;
  unit_of_measure: string;
  purchase_price: number;
  sale_price: number;
  supplier_id: string | null;
  product_type: ProductType;
  min_stock: number;
  weight: number | null;
  weight_unit: string;
  units_per_box: number | null;
  kg_per_box: number | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  category_name?: string;
  supplier_name?: string;
}

export interface BillOfMaterial {
  id: string;
  product_id: string;
  raw_material_id: string;
  quantity: number;
  created_at: string;
  // Joined fields
  raw_material_name?: string;
  raw_material_sku?: string;
  raw_material_unit?: string;
  raw_material_price?: number;
}

export interface WarehouseStock {
  id: string;
  warehouse_id: string;
  product_id: string;
  quantity: number;
  updated_at: string;
  // Joined fields
  warehouse_name?: string;
  product_name?: string;
  product_sku?: string;
  product_type?: ProductType;
  min_stock?: number;
  unit_of_measure?: string;
}

export type MovementType = "entry" | "exit" | "transfer";

export interface StockMovement {
  id: string;
  warehouse_id: string;
  product_id: string;
  movement_type: MovementType;
  quantity: number;
  reason: string | null;
  lot_number: string | null;
  expiry_date: string | null;
  destination_warehouse_id: string | null;
  user_id: string;
  notes: string | null;
  created_at: string;
  // Joined fields
  warehouse_name?: string;
  product_name?: string;
  product_sku?: string;
  destination_warehouse_name?: string;
  user_email?: string;
}

export interface DashboardStats {
  total_products: number;
  total_warehouses: number;
  total_stock_value: number;
  low_stock_count: number;
  recent_movements: StockMovement[];
  stock_by_warehouse: { warehouse_name: string; total_items: number; total_value: number }[];
  movements_summary: { date: string; entries: number; exits: number }[];
}

export interface UserWarehouse {
  id: string;
  user_id: string;
  warehouse_id: string;
  role: "viewer" | "operator" | "manager";
  created_at: string;
}

export type UserRole = "admin" | "warehouse_manager" | "worker" | "viewer";

export interface AppUser {
  id: string;
  email: string;
  full_name?: string;
  role?: UserRole;
}

export interface DeliveryNote {
  id: string;
  supplier_id: string | null;
  warehouse_id: string;
  note_number: string;
  note_date: string;
  notes: string | null;
  confirmed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  supplier_name?: string;
  warehouse_name?: string;
  total_lines?: number;
  total_qty?: number;
  total_value?: number;
  document_url?: string | null;
}

export interface DeliveryNoteLine {
  id: string;
  delivery_note_id: string;
  product_id: string;
  quantity: number;
  unit_price: number | null;
  created_at: string;
  product_name?: string;
  sku?: string;
  unit_of_measure?: string;
}
