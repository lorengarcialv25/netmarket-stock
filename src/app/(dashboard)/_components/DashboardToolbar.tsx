"use client";

import { FormSelect } from "@/components/ui/FormInput";
import type { ChartRangePreset } from "@/lib/metricsDateRange";
import { cn } from "@/lib/utils";
import { SlidersHorizontal } from "lucide-react";

interface DashboardToolbarProps {
  rangePreset: ChartRangePreset;
  onRangePresetChange: (preset: ChartRangePreset) => void;
  customDateFrom: string;
  customDateTo: string;
  onCustomDatesChange: (from: string, to: string) => void;
  disabled?: boolean;
}

const PRESET_OPTIONS: { value: ChartRangePreset; label: string }[] = [
  { value: "7d", label: "Últimos 7 días" },
  { value: "30d", label: "Últimos 30 días" },
  { value: "3m", label: "Últimos 3 meses" },
  { value: "6m", label: "Últimos 6 meses" },
  { value: "9m", label: "Últimos 9 meses" },
  { value: "12m", label: "Últimos 12 meses" },
  { value: "custom", label: "Personalizado" },
];

const compactLabel = "text-[10px] font-semibold uppercase tracking-wide text-muted-foreground";
const compactField = "space-y-1 min-w-0";
const compactTrigger = "h-8 text-xs shadow-none bg-background/80";

const dateInputClass = cn(
  "flex h-8 w-full min-w-[9.5rem] rounded-md border border-input bg-background/80 px-2 text-xs shadow-sm",
  "transition-[color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-ring",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

export function DashboardToolbar({
  rangePreset,
  onRangePresetChange,
  customDateFrom,
  customDateTo,
  onCustomDatesChange,
  disabled,
}: DashboardToolbarProps) {
  const todayYmd = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  })();

  return (
    <div
      className="rounded-lg border border-border/90 bg-gradient-to-b from-card to-card/95 px-3 py-2.5 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.06]"
      role="region"
      aria-label="Filtros de métricas"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap sm:gap-x-3 sm:gap-y-2">
          <div className="flex items-center gap-2 border-b border-border/60 pb-2 sm:border-0 sm:pb-0 sm:min-w-[5.5rem]">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground">
              <SlidersHorizontal className="size-3.5" aria-hidden="true" />
            </div>
            <div>
              <p className={cn(compactLabel, "leading-none")}>Filtros</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground/90 leading-tight hidden sm:block">
                Métricas y gráfica
              </p>
            </div>
          </div>

          <div
            className="hidden sm:block w-px h-8 self-center bg-border/80 shrink-0"
            aria-hidden="true"
          />

          <FormSelect
            className={cn(compactField, "flex-1 sm:min-w-[200px] sm:max-w-[280px]")}
            labelClassName={compactLabel}
            triggerClassName={compactTrigger}
            label="Periodo"
            value={rangePreset}
            disabled={disabled}
            onChange={(e) => onRangePresetChange(e.target.value as ChartRangePreset)}
            options={PRESET_OPTIONS}
          />

          {rangePreset === "custom" && (
            <>
              <div
                className="hidden md:block w-px h-8 self-center bg-border/80 shrink-0"
                aria-hidden="true"
              />
              <div className="flex flex-wrap items-end gap-2 sm:gap-3">
                <div className={cn(compactField, "w-[148px]")}>
                  <label className={compactLabel} htmlFor="metric-date-from">
                    Desde
                  </label>
                  <input
                    id="metric-date-from"
                    type="date"
                    value={customDateFrom}
                    max={todayYmd}
                    disabled={disabled}
                    onChange={(e) =>
                      onCustomDatesChange(e.target.value, customDateTo)
                    }
                    className={dateInputClass}
                  />
                </div>
                <div className={cn(compactField, "w-[148px]")}>
                  <label className={compactLabel} htmlFor="metric-date-to">
                    Hasta
                  </label>
                  <input
                    id="metric-date-to"
                    type="date"
                    value={customDateTo}
                    max={todayYmd}
                    min={customDateFrom || undefined}
                    disabled={disabled}
                    onChange={(e) =>
                      onCustomDatesChange(customDateFrom, e.target.value)
                    }
                    className={dateInputClass}
                  />
                </div>
              </div>
            </>
          )}
      </div>
    </div>
  );
}
