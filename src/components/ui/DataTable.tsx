"use client";

import { useEffect, useMemo, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  /** Client-side pagination page size (ignored if serverPagination is provided) */
  pageSize?: number;
  pageSizeOptions?: number[];
  /** Server-side pagination config */
  serverPagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
  };
}

function PaginationBar({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  pageSizeOptions: number[];
  onPageSizeChange?: (pageSize: number) => void;
  onPageChange: (page: number) => void;
}) {
  const start = totalItems === 0 ? 0 : currentPage * pageSize + 1;
  const end = Math.min((currentPage + 1) * pageSize, totalItems);

  // Show max 5 page buttons with ellipsis logic
  const getPageButtons = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i);
    const pages: (number | "...")[] = [0];
    const left = Math.max(1, currentPage - 1);
    const right = Math.min(totalPages - 2, currentPage + 1);
    if (left > 1) pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 2) pages.push("...");
    pages.push(totalPages - 1);
    return pages;
  };

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3">
      <div className="flex items-center gap-3">
        {onPageSizeChange && pageSizeOptions.length > 0 && (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Filas por pagina
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        )}
        <span className="text-sm text-muted-foreground">
          {start}-{end} de {totalItems}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
        >
          <ChevronLeft size={16} />
        </Button>
        {getPageButtons().map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground">...</span>
          ) : (
            <Button
              key={p}
              variant={p === currentPage ? "default" : "ghost"}
              size="sm"
              className="min-w-[32px]"
              onClick={() => onPageChange(p)}
            >
              {p + 1}
            </Button>
          )
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTable<T = any>({
  columns,
  data,
  loading = false,
  emptyMessage = "No hay datos disponibles",
  pageSize = 50,
  pageSizeOptions = [15, 25, 50, 100],
  serverPagination,
}: DataTableProps<T>) {
  // Client-side pagination state
  const [clientPage, setClientPage] = useState(0);
  const [clientPageSize, setClientPageSize] = useState(pageSize);

  const isServerMode = !!serverPagination;

  useEffect(() => {
    setClientPageSize(pageSize);
  }, [pageSize]);

  useEffect(() => {
    if (isServerMode) return;
    const totalClientPages = Math.max(1, Math.ceil(data.length / clientPageSize));
    if (clientPage > totalClientPages - 1) {
      setClientPage(0);
    }
  }, [clientPage, clientPageSize, data.length, isServerMode]);

  const displayData = useMemo(() => {
    if (isServerMode) return data;
    const start = clientPage * clientPageSize;
    return data.slice(start, start + clientPageSize);
  }, [data, clientPage, clientPageSize, isServerMode]);

  const totalItems = isServerMode ? serverPagination.totalItems : data.length;
  const currentPageSize = isServerMode ? serverPagination.pageSize : clientPageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / currentPageSize));
  const currentPage = isServerMode ? serverPagination.page - 1 : clientPage;
  const showPagination = totalItems > currentPageSize;
  const handlePageSizeChange = isServerMode
    ? serverPagination.onPageSizeChange
    : (nextPageSize: number) => {
        setClientPageSize(nextPageSize);
        setClientPage(0);
      };

  if (loading) {
    return (
      <div className="py-12">
        <Spinner size="md" label="Cargando..." />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card ring-1 ring-foreground/5 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent bg-muted/50">
            {columns.map((col) => (
              <TableHead key={col.key} className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-12 text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            displayData.map((row, idx) => (
              <TableRow key={(row as Record<string, unknown>)?.id as string ?? idx}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "-")}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {showPagination && (
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={currentPageSize}
          pageSizeOptions={pageSizeOptions}
          onPageSizeChange={handlePageSizeChange}
          onPageChange={(p) => {
            if (isServerMode) {
              serverPagination.onPageChange(p + 1);
            } else {
              setClientPage(p);
            }
          }}
        />
      )}
    </div>
  );
}
