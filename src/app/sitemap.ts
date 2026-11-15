import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config/site";
import { createPublicClient } from "@/lib/supabase/public";

export const revalidate = 3600;

/**
 * Plan du site : pages publiques indexables + offres réelles publiées (les pages de recherche filtrées sont
 * en noindex, elles n'y figurent donc pas). Les offres de démonstration (fictives)
 * et les espaces privés n'y figurent jamais.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/offres`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/entreprises`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/tarifs`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/mentions-legales`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${base}/confidentialite`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${base}/cgu`, changeFrequency: "yearly", priority: 0.1 },
  ];
  const supabase = createPublicClient();
  if (!supabase) return pages;
  const { data } = await supabase.from("public_job_offers").select("slug, updated_at").order("published_at", { ascending: false }).limit(5000);
  return [...pages, ...(data ?? []).map((o) => ({ url: `${base}/offres/${o.slug}`, lastModified: new Date(o.updated_at), changeFrequency: "weekly" as const, priority: 0.8 }))];
}
