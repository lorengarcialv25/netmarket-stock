/** Filas típicas de `list_warehouse_stock`. */
export interface DashboardStockRow {
  warehouse_id: string;
  warehouse_name: string;
  product_sku: string;
  quantity: number;
  min_stock: number;
  purchase_price: number;
}

/** Movimiento para agregados del dashboard. */
export interface DashboardMovementRow {
  created_at: string;
  movement_type: string;
  quantity?: number;
  warehouse_id?: string;
}

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Clave yyyy-mm-dd en hora local. */
export function ymdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function localDateKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return ymdLocal(d);
}

/**
 * Agrega volumen (suma de cantidades) de entradas y salidas por día.
 * No incluye transferencias ni ajustes en la gráfica principal.
 */
export function aggregateEntriesExitsByDay(
  movements: DashboardMovementRow[],
  days: number
): { date: string; entries: number; exits: number; label: string }[] {
  const rangeStart = startOfLocalDay(new Date());
  rangeStart.setDate(rangeStart.getDate() - (days - 1));

  const map = new Map<string, { entries: number; exits: number }>();

  for (const m of movements) {
    const d = new Date(m.created_at);
    if (Number.isNaN(d.getTime())) continue;
    if (d < rangeStart) continue;

    const key = localDateKey(m.created_at);
    if (!key) continue;

    const qty = Math.abs(Number(m.quantity) || 0);
    if (!map.has(key)) map.set(key, { entries: 0, exits: 0 });
    const bucket = map.get(key)!;

    if (m.movement_type === "entry") bucket.entries += qty;
    else if (m.movement_type === "exit") bucket.exits += qty;
  }

  const result: { date: string; entries: number; exits: number; label: string }[] = [];
  for (let i = 0; i < days; i++) {
    const dt = new Date(rangeStart.getTime());
    dt.setDate(rangeStart.getDate() + i);
    const key = ymdLocal(dt);
    const v = map.get(key) ?? { entries: 0, exits: 0 };
    const label = new Intl.DateTimeFormat("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(dt);
    result.push({ date: key, entries: v.entries, exits: v.exits, label });
  }
  return result;
}

export function computeStockMetrics(rows: DashboardStockRow[]) {
  const totalValue = rows.reduce(
    (s, r) => s + Number(r.quantity) * Number(r.purchase_price ?? 0),
    0
  );
  const lowStockCount = rows.filter(
    (r) => Number(r.quantity) <= Number(r.min_stock ?? 0)
  ).length;
  const distinctSkus = new Set(rows.map((r) => r.product_sku)).size;
  const totalItems = rows.length;
  return {
    totalValue,
    lowStockCount,
    distinctSkus,
    totalItems,
  };
}

export function stockRowsForWarehouse(
  rows: DashboardStockRow[],
  warehouseId: string | null,
  /** Si se pasa, en modo "todos" solo filas de estos almacenes (p. ej. usuario no admin). */
  restrictToWarehouseIds: string[] | null
): DashboardStockRow[] {
  let r = rows;
  if (warehouseId) {
    r = r.filter((x) => x.warehouse_id === warehouseId);
  } else if (restrictToWarehouseIds && restrictToWarehouseIds.length > 0) {
    const set = new Set(restrictToWarehouseIds);
    r = r.filter((x) => set.has(x.warehouse_id));
  }
  return r;
}

export function buildSingleWarehouseSummary(
  warehouseId: string,
  warehouseName: string,
  rows: DashboardStockRow[]
) {
  const filtered = rows.filter((r) => r.warehouse_id === warehouseId);
  const m = computeStockMetrics(filtered);
  return {
    warehouse_name: warehouseName,
    total_items: m.totalItems,
    total_value: m.totalValue,
  };
}

/** Fila devuelta por `dashboard_movements_series`. */
export interface MovementsSeriesRow {
  day: string;
  entries: number | string;
  exits: number | string;
}

export interface ChartDayPoint {
  date: string;
  entries: number;
  exits: number;
  label: string;
  /** Fin del intervalo cuando los datos están agrupados (varios días). */
  dateEnd?: string;
}

export type MergeSeriesInput =
  | { mode: "days"; days: number }
  | { mode: "range"; dateFrom: string; dateTo: string };

function fillChartPoints(
  byDay: Map<string, { entries: number; exits: number }>,
  run: (emit: (dt: Date, key: string) => void) => void
): ChartDayPoint[] {
  const result: ChartDayPoint[] = [];
  const emit = (dt: Date, key: string) => {
    const v = byDay.get(key) ?? { entries: 0, exits: 0 };
    const label = new Intl.DateTimeFormat("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(dt);
    result.push({ date: key, entries: v.entries, exits: v.exits, label });
  };
  run(emit);
  return result;
}

function buildByDay(rows: MovementsSeriesRow[]) {
  const byDay = new Map<string, { entries: number; exits: number }>();
  for (const r of rows) {
    const key = localDateKey(String(r.day));
    if (!key) continue;
    byDay.set(key, {
      entries: Number(r.entries) || 0,
      exits: Number(r.exits) || 0,
    });
  }
  return byDay;
}

function mergeSeriesDays(rows: MovementsSeriesRow[], days: number): ChartDayPoint[] {
  const byDay = buildByDay(rows);
  const rangeStart = startOfLocalDay(new Date());
  rangeStart.setDate(rangeStart.getDate() - (days - 1));
  return fillChartPoints(byDay, (emit) => {
    for (let i = 0; i < days; i++) {
      const dt = new Date(rangeStart.getTime());
      dt.setDate(rangeStart.getDate() + i);
      const key = ymdLocal(dt);
      emit(dt, key);
    }
  });
}

function mergeSeriesDateRange(
  rows: MovementsSeriesRow[],
  dateFrom: string,
  dateTo: string
): ChartDayPoint[] {
  const byDay = buildByDay(rows);
  const start = startOfLocalDay(new Date(dateFrom + "T12:00:00"));
  const end = startOfLocalDay(new Date(dateTo + "T12:00:00"));
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
  if (end < start) return [];
  return fillChartPoints(byDay, (emit) => {
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dt = new Date(d);
      const key = ymdLocal(dt);
      emit(dt, key);
    }
  });
}

/**
 * Rellena todos los días del periodo con datos del endpoint (o 0) y etiquetas para la gráfica.
 */
export function mergeSeriesToChartData(
  rows: MovementsSeriesRow[],
  options: number | MergeSeriesInput
): ChartDayPoint[] {
  if (typeof options === "number") {
    return mergeSeriesDays(rows, options);
  }
  if (options.mode === "days") {
    return mergeSeriesDays(rows, options.days);
  }
  return mergeSeriesDateRange(rows, options.dateFrom, options.dateTo);
}

function parseYmdToLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return new Date(NaN);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/** Etiqueta corta para un intervalo [start, end] en días locales. */
function formatBucketLabel(start: Date, end: Date): string {
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";
  const sameMonth =
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();
  const sameYear = start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    const month = new Intl.DateTimeFormat("es-ES", { month: "short" }).format(
      start
    );
    return `${start.getDate()}–${end.getDate()} ${month}`;
  }
  const a = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
  }).format(start);
  const b = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: sameYear ? undefined : "numeric",
  }).format(end);
  return `${a} – ${b}`;
}

/**
 * Cuántos días calendario agrupar según el número de puntos diarios.
 * Objetivo: ~24 barras/puntos visibles como máximo.
 */
export function chooseBucketDaysForPointCount(dayCount: number): number {
  if (dayCount <= 31) return 1;
  const ideal = Math.ceil(dayCount / 24);
  if (ideal <= 4) return 7;
  if (ideal <= 8) return 14;
  return 30;
}

/**
 * Suma entradas/salidas por bloques de `bucketDays` días consecutivos (el orden de `points` debe ser cronológico).
 */
export function bucketChartSeries(
  points: ChartDayPoint[],
  bucketDays: number
): ChartDayPoint[] {
  if (bucketDays <= 1 || points.length === 0) {
    return points.map((p) => ({ ...p }));
  }
  const out: ChartDayPoint[] = [];
  for (let i = 0; i < points.length; i += bucketDays) {
    const chunk = points.slice(i, i + bucketDays);
    const entries = chunk.reduce((s, p) => s + p.entries, 0);
    const exits = chunk.reduce((s, p) => s + p.exits, 0);
    const first = chunk[0];
    const last = chunk[chunk.length - 1];
    const startD = parseYmdToLocalDate(first.date);
    const endD = parseYmdToLocalDate(last.date);
    out.push({
      date: first.date,
      dateEnd: last.date,
      entries,
      exits,
      label: formatBucketLabel(startD, endD),
    });
  }
  return out;
}
