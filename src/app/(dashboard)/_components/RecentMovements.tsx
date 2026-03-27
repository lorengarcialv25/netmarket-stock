"use client";

import { formatDateTime, movementTypeLabel } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDownUp, ArrowRight } from "lucide-react";
import Link from "next/link";

interface RecentMovement {
  id?: string;
  product_name: string;
  product_sku: string;
  warehouse_name: string;
  movement_type: string;
  quantity: number;
  created_at: string;
}

interface RecentMovementsProps {
  movements: RecentMovement[];
}

function MovementBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    entry: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    exit: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    transfer: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    adjustment: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[type] ?? "bg-muted text-muted-foreground"}`}>
      {movementTypeLabel(type)}
    </span>
  );
}

export function RecentMovements({ movements }: RecentMovementsProps) {
  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ArrowDownUp className="size-4 text-primary" />
            Movimientos Recientes
          </CardTitle>
          <Link href="/movimientos" className="text-xs text-primary hover:underline flex items-center gap-1">
            Ver todos <ArrowRight size={12} />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {movements.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No hay movimientos recientes
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Producto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Almacen</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement, index) => (
                <TableRow
                  key={
                    movement.id ??
                    `${movement.created_at}-${movement.product_sku}-${index}`
                  }
                >
                  <TableCell className="font-medium text-foreground">
                    {movement.product_name}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {movement.product_sku}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {movement.warehouse_name}
                  </TableCell>
                  <TableCell>
                    <MovementBadge type={movement.movement_type} />
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {movement.quantity}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(movement.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
