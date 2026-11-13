import "server-only";
import type { JobOfferSummary } from "@/types/job";
import { DEMO_OFFERS } from "@/lib/demo/offers";
import { demoDataEnabled } from "@/lib/config/site";

/**
 * Couche d'accès aux offres. En phase 1, seules les données de démonstration (fictives) existent.
 * Phase 2/5 : ces fonctions interrogeront Supabase (table job_offers, statut "published" uniquement)
 * sans changer leur signature, ce qui évite de toucher aux composants.
 */
function source(): JobOfferSummary[] {
  return demoDataEnabled ? DEMO_OFFERS : [];
}

export async function getLatestOffers(limit: number): Promise<JobOfferSummary[]> {
  return [...source()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, limit);
}

export async function getOfferBySlug(slug: string): Promise<JobOfferSummary | null> {
  return source().find((o) => o.slug === slug) ?? null;
}

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Recherche simple (mot-clé + lieu). Les filtres avancés et la pagination arrivent en phase 2. */
export async function searchOffers({ q, lieu }: { q?: string; lieu?: string }): Promise<JobOfferSummary[]> {
  const query = q ? normalize(q) : "";
  const place = lieu ? normalize(lieu) : "";
  return source()
    .filter((o) => !query || normalize(`${o.title} ${o.companyName} ${o.shortDescription}`).includes(query))
    .filter((o) => !place || normalize(o.city).includes(place) || o.postalCode.startsWith(place))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
