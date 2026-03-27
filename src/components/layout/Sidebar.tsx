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
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const roleLabels: Record<string, string> = {
  admin: "Admin",
  warehouse_manager: "Gestor",
  worker: "Operario",
  viewer: "Visualizador",
};

const navSections = [
  {
    label: "General",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/metricas", label: "Métricas", icon: BarChart3 },
    ],
  },
  {
    label: "Inventario",
    items: [
      { href: "/productos", label: "Productos", icon: Package },
      { href: "/categorias", label: "Categorias", icon: Tags },
      { href: "/escandallos", label: "Escandallos", icon: ClipboardList },
    ],
  },
  {
    label: "Almacenamiento",
    items: [
      { href: "/almacenes", label: "Almacenes", icon: Warehouse },
      { href: "/stock", label: "Stock", icon: PackageSearch },
      { href: "/movimientos", label: "Movimientos", icon: ArrowRightLeft },
      { href: "/albaranes", label: "Albaranes", icon: FileText },
    ],
  },
  {
    label: "Proveedores",
    items: [
      { href: "/proveedores", label: "Proveedores", icon: Truck },
    ],
  },
  {
    label: "Administración",
    adminOnly: true,
    items: [
      { href: "/usuarios", label: "Usuarios", icon: Users },
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
  const roleName = roleLabels[user?.role || ""] || user?.role || "authenticated";

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
          {navSections.filter((s) => !s.adminOnly || user?.role === "admin").map((section) => (
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

        {/* Footer - User info */}
        <div className={cn(
          "py-3 border-t border-sidebar-border shrink-0",
          collapsed ? "lg:px-2 lg:text-center px-4" : "px-4"
        )}>
          <div className={cn(
            "flex items-center gap-2.5",
            collapsed ? "lg:justify-center" : ""
          )}>
            {/* Avatar */}
            <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-semibold text-primary">
                {user?.full_name
                  ? user.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                  : user?.email?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            {/* Name + role */}
            <div className={cn("flex-1 min-w-0", collapsed ? "lg:hidden" : "")}>
              <p className="text-[13px] font-medium text-sidebar-foreground truncate">
                {user?.full_name || user?.email?.split("@")[0] || "Usuario"}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                {roleName}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
