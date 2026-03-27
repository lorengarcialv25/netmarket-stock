"use client";

import { FilterBar } from "@/components/shared/FilterBar";
import { FormSelect } from "@/components/ui/FormInput";

interface Warehouse {
  id: string;
  name: string;
}

interface MovementFiltersProps {
  filterType: string;
  setFilterType: (value: string) => void;
  filterWarehouse: string;
  setFilterWarehouse: (value: string) => void;
  warehouses: Warehouse[];
  search: string;
  onSearchChange: (value: string) => void;
}

export function MovementFilters({
  filterType,
  setFilterType,
  filterWarehouse,
  setFilterWarehouse,
  warehouses,
  search,
  onSearchChange,
}: MovementFiltersProps) {
  return (
    <FilterBar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Buscar por producto o SKU..."
    >
      <div className="flex-[0_1_200px]">
        <FormSelect
          label="Tipo"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          placeholder="Todos los tipos"
          options={[
            { value: "", label: "Todos los tipos" },
            { value: "entry", label: "Entrada" },
            { value: "exit", label: "Salida" },
            { value: "transfer", label: "Transferencia" },
          ]}
        />
      </div>
      <div className="flex-[0_1_220px]">
        <FormSelect
          label="Almacén"
          value={filterWarehouse}
          onChange={(e) => setFilterWarehouse(e.target.value)}
          placeholder="Todos los almacenes"
          options={[
            { value: "", label: "Todos los almacenes" },
            ...warehouses.map((w) => ({ value: w.id, label: w.name })),
          ]}
        />
      </div>
    </FilterBar>
  );
}
