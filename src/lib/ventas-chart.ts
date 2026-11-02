export type VentaPunto = {
  created_at: string;
  total: number;
  estado: string;
};

export type BarraVentas = {
  key: string;
  label: string;
  total: number;
  cantidad: number;
};

const ESTADOS_VENTA = new Set([
  "COMPROBANTE_SUBIDO",
  "CONFIRMADO",
  "ENVIADO",
  "ENTREGADO",
]);

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function daysBetween(from: Date, to: Date) {
  const a = startOfDay(from).getTime();
  const b = startOfDay(to).getTime();
  return Math.round((b - a) / 86_400_000) + 1;
}

function fmtDia(d: Date) {
  return d.toLocaleDateString("es-HN", { day: "numeric", month: "short" });
}

function fmtMes(d: Date) {
  return d.toLocaleDateString("es-HN", { month: "short", year: "2-digit" });
}

function keyDia(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function keyMes(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatRangoLabel(from: Date, to: Date) {
  if (sameDay(from, to)) {
    return from.toLocaleDateString("es-HN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  const a = from.toLocaleDateString("es-HN", {
    day: "numeric",
    month: "short",
  });
  const b = to.toLocaleDateString("es-HN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${a} – ${b}`;
}

/** Agrupa ventas en el rango [from, to] (inclusive). */
export function agruparVentasRango(
  puntos: VentaPunto[],
  from: Date,
  to: Date
): BarraVentas[] {
  const inicio = startOfDay(from);
  const fin = endOfDay(to);
  if (inicio > fin) return [];

  const ventas = puntos.filter((p) => {
    if (!ESTADOS_VENTA.has(p.estado)) return false;
    const d = new Date(p.created_at);
    return d >= inicio && d <= fin;
  });

  const span = daysBetween(inicio, fin);
  const buckets: BarraVentas[] = [];

  // 1 día o hasta ~45 días → una barra por día
  // más de 45 → una barra por mes (rangos largos)
  if (span <= 45) {
    for (let i = 0; i < span; i++) {
      const d = addDays(inicio, i);
      buckets.push({
        key: keyDia(d),
        label: fmtDia(d),
        total: 0,
        cantidad: 0,
      });
    }
    const index = new Map(buckets.map((b, i) => [b.key, i]));
    for (const v of ventas) {
      const k = keyDia(startOfDay(new Date(v.created_at)));
      const i = index.get(k);
      if (i === undefined) continue;
      buckets[i].total += Number(v.total) || 0;
      buckets[i].cantidad += 1;
    }
  } else {
    const cursor = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
    const last = new Date(fin.getFullYear(), fin.getMonth(), 1);
    while (cursor <= last) {
      buckets.push({
        key: keyMes(cursor),
        label: fmtMes(cursor),
        total: 0,
        cantidad: 0,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    const index = new Map(buckets.map((b, i) => [b.key, i]));
    for (const v of ventas) {
      const k = keyMes(new Date(v.created_at));
      const i = index.get(k);
      if (i === undefined) continue;
      buckets[i].total += Number(v.total) || 0;
      buckets[i].cantidad += 1;
    }
  }

  return buckets;
}

export function presetHoy(ahora = new Date()) {
  const d = startOfDay(ahora);
  return { from: d, to: d };
}

export function preset7Dias(ahora = new Date()) {
  const to = startOfDay(ahora);
  return { from: addDays(to, -6), to };
}

export function presetMes(ahora = new Date()) {
  const to = startOfDay(ahora);
  const from = new Date(to.getFullYear(), to.getMonth(), 1);
  return { from, to };
}
