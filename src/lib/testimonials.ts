import "server-only";
import type { Testimonial } from "@/components/landing/testimonials";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Avis authentiques uniquement : saisis par un administrateur avec la date du consentement de leur auteur,
 * puis publiés. Tant qu'aucun avis n'est publié, la section n'apparaît pas sur la page d'accueil.
 */
export async function getApprovedTestimonials(): Promise<Testimonial[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];
  const { data } = await supabase.from("testimonials").select("id, author_name, author_role, quote, consent_at").eq("is_published", true).order("created_at", { ascending: false }).limit(6);
  return (data ?? []).map((t) => ({ id: t.id, quote: t.quote, authorName: t.author_name, authorRole: t.author_role, collectedAt: t.consent_at }));
}
