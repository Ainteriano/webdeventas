/** Tallas americanas: número + M (Men) / W (Woman) */
export const TALLA_NUMEROS = [
  "5",
  "5.5",
  "6",
  "6.5",
  "7",
  "7.5",
  "8",
  "8.5",
  "9",
  "9.5",
  "10",
  "10.5",
  "11",
  "11.5",
  "12",
] as const;

export const TALLA_GENEROS = [
  { value: "M", label: "M · Hombre" },
  { value: "W", label: "W · Mujer" },
] as const;

export function parseTallaAmericana(talla: string | null | undefined): {
  numero: string;
  genero: "M" | "W";
} | null {
  const raw = (talla || "").trim().toUpperCase();
  const m = raw.match(/^(\d+(?:\.5)?)([MW])$/);
  if (!m) return null;
  return { numero: m[1], genero: m[2] as "M" | "W" };
}

export function formatTallaAmericana(numero: string, genero: "M" | "W"): string {
  return `${numero}${genero}`;
}

export function etiquetaTalla(talla: string | null | undefined): string {
  const p = parseTallaAmericana(talla);
  if (!p) return talla || "";
  return `${p.numero}${p.genero}`;
}
