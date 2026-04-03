import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(value)
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

/** Fecha sin hora (caducidad, etc.). */
export function formatDateOnly(dateStr: string): string {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

export function movementTypeLabel(type: string): string {
  switch (type) {
    case "entry":
      return "Entrada"
    case "exit":
      return "Salida"
    case "transfer":
      return "Transferencia"
    case "adjustment":
      return "Ajuste"
    default:
      return type
  }
}

export function movementReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    purchase: "Compra",
    sale: "Venta",
    return: "Devolución",
    production: "Producción",
    production_consumption: "Consumo producción",
    waste: "Merma / Desperdicio",
    damage: "Daño / Rotura",
    adjustment_in: "Ajuste entrada",
    adjustment_out: "Ajuste salida",
    transfer: "Transferencia",
    recount: "Recuento / Inventario",
    other: "Otro",
  }
  return labels[reason] ?? reason
}

export function productTypeLabel(type: string): string {
  switch (type) {
    case "finished":
      return "Terminado"
    case "raw_material":
      return "Materia Prima"
    case "component":
      return "Componente"
    default:
      return type
  }
}

// ---- Role helpers ----

export type AppRole = "admin" | "colaborador" | "warehouse_manager" | "worker";

/** Full admin access (manage catalog, admin settings, users) */
export function isAdmin(role?: string): boolean {
  return role === "admin";
}

/** Can see everything like admin (admin + colaborador) */
export function canViewAll(role?: string): boolean {
  return role === "admin" || role === "colaborador";
}

/** Can manage warehouses, categories, delivery notes */
export function canManageInventory(role?: string): boolean {
  return role === "admin" || role === "warehouse_manager";
}

/** Can do operational work (movements, tasks, incidents, albaranes) */
export function canOperate(role?: string): boolean {
  return role === "admin" || role === "colaborador" || role === "warehouse_manager" || role === "worker";
}

/** Can create stock movements (entry/exit/transfer) */
export function canCreateMovements(role?: string): boolean {
  return role === "admin" || role === "colaborador" || role === "warehouse_manager" || role === "worker";
}

