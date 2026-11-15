import { z } from "zod";

// Ce module est aussi chargé dans le navigateur : on désactive l'optimisation de Zod basée sur eval
// (bloquée par notre CSP, elle déclencherait une violation signalée par le navigateur).
z.config({ jitless: true });
import { CONTRACT_TYPES, RADIUS_OPTIONS, SCHEDULES, SECTORS, WORK_TIMES } from "@/lib/config/taxonomy";

/**
 * Critères de recherche lus depuis l'URL (/offres?q=…&contrat=cdi&contrat=cdd…).
 * Partagé client/serveur : tout paramètre invalide est ignoré silencieusement plutôt que de provoquer une erreur.
 */
export const SORTS = [
  { value: "recent", label: "Plus récentes" },
  { value: "ancien", label: "Plus anciennes" },
  { value: "distance", label: "Plus proches" },
] as const;

export const SALARY_OPTIONS = [1800, 2000, 2500, 3000, 3500] as const;
export const PAGE_SIZE = 12;

const values = <T extends readonly { value: string }[]>(list: T) => list.map((x) => x.value) as [T[number]["value"], ...T[number]["value"][]];

const many = <T extends [string, ...string[]]>(allowed: T) =>
  z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => {
      const arr = v === undefined ? [] : Array.isArray(v) ? v : [v];
      return [...new Set(arr.filter((x): x is T[number] => (allowed as readonly string[]).includes(x)))];
    });

/** Valeur unique : prend la première occurrence, et ignore (undefined) toute valeur invalide. */
const one = <S extends z.ZodType>(schema: S) =>
  z.preprocess((v) => (Array.isArray(v) ? v[0] : v), schema.optional().catch(undefined));

const text = (max: number) =>
  one(
    z
      .string()
      .trim()
      .max(max)
      .transform((s) => s || undefined),
  );

const schema = z.object({
  q: text(100),
  lieu: text(80),
  rayon: one(z.coerce.number().refine((n) => (RADIUS_OPTIONS as readonly number[]).includes(n))),
  contrat: many(values(CONTRACT_TYPES)),
  temps: one(z.enum(values(WORK_TIMES))),
  etudiant: one(z.literal("1")).transform((v) => v === "1"),
  horaire: many(values(SCHEDULES)),
  secteur: many(values(SECTORS)),
  salaire: one(z.coerce.number().int().min(0).max(20000)),
  tri: one(z.enum(["recent", "ancien", "distance"])).transform((v) => v ?? "recent"),
  page: one(z.coerce.number().int().min(1).max(500)).transform((v) => v ?? 1),
});

export type SearchCriteria = z.output<typeof schema>;
export type RawSearchParams = Record<string, string | string[] | undefined>;

export function parseSearchParams(params: RawSearchParams): SearchCriteria {
  return schema.parse(params);
}

/** Reconstruit une URL de recherche propre (sans valeurs par défaut) avec d'éventuelles modifications. */
export function buildSearchHref(criteria: SearchCriteria, changes: Partial<SearchCriteria> = {}) {
  const c = { ...criteria, ...changes };
  const sp = new URLSearchParams();
  if (c.q) sp.set("q", c.q);
  if (c.lieu) sp.set("lieu", c.lieu);
  if (c.lieu && c.rayon) sp.set("rayon", String(c.rayon));
  c.contrat.forEach((v) => sp.append("contrat", v));
  if (c.temps) sp.set("temps", c.temps);
  if (c.etudiant) sp.set("etudiant", "1");
  c.horaire.forEach((v) => sp.append("horaire", v));
  c.secteur.forEach((v) => sp.append("secteur", v));
  if (c.salaire) sp.set("salaire", String(c.salaire));
  if (c.tri !== "recent") sp.set("tri", c.tri);
  if (c.page > 1) sp.set("page", String(c.page));
  const qs = sp.toString();
  return qs ? `/offres?${qs}` : "/offres";
}

export function countActiveFilters(c: SearchCriteria) {
  return (
    c.contrat.length + c.horaire.length + c.secteur.length + (c.temps ? 1 : 0) + (c.etudiant ? 1 : 0) + (c.salaire ? 1 : 0) + (c.lieu && c.rayon ? 1 : 0)
  );
}
