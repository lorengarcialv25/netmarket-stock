"use client";

import { FormInput } from "@/components/ui/FormInput";
import { Search } from "lucide-react";

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
}

export function FilterBar({ search, onSearchChange, searchPlaceholder = "Buscar...", children }: FilterBarProps) {
  return (
    <div className="flex gap-4 flex-wrap items-end">
      <div className="flex-[1_1_280px] max-w-[400px]">
        <FormInput
          label="Buscar"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          icon={<Search size={16} />}
        />
      </div>
      {children}
    </div>
  );
}
