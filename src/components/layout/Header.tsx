"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, Moon, Sun, LogOut, ChevronDown, PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { WarehouseSelector } from "@/components/layout/WarehouseSelector";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  colaborador: "Colaborador",
  warehouse_manager: "Gestor",
  worker: "Trabajador",
};

interface HeaderProps {
  onMobileMenuClick: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Header({ onMobileMenuClick, collapsed, onToggleCollapse }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
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
        <button
          onClick={onMobileMenuClick}
          className="lg:hidden p-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer"
        >
          <Menu size={18} className="text-foreground" />
        </button>
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

      <WarehouseSelector />

      <div className="flex-1" />

      <div className="flex items-center gap-1">
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

        <div className="w-px h-5 bg-border mx-1.5" />

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
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm font-medium text-foreground max-w-[140px] truncate">
                {user?.full_name || user?.email || "Usuario"}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                {ROLE_LABELS[user?.role || ""] || user?.role || "user"}
              </span>
            </div>
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
