"use client";

import { useState, useRef, useEffect } from "react";
import { Warehouse, ChevronDown, Check } from "lucide-react";
import { useWarehouse } from "@/hooks/useWarehouse";
import { cn } from "@/lib/utils";

export function WarehouseSelector() {
  const { selected, warehouses, canAccessAll, setSelected, loading } =
    useWarehouse();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading || warehouses.length === 0) return null;

  const label =
    selected === "all"
      ? "Todos los almacenes"
      : selected?.name ?? "Seleccionar";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors cursor-pointer border",
          open
            ? "bg-muted border-border"
            : "hover:bg-muted border-transparent hover:border-border"
        )}
      >
        <Warehouse size={15} className="text-muted-foreground shrink-0" />
        <span className="font-medium text-foreground max-w-[160px] truncate hidden sm:block">
          {label}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            "text-muted-foreground transition-transform duration-150 hidden sm:block",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-64 bg-popover rounded-lg shadow-lg border border-border py-1 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Almacen activo
            </p>
          </div>

          <div className="py-1 max-h-64 overflow-y-auto">
            {canAccessAll && (
              <button
                onClick={() => {
                  setSelected("all");
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors cursor-pointer",
                  selected === "all"
                    ? "bg-primary/5 text-primary font-medium"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <Warehouse size={14} className="shrink-0" />
                <span className="flex-1 text-left">Todos los almacenes</span>
                {selected === "all" && <Check size={14} />}
              </button>
            )}

            {canAccessAll && warehouses.length > 0 && (
              <div className="h-px bg-border mx-2 my-1" />
            )}

            {warehouses.map((w) => {
              const isActive =
                selected !== "all" && selected?.id === w.id;
              return (
                <button
                  key={w.id}
                  onClick={() => {
                    setSelected(w);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors cursor-pointer",
                    isActive
                      ? "bg-primary/5 text-primary font-medium"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <div
                    className={cn(
                      "size-2 rounded-full shrink-0",
                      isActive ? "bg-primary" : "bg-muted-foreground/30"
                    )}
                  />
                  <span className="flex-1 text-left truncate">{w.name}</span>
                  {isActive && <Check size={14} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
