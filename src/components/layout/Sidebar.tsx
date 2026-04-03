"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Warehouse,
  Package,
  Truck,
  Tags,
  ClipboardList,
  ArrowRightLeft,
  PackageSearch,
  FileText,
  Users,
  CheckSquare,
  AlertCircle,
  Link2,
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  roles?: string[]; // if set, only these roles see this item
};

type NavSection = {
  label: string;
  items: NavItem[];
};

// Roles that can see management/catalog pages
const MGMT = ["admin", "colaborador", "warehouse_manager"];
const ADMIN_ONLY = ["admin"];

const navSections: NavSection[] = [
  {
    label: "General",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: MGMT },
      { href: "/tareas", label: "Tareas", icon: CheckSquare },
    ],
  },
  {
    label: "Flujo de trabajo",
    items: [
      { href: "/escandallos", label: "Escandallos", icon: ClipboardList, roles: MGMT },
      { href: "/albaranes", label: "Albaranes", icon: FileText },
      { href: "/stock", label: "Inventario", icon: PackageSearch },
      { href: "/movimientos", label: "Movimientos", icon: ArrowRightLeft },
      { href: "/incidencias", label: "Incidencias", icon: AlertCircle },
    ],
  },
  {
    label: "Catalogo",
    items: [
      { href: "/productos", label: "Productos", icon: Package, roles: MGMT },
      { href: "/proveedores", label: "Proveedores", icon: Truck, roles: MGMT },
      { href: "/referencias", label: "Refs. Proveedor", icon: Link2, roles: MGMT },
    ],
  },
  {
    label: "Administracion",
    items: [
      { href: "/metricas", label: "Metricas", icon: BarChart3, roles: MGMT },
      { href: "/categorias", label: "Categorias", icon: Tags, roles: ADMIN_ONLY },
      { href: "/almacenes", label: "Almacenes", icon: Warehouse, roles: ADMIN_ONLY },
      { href: "/usuarios", label: "Usuarios", icon: Users, roles: ADMIN_ONLY },
    ],
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  collapsed: boolean;
}

export function Sidebar({ mobileOpen, onMobileClose, collapsed }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.roles || item.roles.includes(user?.role || "")),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onMobileClose} />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-sidebar flex flex-col transition-all duration-200 ease-out lg:static lg:z-auto lg:shrink-0 border-r border-sidebar-border",
          // Mobile: slide in/out
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: always visible, width changes
          collapsed ? "lg:translate-x-0 lg:w-[68px]" : "lg:translate-x-0 lg:w-[260px]",
          // Mobile always full width sidebar
          "w-[260px]"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-14 shrink-0">
          <Link href="/" className={cn("flex items-center gap-2.5 group", collapsed && "lg:justify-center")}>
            <div className="size-8 bg-primary rounded-lg flex items-center justify-center shadow-sm shrink-0">
              <Package size={16} className="text-primary-foreground" />
            </div>
            <span className={cn(
              "text-sidebar-primary-foreground font-semibold text-[15px] tracking-tight transition-opacity duration-200",
              collapsed ? "lg:hidden" : "lg:block"
            )}>
              StockPro
            </span>
          </Link>
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1 rounded-md hover:bg-sidebar-accent cursor-pointer transition-colors"
          >
            <X size={16} className="text-sidebar-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className={cn(
          "flex-1 pt-2 pb-4 overflow-y-auto",
          collapsed ? "lg:px-2 px-3 lg:space-y-2 space-y-6" : "px-3 space-y-6"
        )}>
          {visibleSections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 hidden lg:block">
                  {section.label}
                </p>
              )}
              {/* Always show labels on mobile */}
              <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 lg:hidden">
                {section.label}
              </p>
              {collapsed && (
                <div className="hidden lg:block w-8 mx-auto mb-1.5 border-t border-sidebar-border" />
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onMobileClose}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "group flex items-center rounded-md text-[13px] font-medium transition-colors relative",
                        collapsed
                          ? "lg:justify-center lg:px-0 lg:py-2 px-3 py-[7px] gap-2.5"
                          : "px-3 py-[7px] gap-2.5",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon
                        size={collapsed ? 18 : 16}
                        strokeWidth={isActive ? 2 : 1.75}
                        className={cn(
                          "shrink-0 transition-colors",
                          isActive ? "text-primary" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
                        )}
                      />
                      <span className={cn(
                        "truncate",
                        collapsed ? "lg:hidden" : ""
                      )}>
                        {item.label}
                      </span>
                      {isActive && !collapsed && (
                        <ChevronRight size={14} className="ml-auto text-sidebar-foreground/30 hidden lg:block" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

      </aside>
    </>
  );
}
