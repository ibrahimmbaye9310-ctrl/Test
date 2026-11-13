import { Quote } from "lucide-react";
import { SectionHeading } from "@/components/ui/misc";

export type Testimonial = {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string;
  /** Date de collecte du témoignage, avec consentement écrit de son auteur. */
  collectedAt: string;
};

/**
 * Avis utilisateurs. N'affiche RIEN tant qu'aucun avis authentique et vérifié n'est fourni :
 * aucun témoignage inventé ne doit apparaître sur le site (pratique commerciale trompeuse).
 * Phase 6 : les avis seront saisis et validés depuis l'espace administrateur.
 */
export function Testimonials({ items }: { items: Testimonial[] }) {
  if (items.length === 0) return null;
  return (
    <section className="container-page py-20 sm:py-24" aria-labelledby="testimonials-title">
      <SectionHeading align="center" eyebrow="Ils utilisent JobFinder" title={<span id="testimonials-title">Ce qu&apos;en disent nos utilisateurs</span>} />
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {items.map((t) => (
          <figure key={t.id} className="rounded-3xl bg-surface p-7 shadow-card ring-1 ring-line">
            <Quote className="size-6 text-electric-500" aria-hidden />
            <blockquote className="mt-4 text-sm leading-relaxed text-navy-800">{t.quote}</blockquote>
            <figcaption className="mt-6 text-sm">
              <span className="font-semibold text-navy-950">{t.authorName}</span>
              <span className="block text-ink-muted">{t.authorRole}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
