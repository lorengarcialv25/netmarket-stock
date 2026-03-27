"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface BreakdownRow {
  name: string;
  product_count: number;
  stock_value: number;
  share_pct: number;
}

interface MetricsBreakdownTableProps {
  title: string;
  description?: string;
  rows: BreakdownRow[];
  loading?: boolean;
  emptyMessage?: string;
  /** Column header for the first column (e.g. Categoría, Proveedor) */
  nameColumnLabel: string;
  /** Si se define, pagina en cliente cuando haya más filas que este tamaño. */
  paginationPageSize?: number;
}

export function MetricsBreakdownTable({
  title,
  description,
  rows,
  loading,
  emptyMessage = "No hay datos para mostrar",
  nameColumnLabel,
  paginationPageSize,
}: MetricsBreakdownTableProps) {
  const [page, setPage] = useState(0);

  const pageSize = paginationPageSize ?? 0;
  const usePagination =
    pageSize > 0 && rows.length > pageSize;

  const totalPages = useMemo(
    () => (usePagination ? Math.ceil(rows.length / pageSize) : 1),
    [rows.length, pageSize, usePagination]
  );

  const visibleRows = useMemo(() => {
    if (!usePagination) return rows;
    const start = page * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize, usePagination]);

  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(0, totalPages - 1)));
  }, [rows.length, totalPages]);

  const rangeLabel = usePagination
    ? `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, rows.length)} de ${rows.length}`
    : null;

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && (
          <CardDescription className="text-xs">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Cargando…
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <>
            <div
              className={cn(!usePagination && "max-h-[360px] overflow-y-auto")}
            >
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">{nameColumnLabel}</TableHead>
                    <TableHead className="text-right">Productos</TableHead>
                    <TableHead className="text-right">Valor inventario</TableHead>
                    <TableHead className="text-right pr-4">% del total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleRows.map((row, i) => (
                    <TableRow key={`${row.name}-${page}-${i}`}>
                      <TableCell className="pl-4 font-medium text-foreground">
                        {row.name}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(row.product_count)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {formatCurrency(row.stock_value)}
                      </TableCell>
                      <TableCell className="text-right pr-4 text-muted-foreground tabular-nums">
                        {row.share_pct.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {usePagination && totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2.5 sm:px-4">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {rangeLabel}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 px-2"
                    disabled={page <= 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="min-w-[4.5rem] text-center text-xs tabular-nums text-muted-foreground">
                    {page + 1} / {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 px-2"
                    disabled={page >= totalPages - 1}
                    onClick={() =>
                      setPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function addSharePercent(
  rows: { name: string; product_count: number; stock_value: number }[]
): BreakdownRow[] {
  const total = rows.reduce((s, r) => s + r.stock_value, 0);
  return rows.map((r) => ({
    ...r,
    share_pct: total > 0 ? (r.stock_value / total) * 100 : 0,
  }));
}
