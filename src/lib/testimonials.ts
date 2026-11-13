import "server-only";
import type { Testimonial } from "@/components/landing/testimonials";

/**
 * Avis authentiques uniquement. Aucun avis n'existe avant le lancement : la liste est vide
 * et la section n'est pas affichée. Phase 6 : lecture des avis validés en base par un administrateur.
 */
export async function getApprovedTestimonials(): Promise<Testimonial[]> {
  return [];
}
