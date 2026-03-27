"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PieCategoryTooltipContent } from "@/components/charts/RechartsTooltipViews";
import { rechartsTooltipWrapperStyle } from "@/lib/rechartsTooltip";
import type { BreakdownRow } from "./MetricsBreakdownTable";
import { PieChart as PieChartIcon } from "lucide-react";

const COLORS = [
  "hsl(142 76% 36%)",
  "hsl(221 83% 53%)",
  "hsl(280 65% 50%)",
  "hsl(32 95% 44%)",
  "hsl(340 75% 55%)",
  "hsl(190 80% 40%)",
  "hsl(48 96% 40%)",
  "hsl(215 25% 45%)",
];

function rowsToPieData(rows: BreakdownRow[]): { name: string; value: number }[] {
  const positive = rows
    .filter((r) => r.stock_value > 0)
    .sort((a, b) => b.stock_value - a.stock_value);
  if (positive.length === 0) return [];
  if (positive.length <= 8) {
    return positive.map((r) => ({
      name: r.name || "Sin nombre",
      value: r.stock_value,
    }));
  }
  const top = positive.slice(0, 7);
  const rest = positive.slice(7).reduce((s, r) => s + r.stock_value, 0);
  return [
    ...top.map((r) => ({
      name: r.name || "Sin nombre",
      value: r.stock_value,
    })),
    { name: "Otros", value: rest },
  ];
}

interface MetricsCategoryPieChartProps {
  rows: BreakdownRow[];
  loading?: boolean;
}

export function MetricsCategoryPieChart({
  rows,
  loading,
}: MetricsCategoryPieChartProps) {
  const chartData = rowsToPieData(rows);
  const hasData = chartData.length > 0;

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <PieChartIcon className="size-4 text-primary" />
          Valor de inventario por categoría
        </CardTitle>
        <p className="text-xs text-muted-foreground font-normal">
          Distribución del valor a precio de compra (mismo criterio que la tabla).
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
            Cargando…
          </div>
        ) : !hasData ? (
          <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground text-center px-4">
            No hay valor de inventario por categoría con el filtro actual.
          </div>
        ) : (
          <div className="w-full h-[320px] min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={100}
                  paddingAngle={2}
                  label={false}
                >
                  {chartData.map((_, i) => (
                    <Cell
                      key={`cell-${i}`}
                      fill={COLORS[i % COLORS.length]}
                      stroke="hsl(var(--background))"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={PieCategoryTooltipContent}
                  wrapperStyle={rechartsTooltipWrapperStyle}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
