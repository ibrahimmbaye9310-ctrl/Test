import type { JobOfferSummary, SalaryPeriod } from "@/types/job";
import type { SearchCriteria } from "./search-params";
import { PAGE_SIZE } from "./search-params";
import { distanceKm, getCommune, normalizePlace, resolvePlace, type ResolvedPlace } from "@/lib/geo/communes";

/** Base légale française : 151,67 h par mois pour un temps plein. */
const HOURS_PER_MONTH = 151.67;

/** Salaire mensuel brut équivalent temps plein (pour comparer heure / mois / an). */
export function monthlyEquivalent(amount: number, period: SalaryPeriod) {
  if (period === "hour") return amount * HOURS_PER_MONTH;
  if (period === "year") return amount / 12;
  return amount;
}

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export type SearchResultItem = JobOfferSummary & { distanceKm: number | null };

export type SearchResult = {
  items: SearchResultItem[];
  total: number;
  page: number;
  pageCount: number;
  place: ResolvedPlace;
  /** Le lieu saisi n'a pas pu être géolocalisé : on a fait une recherche textuelle à la place. */
  placeFallback: boolean;
};

/**
 * Filtre, trie et pagine une liste d'offres. Fonction pure (testée unitairement).
 * Avec Supabase, la même logique sera traduite en SQL (plein texte, distance, index) — voir docs/ARCHITECTURE.md.
 */
export function searchInList(offers: JobOfferSummary[], c: SearchCriteria): SearchResult {
  const place = resolvePlace(c.lieu);
  const placeFallback = Boolean(c.lieu) && place.kind === "none";
  const terms = c.q ? normalize(c.q).split(/\s+/).filter(Boolean) : [];

  let items: SearchResultItem[] = offers.map((o) => {
    const commune = getCommune(o.communeCode);
    return { ...o, distanceKm: place.kind === "point" && commune ? distanceKm(place, commune) : null };
  });

  // Mot-clé : chaque terme doit apparaître dans le titre, l'entreprise ou la description.
  if (terms.length) {
    items = items.filter((o) => {
      const hay = normalize(`${o.title} ${o.companyName} ${o.shortDescription}`);
      return terms.every((t) => hay.includes(t));
    });
  }

  // Lieu
  if (place.kind === "point") {
    items = items.filter((o) =>
      c.rayon ? o.distanceKm !== null && o.distanceKm <= c.rayon : place.postalCodes.includes(o.postalCode) || normalizePlace(o.city) === normalizePlace(place.label),
    );
  } else if (place.kind === "department") {
    items = items.filter((o) => o.postalCode.startsWith(place.department));
  } else if (placeFallback && c.lieu) {
    const key = normalizePlace(c.lieu);
    items = items.filter((o) => normalizePlace(o.city).includes(key) || o.postalCode.startsWith(c.lieu!.trim()));
  }

  if (c.contrat.length) items = items.filter((o) => c.contrat.includes(o.contractType));
  if (c.temps) items = items.filter((o) => o.workTime === c.temps);
  if (c.etudiant) items = items.filter((o) => o.isStudentFriendly);
  if (c.horaire.length) items = items.filter((o) => o.schedules.some((s) => c.horaire.includes(s)));
  if (c.secteur.length) items = items.filter((o) => c.secteur.includes(o.sector));
  if (c.salaire) {
    const min = c.salaire;
    // On retient l'offre si le haut de sa fourchette atteint le minimum demandé. Sans salaire renseigné : exclue.
    items = items.filter((o) => o.salaryPeriod && o.salaryMin != null && monthlyEquivalent(o.salaryMax ?? o.salaryMin, o.salaryPeriod) >= min);
  }

  const byDate = (a: SearchResultItem, b: SearchResultItem) => b.publishedAt.localeCompare(a.publishedAt);
  if (c.tri === "ancien") items.sort((a, b) => -byDate(a, b));
  else if (c.tri === "distance" && place.kind === "point") items.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) || byDate(a, b));
  // Par défaut : les offres « à la une » (formule Pro) remontent, puis tri par date.
  else items.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || byDate(a, b));

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(c.page, pageCount);
  return { items: items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total, page, pageCount, place, placeFallback };
}
