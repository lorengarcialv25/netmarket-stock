type ProductBaseUnit = "unidades" | "kg" | "litros" | "metros" | "cajas";

export type BomQuantityUnit =
  | "unidades"
  | "cajas"
  | "kg"
  | "g"
  | "litros"
  | "ml"
  | "metros"
  | "cm"
  | "mm";

export interface UnitOption {
  value: BomQuantityUnit;
  label: string;
}

const UNIT_OPTIONS: Record<ProductBaseUnit, UnitOption[]> = {
  unidades: [{ value: "unidades", label: "Unidades" }],
  cajas: [{ value: "cajas", label: "Cajas" }],
  kg: [
    { value: "kg", label: "Kg" },
    { value: "g", label: "Gramos" },
  ],
  litros: [
    { value: "litros", label: "Litros" },
    { value: "ml", label: "Mililitros" },
  ],
  metros: [
    { value: "metros", label: "Metros" },
    { value: "cm", label: "Centímetros" },
    { value: "mm", label: "Milímetros" },
  ],
};

export function getBomUnitOptions(baseUnit: string | null | undefined): UnitOption[] {
  return UNIT_OPTIONS[(baseUnit || "unidades") as ProductBaseUnit] ?? [{ value: "unidades", label: "Unidades" }];
}

export function getDefaultBomUnit(baseUnit: string | null | undefined): BomQuantityUnit {
  return getBomUnitOptions(baseUnit)[0].value;
}
