"use client";

import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Warehouse } from "lucide-react";

interface StockByWarehouseData {
  warehouse_name: string;
  total_items: number;
  total_value: number;
}

interface StockByWarehouseProps {
  warehouses: StockByWarehouseData[];
}

export function StockByWarehouse({ warehouses }: StockByWarehouseProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-3">
        Stock por Almacen
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {warehouses.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No hay datos de almacenes
            </CardContent>
          </Card>
        ) : (
          warehouses.map((warehouse, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Warehouse className="size-5" />
                  </div>
                  <h3 className="font-semibold text-foreground">
                    {warehouse.warehouse_name}
                  </h3>
                </div>
                <div className="flex justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                      Items
                    </div>
                    <div className="text-xl font-bold text-foreground">
                      {warehouse.total_items.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                      Valor Total
                    </div>
                    <div className="text-xl font-bold text-primary">
                      {formatCurrency(warehouse.total_value)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
