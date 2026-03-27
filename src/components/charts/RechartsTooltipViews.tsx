"use client";

import type { TooltipProps } from "recharts";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ChartDayPoint } from "@/lib/dashboardUtils";

const shell = cn(
  "overflow-hidden rounded-xl border border-border/90 text-popover-foreground",
  "bg-popover/95 shadow-xl shadow-black/12 backdrop-blur-md dark:bg-popover/95 dark:shadow-black/50",
  "ring-1 ring-black/[0.06] dark:ring-white/[0.08]"
);

const headerBar = cn(
  "border-b border-border/70",
  "bg-gradient-to-b from-primary/[0.08] to-muted/30 dark:from-primary/15 dark:to-muted/20",
  "px-3.5 py-2.5"
);

/** Tooltip de entradas/salidas (barras / líneas en métricas). */
export function MovementsSeriesTooltipContent({
  active,
  payload,
}: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as (ChartDayPoint & { name?: string }) | undefined;
  if (!row?.date) return null;

  const title =
    row.dateEnd && row.dateEnd !== row.date
      ? `${row.date} → ${row.dateEnd}`
      : row.date;

  return (
    <div className={cn(shell, "min-w-[220px] max-w-[300px]")}>
      <div className={headerBar}>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Periodo
        </p>
        <p className="mt-0.5 text-sm font-semibold leading-snug text-foreground">
          {title}
        </p>
      </div>
      <ul className="flex flex-col gap-2.5 px-3.5 py-3">
        {payload.map((p) => (
          <li
            key={String(p.dataKey)}
            className="flex items-center justify-between gap-6 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2.5 text-muted-foreground">
              <span
                className="size-2.5 shrink-0 rounded-full shadow-sm ring-2 ring-background"
                style={{ backgroundColor: p.color }}
              />
              <span className="truncate font-medium">{p.name}</span>
            </span>
            <span className="shrink-0 text-base font-semibold tabular-nums tracking-tight text-foreground">
              {formatNumber(Number(p.value) || 0)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type PiePayloadEntry = {
  name?: string;
  value?: number | string;
  payload?: { name?: string; value?: number };
};

/** Tooltip del gráfico de dona (valor por categoría). */
export function PieCategoryTooltipContent({
  active,
  payload,
}: {
  active?: boolean;
  payload?: readonly PiePayloadEntry[];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const name = String(p.name ?? "");
  const value = Number(p.value ?? 0);

  return (
    <div className={cn(shell, "min-w-[180px] max-w-[260px]")}>
      <div className={headerBar}>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Categoría
        </p>
        <p className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {name}
        </p>
      </div>
      <div className="px-3.5 py-3">
        <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
          {formatCurrency(value)}
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
          Valor inventario (precio de compra)
        </p>
      </div>
    </div>
  );
}

/** Tooltip del histórico de stock en ficha de producto. */
export function StockHistoryTooltipContent({
  active,
  payload,
  label,
  unitOfMeasure,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ value?: unknown }>;
  label?: string | number;
  unitOfMeasure: string;
}) {
  if (!active || !payload?.length) return null;
  const raw = payload[0].value;
  const v = Number(
    Array.isArray(raw) ? raw[0] : raw ?? 0
  );

  const dateLabel =
    label != null && label !== ""
      ? new Date(String(label)).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  return (
    <div className={cn(shell, "min-w-[200px]")}>
      <div className={headerBar}>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Fecha
        </p>
        <p className="mt-0.5 text-sm font-semibold capitalize text-foreground">
          {dateLabel}
        </p>
      </div>
      <div className="flex items-end justify-between gap-6 px-3.5 py-3">
        <span className="text-sm font-medium text-muted-foreground">Stock</span>
        <span className="text-xl font-bold tabular-nums text-foreground">
          {formatNumber(v)}
          <span className="ml-1.5 text-xs font-medium text-muted-foreground">
            {unitOfMeasure}
          </span>
        </span>
      </div>
    </div>
  );
}
