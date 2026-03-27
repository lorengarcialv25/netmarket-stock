"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

interface LowStockItem {
  product_name: string;
  sku: string;
  min_stock: number;
  warehouse_name: string;
  quantity: number;
}

interface LowStockAlertProps {
  items: LowStockItem[];
}

export function LowStockAlert({ items }: LowStockAlertProps) {
  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-destructive" />
            Alertas de Stock Bajo
            {items.length > 0 && (
              <Badge variant="destructive">
                {items.length}
              </Badge>
            )}
          </CardTitle>
          <Link href="/stock?low=true" className="text-xs text-primary hover:underline flex items-center gap-1">
            Ver stock bajo <ArrowRight size={12} />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[400px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle className="size-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">
                Todo el stock esta en orden
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                No hay alertas de stock bajo
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {items.map((item, index) => (
                <div key={index} className="px-4 py-3 hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm text-foreground">
                      {item.product_name}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.quantity === 0
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}>
                      {item.quantity} uds
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="font-mono">{item.sku}</span>
                    <span>{item.warehouse_name}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Min. requerido:{" "}
                    <span className="font-semibold text-destructive">
                      {item.min_stock}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
