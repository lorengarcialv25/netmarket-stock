"use client";

import { FormInput, FormSelect } from "@/components/ui/FormInput";
import { Search } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface ProductFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filterType: string;
  setFilterType: (value: string) => void;
  filterCategory: string;
  setFilterCategory: (value: string) => void;
  categories: Category[];
}

export function ProductFilters({
  search,
  onSearchChange,
  filterType,
  setFilterType,
  filterCategory,
  setFilterCategory,
  categories,
}: ProductFiltersProps) {
  return (
    <div className="flex gap-4 flex-wrap items-end">
      <div className="flex-[1_1_280px] max-w-[400px]">
        <FormInput
          label="Buscar"
          placeholder="Buscar por nombre o SKU..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          icon={<Search size={16} />}
        />
      </div>
      <div className="flex-[0_1_180px]">
        <FormSelect
          label="Tipo"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          placeholder="Todos los tipos"
          options={[
            { value: "", label: "Todos los tipos" },
            { value: "final", label: "Producto Final" },
            { value: "raw_material", label: "Materia Prima" },
          ]}
        />
      </div>
      <div className="flex-[0_1_180px]">
        <FormSelect
          label="Categoría"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          placeholder="Todas las categorías"
          options={[
            { value: "", label: "Todas las categorías" },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
      </div>
    </div>
  );
}
