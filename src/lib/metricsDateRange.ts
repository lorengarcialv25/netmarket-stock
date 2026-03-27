import type { MergeSeriesInput } from "./dashboardUtils";

/** yyyy-mm-dd en hora local. */
export function formatYmdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Ventana móvil: desde hace `months` meses (mismo día del mes) hasta hoy (inclusive).
 */
export function rollingMonthsRange(months: number): { from: string; to: string } {
  const end = new Date();
  end.setHours(12, 0, 0, 0);
  const start = new Date(end);
  start.setMonth(start.getMonth() - months);
  start.setHours(0, 0, 0, 0);
  return { from: formatYmdLocal(start), to: formatYmdLocal(end) };
}

/** Ventana móvil de N días hasta hoy (inclusive). */
export function rollingDaysRange(dayCount: number): { from: string; to: string } {
  const end = new Date();
  end.setHours(12, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - (dayCount - 1));
  start.setHours(0, 0, 0, 0);
  return { from: formatYmdLocal(start), to: formatYmdLocal(end) };
}

export function parseYmdLocal(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d, 12, 0, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export type ChartRangePreset =
  | "7d"
  | "30d"
  | "3m"
  | "6m"
  | "9m"
  | "12m"
  | "custom";

const MONTH_PRESETS: Record<"3m" | "6m" | "9m" | "12m", number> = {
  "3m": 3,
  "6m": 6,
  "9m": 9,
  "12m": 12,
};

export function resolveMovementsSeries(
  preset: ChartRangePreset,
  customFrom: string,
  customTo: string
): {
  apiParams: Record<string, string | number>;
  merge: MergeSeriesInput;
} {
  if (preset === "custom") {
    if (customFrom.trim() && customTo.trim()) {
      return {
        apiParams: { date_from: customFrom.trim(), date_to: customTo.trim() },
        merge: {
          mode: "range",
          dateFrom: customFrom.trim(),
          dateTo: customTo.trim(),
        },
      };
    }
    return { apiParams: { days: 30 }, merge: { mode: "days", days: 30 } };
  }
  if (preset === "7d") {
    return { apiParams: { days: 7 }, merge: { mode: "days", days: 7 } };
  }
  if (preset === "30d") {
    return { apiParams: { days: 30 }, merge: { mode: "days", days: 30 } };
  }
  const months = MONTH_PRESETS[preset];
  const { from, to } = rollingMonthsRange(months);
  return {
    apiParams: { date_from: from, date_to: to },
    merge: { mode: "range", dateFrom: from, dateTo: to },
  };
}

export function describeChartRange(
  preset: ChartRangePreset,
  customFrom: string,
  customTo: string
): string {
  if (preset === "custom" && customFrom.trim() && customTo.trim()) {
    return `${customFrom.trim()} → ${customTo.trim()}`;
  }
  if (preset === "custom") {
    return "Últimos 30 días (indica desde/hasta para acotar)";
  }
  if (preset === "7d") return "Últimos 7 días";
  if (preset === "30d") return "Últimos 30 días";
  if (preset === "3m" || preset === "6m" || preset === "9m" || preset === "12m") {
    const { from, to } = rollingMonthsRange(MONTH_PRESETS[preset]);
    return `${from} → ${to}`;
  }
  return "";
}
