"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  bucketChartSeries,
  chooseBucketDaysForPointCount,
  type ChartDayPoint,
} from "@/lib/dashboardUtils";
import { MovementsSeriesTooltipContent } from "@/components/charts/RechartsTooltipViews";
import { rechartsTooltipWrapperStyle } from "@/lib/rechartsTooltip";
import { BarChart3, LineChart as LineChartIcon } from "lucide-react";

export type { ChartDayPoint };

export type MovementsChartKind = "bar" | "line";

interface DashboardMovementsChartProps {
  data: ChartDayPoint[];
  loading?: boolean;
  periodLabel?: string;
}

function aggregationHint(bucketDays: number): string {
  if (bucketDays <= 1) {
    return "Un punto por día.";
  }
  if (bucketDays === 7) {
    return "Agrupado por semanas (suma de 7 días consecutivos) para que se lea bien.";
  }
  if (bucketDays === 14) {
    return "Agrupado en bloques de 14 días para que se lea bien.";
  }
  return "Agrupado en bloques de ~30 días para que se lea bien.";
}

export function DashboardMovementsChart({
  data,
  loading,
  periodLabel,
}: DashboardMovementsChartProps) {
  const [chartKind, setChartKind] = useState<MovementsChartKind>("bar");

  const bucketDays = useMemo(
    () => chooseBucketDaysForPointCount(data.length),
    [data.length]
  );

  const chartData = useMemo(() => {
    const bucketed = bucketChartSeries(data, bucketDays);
    return bucketed.map((d) => ({
      ...d,
      name: d.label,
    }));
  }, [data, bucketDays]);

  const hasAny = data.some((d) => d.entries > 0 || d.exits > 0);
  const denseTicks = chartData.length > 18;

  const chartBody = loading ? (
    <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
      Cargando datos de la gráfica…
    </div>
  ) : !hasAny ? (
    <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground text-center px-4">
      No hay movimientos de entrada o salida en este periodo para el filtro
      seleccionado.
    </div>
  ) : (
    <div className="w-full h-[300px] min-h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        {chartKind === "bar" ? (
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 8, left: 0, bottom: denseTicks ? 12 : 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
              angle={denseTicks ? -32 : 0}
              textAnchor={denseTicks ? "end" : "middle"}
              height={denseTicks ? 56 : 28}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              width={44}
            />
            <Tooltip
              content={MovementsSeriesTooltipContent}
              wrapperStyle={rechartsTooltipWrapperStyle}
              cursor={{
                fill: "color-mix(in oklch, var(--muted) 40%, transparent)",
              }}
            />
            <Legend />
            <Bar
              dataKey="entries"
              name="Entradas"
              fill="hsl(142 76% 36%)"
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
            <Bar
              dataKey="exits"
              name="Salidas"
              fill="hsl(0 84% 60%)"
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        ) : (
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 8, left: 0, bottom: denseTicks ? 12 : 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
              angle={denseTicks ? -32 : 0}
              textAnchor={denseTicks ? "end" : "middle"}
              height={denseTicks ? 56 : 28}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              width={44}
            />
            <Tooltip
              content={MovementsSeriesTooltipContent}
              wrapperStyle={rechartsTooltipWrapperStyle}
              cursor={{
                stroke: "color-mix(in oklch, var(--muted-foreground) 25%, transparent)",
                strokeWidth: 1,
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="entries"
              name="Entradas"
              stroke="hsl(142 76% 36%)"
              strokeWidth={2}
              dot={{ r: chartData.length > 40 ? 0 : 2 }}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="exits"
              name="Salidas"
              stroke="hsl(0 84% 60%)"
              strokeWidth={2}
              dot={{ r: chartData.length > 40 ? 0 : 2 }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );

  return (
    <Card>
      <CardHeader className="border-b pb-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-4 text-primary shrink-0" />
              Entradas vs salidas (volumen)
            </CardTitle>
            <p className="text-xs text-muted-foreground font-normal mt-1">
              Suma de cantidades por periodo. No incluye transferencias.
              {periodLabel ? (
                <span className="block mt-1 text-foreground/80">
                  Periodo: {periodLabel}
                </span>
              ) : null}
            </p>
          </div>
          <div className="flex flex-col items-stretch sm:items-end gap-1.5 shrink-0">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-right">
              Visualización
            </span>
            <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-3 text-xs rounded-md",
                  chartKind === "bar" &&
                    "bg-background shadow-sm text-foreground"
                )}
                onClick={() => setChartKind("bar")}
                disabled={loading}
              >
                <BarChart3 className="size-3.5" />
                Barras
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-3 text-xs rounded-md",
                  chartKind === "line" &&
                    "bg-background shadow-sm text-foreground"
                )}
                onClick={() => setChartKind("line")}
                disabled={loading}
              >
                <LineChartIcon className="size-3.5" />
                Líneas
              </Button>
            </div>
          </div>
        </div>
        {!loading && hasAny ? (
          <p className="text-[11px] text-muted-foreground leading-snug">
            {aggregationHint(bucketDays)}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="pt-4">{chartBody}</CardContent>
    </Card>
  );
}
