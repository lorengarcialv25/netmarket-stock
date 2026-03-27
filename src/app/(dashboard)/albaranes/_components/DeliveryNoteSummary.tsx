"use client";

import { CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface Props {
  linesCount: number;
  totalQty: number;
  totalValue: number;
  confirmedAt: string | null;
}

export function DeliveryNoteSummary({ linesCount, totalQty, totalValue, confirmedAt }: Props) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 border-b bg-muted/30">
        <CardTitle className="text-base flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-primary" />
          Resumen
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        <div className="flex justify-between items-center py-1.5 border-b border-dashed">
          <span className="text-sm text-muted-foreground">Lineas</span>
          <span className="font-semibold">{linesCount}</span>
        </div>
        <div className="flex justify-between items-center py-1.5 border-b border-dashed">
          <span className="text-sm text-muted-foreground">Unidades totales</span>
          <span className="font-semibold">{totalQty.toLocaleString()}</span>
        </div>
        <div className="pt-2 text-right">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Valor Total</p>
          <p className="text-3xl font-bold text-primary">{formatCurrency(totalValue)}</p>
        </div>
        {confirmedAt && (
          <div className="pt-3 mt-2 border-t border-dashed">
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-3.5 w-3.5" />
              Confirmado el {formatDateTime(confirmedAt)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
