export type VentaPunto = {
  created_at: string;
  total: number;
  estado: string;
};

export type PeriodoVentas = "dias" | "semanas" | "meses";

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

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay(); // 0 domingo
  const diff = day === 0 ? -6 : 1 - day; // lunes como inicio
  return addDays(x, diff);
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function fmtDia(d: Date) {
  return d.toLocaleDateString("es-HN", { day: "numeric", month: "short" });
}

function fmtSemana(d: Date) {
  const fin = addDays(d, 6);
  return `${d.getDate()}/${d.getMonth() + 1}–${fin.getDate()}/${fin.getMonth() + 1}`;
}

function fmtMes(d: Date) {
  return d.toLocaleDateString("es-HN", { month: "short", year: "2-digit" });
}

function keyDia(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function keySemana(d: Date) {
  const s = startOfWeek(d);
  return keyDia(s);
}

function keyMes(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Agrupa ventas confirmadas / en proceso por período. */
export function agruparVentas(
  puntos: VentaPunto[],
  periodo: PeriodoVentas,
  ahora = new Date()
): BarraVentas[] {
  const ventas = puntos.filter((p) => ESTADOS_VENTA.has(p.estado));
  const buckets: BarraVentas[] = [];

  if (periodo === "dias") {
    const hoy = startOfDay(ahora);
    for (let i = 13; i >= 0; i--) {
      const d = addDays(hoy, -i);
      buckets.push({
        key: keyDia(d),
        label: fmtDia(d),
        total: 0,
        cantidad: 0,
      });
    }
  } else if (periodo === "semanas") {
    const esta = startOfWeek(ahora);
    for (let i = 7; i >= 0; i--) {
      const d = addDays(esta, -i * 7);
      buckets.push({
        key: keySemana(d),
        label: fmtSemana(d),
        total: 0,
        cantidad: 0,
      });
    }
  } else {
    const este = startOfMonth(ahora);
    for (let i = 11; i >= 0; i--) {
      const d = new Date(este.getFullYear(), este.getMonth() - i, 1);
      buckets.push({
        key: keyMes(d),
        label: fmtMes(d),
        total: 0,
        cantidad: 0,
      });
    }
  }

  const index = new Map(buckets.map((b, i) => [b.key, i]));

  for (const v of ventas) {
    const d = new Date(v.created_at);
    let k: string;
    if (periodo === "dias") k = keyDia(startOfDay(d));
    else if (periodo === "semanas") k = keySemana(d);
    else k = keyMes(d);

    const i = index.get(k);
    if (i === undefined) continue;
    buckets[i].total += Number(v.total) || 0;
    buckets[i].cantidad += 1;
  }

  return buckets;
}
