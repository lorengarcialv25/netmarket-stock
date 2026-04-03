import type { Product } from "./types";

type ProductPackagingFields = Pick<
  Product,
  | "units_per_box"
  | "kg_per_box"
  | "units_per_box_blister"
  | "kg_per_box_blister"
  | "units_per_box_60cm"
  | "kg_per_box_60cm"
>;

export interface PackagingOptionInfo {
  key: "blister" | "60cm";
  label: string;
  unitsLabel: string | null;
  weightLabel: string | null;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function toUnitsLabel(value: string | number | null | undefined): string | null {
  if (value == null || value === "") return null;
  return `${value} uds`;
}

function toWeightLabel(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(Number(value))) return null;
  return `${formatNumber(Number(value))} kg`;
}

export function getPackagingOptions(product: ProductPackagingFields): PackagingOptionInfo[] {
  const options: PackagingOptionInfo[] = [];

  if (product.units_per_box_blister || product.kg_per_box_blister != null || product.units_per_box || product.kg_per_box != null) {
    options.push({
      key: "blister",
      label: "Caja blister",
      unitsLabel: toUnitsLabel(product.units_per_box_blister ?? product.units_per_box),
      weightLabel: toWeightLabel(product.kg_per_box_blister ?? product.kg_per_box),
    });
  }

  if (product.units_per_box_60cm || product.kg_per_box_60cm != null) {
    options.push({
      key: "60cm",
      label: "Caja 60cm",
      unitsLabel: toUnitsLabel(product.units_per_box_60cm),
      weightLabel: toWeightLabel(product.kg_per_box_60cm),
    });
  }

  return options;
}
