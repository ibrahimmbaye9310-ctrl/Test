import "server-only";
import type { JobOffer, JobOfferSummary } from "@/types/job";
import { DEMO_OFFERS } from "@/lib/demo/offers";
import { demoDataEnabled } from "@/lib/config/site";
import { createPublicClient } from "@/lib/supabase/public";
import { offerFromRow } from "./mappers";
import { searchInList, type SearchResult } from "./search";
import type { SearchCriteria } from "./search-params";

/**
 * Couche d'accès aux offres : offres publiées en base (vue public_job_offers, RLS « visiteur »)
 * + offres de démonstration fictives si NEXT_PUBLIC_ENABLE_DEMO_DATA n'est pas à "false".
 *
 * Volume de lancement : on charge les MAX_DB_OFFERS offres publiées les plus récentes et on filtre en mémoire
 * (logique testée dans search.ts). Au-delà, la recherche sera traduite en SQL (plein texte, distance, pagination).
 */
const MAX_DB_OFFERS = 1000;

async function dbOffers(filter?: { slug?: string }): Promise<JobOffer[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];
  let query = supabase.from("public_job_offers").select("*").order("published_at", { ascending: false }).limit(MAX_DB_OFFERS);
  if (filter?.slug) query = query.eq("slug", filter.slug);
  const { data, error } = await query;
  if (error) {
    console.error("[offres] lecture Supabase impossible :", error.message);
    return [];
  }
  return data.map(offerFromRow);
}

async function source(): Promise<JobOffer[]> {
  return [...(await dbOffers()), ...(demoDataEnabled ? DEMO_OFFERS : [])];
}

const SUMMARY_KEYS = [
  "id", "slug", "title", "companyName", "companyLogoUrl", "city", "postalCode", "communeCode", "contractType", "workTime", "schedules",
  "sector", "isStudentFriendly", "salaryMin", "salaryMax", "salaryPeriod", "shortDescription", "publishedAt", "isFeatured", "isDemo",
] as const satisfies readonly (keyof JobOfferSummary)[];

/** Ne transmet aux listes que les champs nécessaires (payload plus léger). */
const toSummary = (o: JobOffer): JobOfferSummary =>
  Object.fromEntries(SUMMARY_KEYS.map((k) => [k, o[k]])) as JobOfferSummary;

export async function getLatestOffers(limit: number): Promise<JobOfferSummary[]> {
  return (await source())
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit)
    .map(toSummary);
}

export async function getOfferBySlug(slug: string): Promise<JobOffer | null> {
  if (slug.includes("-demo-")) return (demoDataEnabled && DEMO_OFFERS.find((o) => o.slug === slug)) || null;
  return (await dbOffers({ slug }))[0] ?? null;
}

export async function searchOffers(criteria: SearchCriteria): Promise<SearchResult> {
  return searchInList((await source()).map(toSummary), criteria);
}

/** Offres proches : même secteur ou même type de contrat, les plus récentes. */
export async function getSimilarOffers(offer: JobOffer, limit = 3): Promise<JobOfferSummary[]> {
  return (await source())
    .filter((o) => o.id !== offer.id)
    .map((o) => ({ o, score: (o.sector === offer.sector ? 2 : 0) + (o.contractType === offer.contractType ? 1 : 0) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.o.publishedAt.localeCompare(a.o.publishedAt))
    .slice(0, limit)
    .map((x) => toSummary(x.o));
}

export async function getPublishedOfferSlugs(): Promise<string[]> {
  return (await dbOffers()).map((o) => o.slug);
}
