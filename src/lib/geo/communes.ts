import "server-only";
import data from "./communes-idf.json";

/**
 * Communes d'Île-de-France (codes INSEE, codes postaux, coordonnées du centre).
 * Généré par scripts/build-communes-idf.py — sources : Etalab, La Poste (Licence Ouverte), GeoNames (CC BY 4.0).
 */
export type Commune = { code: string; name: string; department: string; postalCodes: string[]; lat: number; lng: number };

type Raw = { i: string; n: string; d: string; p: string[]; la: number; lo: number };

export const COMMUNES: Commune[] = (data as Raw[]).map((c) => ({
  code: c.i,
  name: c.n,
  department: c.d,
  postalCodes: c.p,
  lat: c.la,
  lng: c.lo,
}));

const byCode = new Map(COMMUNES.map((c) => [c.code, c]));

export const IDF_DEPARTMENTS: Record<string, string> = {
  "75": "Paris",
  "77": "Seine-et-Marne",
  "78": "Yvelines",
  "91": "Essonne",
  "92": "Hauts-de-Seine",
  "93": "Seine-Saint-Denis",
  "94": "Val-de-Marne",
  "95": "Val-d'Oise",
};

export function getCommune(code: string | null | undefined) {
  return code ? byCode.get(code) ?? null : null;
}

export function normalizePlace(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\bsaint\b/g, "st")
    .replace(/\bsainte\b/g, "ste")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const indexed = COMMUNES.map((c) => ({ c, key: normalizePlace(c.name) }));

/** Lieu résolu à partir de la saisie : un point (rayon possible) ou une zone (département, code postal). */
export type ResolvedPlace =
  | { kind: "point"; label: string; lat: number; lng: number; postalCodes: string[] }
  | { kind: "department"; label: string; department: string }
  | { kind: "none" };

/**
 * Interprète « Créteil », « 94000 », « 94 », « Paris 11 », « 75011 »…
 * Un code postal partagé par plusieurs communes est centré sur la moyenne de leurs centres.
 * Pour un nom, une correspondance exacte est privilégiée sur une correspondance par préfixe.
 */
export function resolvePlace(input: string | undefined): ResolvedPlace {
  const raw = input?.trim();
  if (!raw) return { kind: "none" };

  if (/^\d{5}$/.test(raw)) {
    const matches = COMMUNES.filter((c) => c.postalCodes.includes(raw));
    const first = matches[0];
    if (!first) return { kind: "none" };
    const lat = matches.reduce((s, c) => s + c.lat, 0) / matches.length;
    const lng = matches.reduce((s, c) => s + c.lng, 0) / matches.length;
    const label = matches.length === 1 ? `${raw} ${first.name}` : `${raw} (${matches.length} communes)`;
    return { kind: "point", label, lat, lng, postalCodes: [raw] };
  }
  if (/^\d{2}$/.test(raw) && IDF_DEPARTMENTS[raw]) {
    return { kind: "department", label: `${IDF_DEPARTMENTS[raw]} (${raw})`, department: raw };
  }

  const key = normalizePlace(raw);
  if (key === "paris") {
    return { kind: "department", label: "Paris", department: "75" };
  }
  // « Paris 11 », « paris 11e », « Paris 1er »
  const arr = key.match(/^paris (\d{1,2})(?:er|e|eme)?$/);
  const target = arr ? `paris ${Number(arr[1])}${Number(arr[1]) === 1 ? "er" : "e"}` : key;
  const exact = indexed.find((x) => x.key === target);
  const found = exact ?? indexed.find((x) => x.key.startsWith(target));
  if (!found) return { kind: "none" };
  const c = found.c;
  return { kind: "point", label: c.name, lat: c.lat, lng: c.lng, postalCodes: c.postalCodes };
}

/** Suggestions pour l'autocomplétion du champ lieu. */
export function suggestPlaces(input: string, limit = 8): { label: string; value: string }[] {
  const key = normalizePlace(input);
  if (key.length < 2) return [];
  if (/^\d+$/.test(key)) {
    return COMMUNES.flatMap((c) => c.postalCodes.filter((p) => p.startsWith(key)).map((p) => ({ label: `${p} ${c.name}`, value: p })))
      .slice(0, limit);
  }
  const starts = indexed.filter((x) => x.key.startsWith(key));
  const contains = indexed.filter((x) => !x.key.startsWith(key) && x.key.includes(key));
  return [...starts, ...contains].slice(0, limit).map(({ c }) => ({ label: `${c.name} (${c.department})`, value: c.name }));
}

/** Distance à vol d'oiseau en km (formule de haversine). */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
