"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  Zap,
  X,
  ArrowDownToLine,
  ArrowUpFromLine,
  Package,
  Tags,
  Warehouse,
  Truck,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  href?: string;
  action?: string;
  roles?: string[];
}

const actions: QuickAction[] = [
  {
    icon: <ArrowDownToLine size={18} />,
    label: "Entrada de Stock",
    href: "/movimientos/entrada",
    roles: ["admin", "warehouse_manager", "worker"],
  },
  {
    icon: <ArrowUpFromLine size={18} />,
    label: "Salida de Stock",
    href: "/movimientos/salida",
    roles: ["admin", "warehouse_manager", "worker"],
  },
  {
    icon: <Package size={18} />,
    label: "Nuevo Producto",
    href: "/productos?action=create",
    roles: ["admin"],
  },
  {
    icon: <Truck size={18} />,
    label: "Nuevo Proveedor",
    href: "/proveedores?action=create",
    roles: ["admin"],
  },
];

export function QuickActions() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  const userRole = user?.role ?? "";

  const visibleActions = actions.filter(
    (a) => !a.roles || a.roles.includes(userRole)
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [open]);

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Action items */}
      <div
        className={cn(
          "flex flex-col gap-1.5 transition-all duration-200 origin-bottom",
          open
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-2 pointer-events-none"
        )}
      >
        {visibleActions.map((action, i) => (
          <button
            key={i}
            onClick={() => {
              setOpen(false);
              if (action.href) {
                const targetPath = action.href.split("?")[0];
                if (pathname === targetPath) {
                  const params = new URLSearchParams(action.href.split("?")[1] || "");
                  const type = params.get("type");
                  window.dispatchEvent(new CustomEvent("quick-action-create", { detail: type ? { type } : undefined }));
                } else {
                  router.push(action.href);
                }
              }
            }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-card border border-border shadow-lg hover:bg-muted/80 transition-colors text-sm font-medium text-foreground whitespace-nowrap cursor-pointer"
          >
            <span className="text-primary">{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>

      {/* FAB button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "size-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 cursor-pointer",
          open
            ? "bg-muted text-foreground rotate-0"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        {open ? <X size={22} /> : <Zap size={22} />}
      </button>
    </div>
  );
}
