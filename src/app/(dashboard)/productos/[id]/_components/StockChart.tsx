"use client";

import { useState, useEffect, useCallback } from "react";
import { dypai } from "@/lib/dypai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";
import { formatNumber } from "@/lib/utils";
import { StockHistoryTooltipContent } from "@/components/charts/RechartsTooltipViews";
import { rechartsTooltipWrapperStyle } from "@/lib/rechartsTooltip";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type DayRange = 7 | 30 | 90 | 365;

const DAY_OPTIONS: { label: string; value: DayRange }[] = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
  { label: "1a", value: 365 },
];

interface StockChartProps {
  productId: string;
  unitOfMeasure: string;
}

export function StockChart({ productId, unitOfMeasure }: StockChartProps) {
  const [days, setDays] = useState<DayRange>(30);
  const [data, setData] = useState<{ day: string; stock: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const { data: res } = await dypai.api.get("get_product_stock_history", {
      params: { product_id: productId, days },
    });
    if (res && Array.isArray(res)) {
      setData(
        res.map((d: { day: string; stock: string }) => ({
          day: d.day,
          stock: Number(d.stock),
        }))
      );
    }
    setLoading(false);
  }, [productId, days]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle>Evolucion del Stock</CardTitle>
          <div className="flex gap-1">
            {DAY_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={days === opt.value ? "default" : "ghost"}
                size="sm"
                onClick={() => setDays(opt.value)}
                className="text-xs px-2.5 h-7"
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="sm" />
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-primary)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-primary)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border"
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => {
                  const d = new Date(v);
                  return `${d.getDate()}/${d.getMonth() + 1}`;
                }}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                allowDecimals={false}
              />
              <Tooltip
                content={(props) => (
                  <StockHistoryTooltipContent
                    {...props}
                    unitOfMeasure={unitOfMeasure}
                  />
                )}
                wrapperStyle={rechartsTooltipWrapperStyle}
                cursor={{
                  stroke: "color-mix(in oklch, var(--primary) 35%, transparent)",
                  strokeWidth: 1,
                }}
              />
              <Area
                type="monotone"
                dataKey="stock"
                stroke="var(--color-primary)"
                fill="url(#stockGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted-foreground py-12">
            Sin datos de movimientos para este periodo
          </p>
        )}
      </CardContent>
    </Card>
  );
}
