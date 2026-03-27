"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, Moon, Sun, LogOut, ChevronDown, PanelLeftOpen, PanelLeftClose, Zap, ArrowDownToLine, ArrowUpFromLine, Package, Tags, Warehouse, Truck, ClipboardList } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { WarehouseSelector } from "@/components/layout/WarehouseSelector";

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  href: string;
  roles?: string[];
}

const quickActions: QuickAction[] = [
  { icon: <ArrowDownToLine size={15} />, label: "Entrada de Stock", href: "/movimientos/entrada", roles: ["admin", "warehouse_manager", "worker"] },
  { icon: <ArrowUpFromLine size={15} />, label: "Salida de Stock", href: "/movimientos/salida", roles: ["admin", "warehouse_manager", "worker"] },
  { icon: <Package size={15} />, label: "Nuevo Producto", href: "/productos?action=create", roles: ["admin"] },
  { icon: <Truck size={15} />, label: "Nuevo Proveedor", href: "/proveedores?action=create", roles: ["admin"] },
];

interface HeaderProps {
  onMobileMenuClick: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Header({ onMobileMenuClick, collapsed, onToggleCollapse }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  const userRole = user?.role ?? "";
  const visibleActions = quickActions.filter((a) => !a.roles || a.roles.includes(userRole));

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setActionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "U";

  return (
    <header className="h-14 shrink-0 bg-card border-b border-border flex items-center justify-between px-4 lg:px-5">
      <div className="flex items-center gap-1">
        {/* Mobile hamburger */}
        <button
          onClick={onMobileMenuClick}
          className="lg:hidden p-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer"
        >
          <Menu size={18} className="text-foreground" />
        </button>

        {/* Desktop sidebar toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer"
          title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen size={18} className="text-muted-foreground" />
          ) : (
            <PanelLeftClose size={18} className="text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Warehouse selector */}
      <WarehouseSelector />

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        {/* Quick actions */}
        {visibleActions.length > 0 && (
          <div className="relative" ref={actionsRef}>
            <button
              onClick={() => setActionsOpen(!actionsOpen)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer shadow-sm",
                actionsOpen
                  ? "bg-primary text-primary-foreground shadow-primary/25"
                  : "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-md hover:shadow-primary/20 hover:brightness-110 active:scale-[0.97]"
              )}
            >
              <Zap size={14} className={cn("transition-transform duration-200", actionsOpen && "rotate-90")} />
              <span className="hidden sm:inline">Acción rápida</span>
            </button>

            {actionsOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-popover rounded-xl shadow-xl border border-border py-1.5 z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150">
                {visibleActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setActionsOpen(false);
                      const [actionPath, qs] = action.href.split("?");
                      if (pathname === actionPath && qs?.includes("action=create")) {
                        const params = new URLSearchParams(qs);
                        const type = params.get("type");
                        window.dispatchEvent(new CustomEvent("quick-action-create", { detail: type ? { type } : undefined }));
                      } else {
                        router.push(action.href);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer group"
                  >
                    <span className="flex items-center justify-center size-7 rounded-md bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
                      {action.icon}
                    </span>
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md hover:bg-muted transition-colors cursor-pointer"
          title={theme === "light" ? "Modo oscuro" : "Modo claro"}
        >
          {theme === "light" ? (
            <Moon size={16} className="text-muted-foreground" />
          ) : (
            <Sun size={16} className="text-muted-foreground" />
          )}
        </button>

        {/* Separator */}
        <div className="w-px h-5 bg-border mx-1.5" />

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors cursor-pointer",
              userMenuOpen ? "bg-muted" : "hover:bg-muted"
            )}
          >
            <div className="size-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="text-[11px] font-semibold text-primary">{initials}</span>
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:block max-w-[140px] truncate">
              {user?.full_name || user?.email || "Usuario"}
            </span>
            <ChevronDown
              size={14}
              className={cn(
                "text-muted-foreground hidden sm:block transition-transform duration-150",
                userMenuOpen && "rotate-180"
              )}
            />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-60 bg-popover rounded-lg shadow-lg border border-border py-1 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
              <div className="px-3 py-2.5 border-b border-border">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.full_name || "Usuario"}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {user?.email}
                </p>
                <span className="inline-flex items-center mt-1.5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-primary/10 text-primary">
                  {user?.role || "authenticated"}
                </span>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                  Cerrar sesion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
