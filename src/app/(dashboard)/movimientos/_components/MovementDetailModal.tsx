"use client";

import { useEffect, useMemo, useState } from "react";
import { sileo } from "sileo";
import { dypai } from "@/lib/dypai";
import type { StockMovement } from "@/lib/types";
import {
  formatCurrency,
  formatDateOnly,
  formatDateTime,
  formatNumber,
  movementReasonLabel,
  movementTypeLabel,
} from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MovementDetailModalProps {
  open: boolean;
  movement: StockMovement | null;
  canEdit: boolean;
  canDelete: boolean;
  deleting?: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  );
}

export function MovementDetailModal({
  open,
  movement,
  canEdit,
  canDelete,
  deleting = false,
  onClose,
  onEdit,
  onDelete,
}: MovementDetailModalProps) {
  const [detail, setDetail] = useState<StockMovement | null>(movement);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !movement?.id) return;

    let cancelled = false;
    const movementId = movement.id;

    async function loadDetail() {
      setLoading(true);
      const { data, error } = await dypai.api.get("get_stock_movement_detail", {
        params: { movement_id: movementId },
      });

      if (cancelled) return;

      if (error || !data || !Array.isArray(data) || data.length === 0) {
        setDetail(movement);
        sileo.error({ title: "No se pudo cargar el detalle del movimiento" });
      } else {
        setDetail(data[0] as StockMovement);
      }

      setLoading(false);
    }

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [open, movement]);

  useEffect(() => {
    if (!open) {
      setDetail(movement);
    }
  }, [open, movement]);

  const current = detail ?? movement;

  const lotItems = useMemo(
    () => current?.lot_allocation_items ?? [],
    [current]
  );

  if (!current) return null;

  return (
    <Modal open={open} onClose={onClose} title="Detalle del movimiento" size="xl">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary" className="border-0">
            {movementTypeLabel(current.movement_type)}
          </Badge>
          <span className="text-sm font-medium text-foreground">
            {current.product_name ?? "-"} ({current.product_sku ?? "-"})
          </span>
          <span className="text-sm text-muted-foreground">
            {formatDateTime(current.created_at)}
          </span>
        </div>

        {loading && (
          <div className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
            Cargando detalle...
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <DetailItem label="Cantidad" value={formatNumber(current.quantity)} />
          <DetailItem
            label="Motivo"
            value={current.reason ? movementReasonLabel(current.reason) : "-"}
          />
          <DetailItem label="Almacén origen" value={current.warehouse_name ?? "-"} />
          <DetailItem
            label="Almacén destino"
            value={current.destination_warehouse_name ?? "-"}
          />
          <DetailItem
            label="Lote"
            value={current.lot_allocations || current.lot_number || "-"}
          />
          <DetailItem
            label="Caducidad"
            value={
              current.expiry_date ? formatDateOnly(current.expiry_date) : "-"
            }
          />
          <DetailItem
            label="Coste unitario"
            value={
              current.unit_cost != null ? formatCurrency(Number(current.unit_cost)) : "-"
            }
          />
          <DetailItem
            label="Coste total"
            value={
              current.total_cost != null ? formatCurrency(Number(current.total_cost)) : "-"
            }
          />
          <DetailItem
            label="Responsable"
            value={current.user_email ?? "-"}
          />
          <DetailItem
            label="Origen"
            value={current.delivery_note_id ? "Albarán confirmado" : "Movimiento manual"}
          />
        </div>

        <div className="rounded-xl border border-border">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">
              Desglose de lotes
            </h3>
            <p className="text-xs text-muted-foreground">
              Para salidas y transferencias se muestra la asignación FIFO consumida.
            </p>
          </div>
          {lotItems.length === 0 ? (
            <div className="px-4 py-4 text-sm text-muted-foreground">
              {current.lot_number
                ? `Lote principal: ${current.lot_number}`
                : "No hay desglose adicional de lotes para este movimiento."}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {lotItems.map((item, index) => (
                <div
                  key={`${item.lot_number}-${index}`}
                  className="grid gap-2 px-4 py-3 text-sm md:grid-cols-3"
                >
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Lote
                    </p>
                    <p className="font-medium text-foreground">{item.lot_number}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Cantidad
                    </p>
                    <p className="text-foreground">{formatNumber(item.quantity)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Coste aplicado
                    </p>
                    <p className="text-foreground">
                      {item.unit_cost != null
                        ? formatCurrency(Number(item.unit_cost))
                        : "-"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Notas
          </p>
          <p className="mt-2 text-sm text-foreground whitespace-pre-wrap">
            {current.notes?.trim() || "Sin observaciones."}
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
          {canEdit && (
            <Button variant="outline" onClick={onEdit}>
              Editar entrada
            </Button>
          )}
          {canDelete && (
            <Button variant="destructive" onClick={onDelete} disabled={deleting}>
              {deleting ? "Eliminando..." : "Eliminar movimiento"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
