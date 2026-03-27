"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { dypai } from "@/lib/dypai";
import { useAuth } from "@/hooks/useAuth";
import type { Warehouse } from "@/lib/types";

interface WarehouseContextType {
  /** Currently selected warehouse, or "all" for admin aggregate view */
  selected: Warehouse | "all" | null;
  /** Warehouses the current user can access */
  warehouses: Warehouse[];
  /** Whether the user can see all warehouses (admin) */
  canAccessAll: boolean;
  /** Loading state */
  loading: boolean;
  /** Change selected warehouse */
  setSelected: (warehouseOrAll: Warehouse | "all") => void;
  /** Re-fetch warehouses from API */
  refresh: () => Promise<void>;
}

const WarehouseContext = createContext<WarehouseContextType | null>(null);

const STORAGE_KEY = "stock-infomarket-selected-warehouse";

export function WarehouseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selected, setSelectedState] = useState<Warehouse | "all" | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin";

  const fetchWarehouses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await dypai.api.get("get_user_warehouses");
    if (!error && data) {
      const list = data as Warehouse[];
      setWarehouses(list);

      // Restore previous selection from localStorage
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "all" && isAdmin) {
        setSelectedState("all");
      } else if (saved) {
        const found = list.find((w) => w.id === saved);
        if (found) {
          setSelectedState(found);
        } else if (list.length > 0) {
          setSelectedState(list[0]);
        }
      } else if (list.length > 0) {
        setSelectedState(list[0]);
      }
    }
    setLoading(false);
  }, [user, isAdmin]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  const setSelected = useCallback(
    (warehouseOrAll: Warehouse | "all") => {
      setSelectedState(warehouseOrAll);
      localStorage.setItem(
        STORAGE_KEY,
        warehouseOrAll === "all" ? "all" : warehouseOrAll.id
      );
    },
    []
  );

  return (
    <WarehouseContext.Provider
      value={{
        selected,
        warehouses,
        canAccessAll: isAdmin,
        loading,
        setSelected,
        refresh: fetchWarehouses,
      }}
    >
      {children}
    </WarehouseContext.Provider>
  );
}

export function useWarehouse() {
  const ctx = useContext(WarehouseContext);
  if (!ctx) throw new Error("useWarehouse must be used within WarehouseProvider");
  return ctx;
}

/** Helper: returns the warehouse_id to filter by, or null if "all" */
export function useWarehouseId(): string | null {
  const { selected } = useWarehouse();
  return selected === "all" || selected === null ? null : selected.id;
}
