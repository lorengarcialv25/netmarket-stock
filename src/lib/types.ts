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
  average_cost?: number;
  sale_price: number;
  supplier_id: string | null;
  product_type: ProductType;
  min_stock: number;
  weight: number | null;
  weight_display: string | null;
  weight_unit: string;
  units_per_box: number | null;
  kg_per_box: number | null;
  units_per_box_blister: string | null;
  kg_per_box_blister: number | null;
  units_per_box_60cm: string | null;
  kg_per_box_60cm: number | null;
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
  quantity_display?: number;
  quantity_unit?: string;
  display_quantity?: number;
  display_unit?: string;
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
  purchase_price?: number;
  average_cost?: number;
  sale_price?: number;
}

export type MovementType = "entry" | "exit" | "transfer";

export interface MovementLotAllocation {
  lot_number: string;
  quantity: number;
  unit_cost: number | null;
}

export interface InventoryLot {
  id: string;
  lot_number: string;
  product_id: string;
  warehouse_id: string;
  warehouse_name?: string;
  product_name?: string;
  product_sku?: string;
  expiry_date: string | null;
  quantity_received: number;
  quantity_available: number;
  unit_cost: number;
  received_at: string;
  created_at: string;
  expiry_status?: "expired" | "expiring_soon" | "ok";
}

export interface StockMovement {
  id: string;
  warehouse_id: string;
  product_id: string;
  movement_type: MovementType;
  quantity: number;
  reason: string | null;
  lot_number: string | null;
  lot_allocations?: string | null;
  expiry_date: string | null;
  destination_warehouse_id: string | null;
  user_id: string;
  notes: string | null;
  unit_cost?: number | null;
  total_cost?: number | null;
  delivery_note_id?: string | null;
  created_at: string;
  // Joined fields
  warehouse_name?: string;
  product_name?: string;
  product_sku?: string;
  destination_warehouse_name?: string;
  user_email?: string;
  lot_allocation_items?: MovementLotAllocation[];
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

export type UserRole = "admin" | "colaborador" | "warehouse_manager" | "worker";

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

export type TaskStatus = string;
export type TaskPriority = "urgente" | "alta" | "media" | "baja";
export type TaskType = "manual" | "fabricacion" | "reposicion" | "auto_stock_bajo";

export interface TaskStatusColumn {
  id: string;
  name: string;
  label: string;
  color: string;
  position: number;
  is_terminal: boolean;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  task_type: TaskType;
  due_date: string | null;
  assigned_to: string | null;
  created_by: string | null;
  tags: string[] | null;
  checklist: ChecklistItem[] | null;
  related_product_id: string | null;
  related_warehouse_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  assigned_to_name?: string | null;
  created_by_name?: string | null;
  related_product_name?: string | null;
  related_warehouse_name?: string | null;
  attachment_count?: number;
  comment_count?: number;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
  uploaded_by_name?: string | null;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
}

export interface TaskActivity {
  id: string;
  task_id: string;
  user_id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
  user_name?: string;
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

export type IncidentType = "damaged" | "missing" | "quality" | "other";
export type IncidentSeverity = "baja" | "media" | "alta" | "critica";
export type IncidentStatus = "abierta" | "en_revision" | "resuelta" | "cerrada";

export interface Incident {
  id: string;
  incident_number: string;
  incident_date: string;
  incident_type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  description: string | null;
  warehouse_id: string | null;
  supplier_id: string | null;
  delivery_note_id: string | null;
  affected_products: string | null;
  resolution: string | null;
  notes: string | null;
  created_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  warehouse_name?: string;
  supplier_name?: string;
  created_by_name?: string;
  attachment_count?: number;
}

export interface IncidentAttachment {
  id: string;
  incident_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
  uploaded_by_name?: string | null;
}

export interface SupplierProductRef {
  id: string;
  supplier_id: string;
  product_id: string;
  supplier_sku: string;
  supplier_name: string | null;
  supplier_barcode: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  supplier_name_display?: string;
  product_sku?: string;
  product_name?: string;
  product_type?: string;
}
