import "server-only";
import type { JobOffer, JobOfferSummary } from "@/types/job";
import { DEMO_OFFERS } from "@/lib/demo/offers";
import { demoDataEnabled } from "@/lib/config/site";
import { searchInList, type SearchResult } from "./search";
import type { SearchCriteria } from "./search-params";

/**
 * Couche d'accès aux offres. Tant que Supabase n'est pas branché, seules les données de démonstration (fictives)
 * existent. Phase 3/5 : ces fonctions interrogeront la table job_offers (statut "published" uniquement)
 * sans changer leur signature, ce qui évite de toucher aux pages et composants.
 */
function source(): JobOffer[] {
  return demoDataEnabled ? DEMO_OFFERS : [];
}

const SUMMARY_KEYS = [
  "id", "slug", "title", "companyName", "companyLogoUrl", "city", "postalCode", "communeCode", "contractType", "workTime", "schedules",
  "sector", "isStudentFriendly", "salaryMin", "salaryMax", "salaryPeriod", "shortDescription", "publishedAt", "isFeatured", "isDemo",
] as const satisfies readonly (keyof JobOfferSummary)[];

/** Ne transmet aux listes que les champs nécessaires (payload plus léger). */
const toSummary = (o: JobOffer): JobOfferSummary =>
  Object.fromEntries(SUMMARY_KEYS.map((k) => [k, o[k]])) as JobOfferSummary;

export async function getLatestOffers(limit: number): Promise<JobOfferSummary[]> {
  return [...source()]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit)
    .map(toSummary);
}

export async function getOfferBySlug(slug: string): Promise<JobOffer | null> {
  return source().find((o) => o.slug === slug) ?? null;
}

export async function searchOffers(criteria: SearchCriteria): Promise<SearchResult> {
  return searchInList(source().map(toSummary), criteria);
}

/** Offres proches : même secteur ou même type de contrat, les plus récentes. */
export async function getSimilarOffers(offer: JobOffer, limit = 3): Promise<JobOfferSummary[]> {
  return source()
    .filter((o) => o.id !== offer.id)
    .map((o) => ({ o, score: (o.sector === offer.sector ? 2 : 0) + (o.contractType === offer.contractType ? 1 : 0) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.o.publishedAt.localeCompare(a.o.publishedAt))
    .slice(0, limit)
    .map((x) => toSummary(x.o));
}

export async function getPublishedOfferSlugs(): Promise<string[]> {
  return source().filter((o) => !o.isDemo).map((o) => o.slug);
}
