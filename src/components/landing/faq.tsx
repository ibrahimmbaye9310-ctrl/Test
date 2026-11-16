import Link from "next/link";
import { Plus } from "lucide-react";
import { SectionHeading } from "@/components/ui/misc";

export const FAQ_ITEMS = [
  {
    q: "Kairo est-il gratuit pour les candidats ?",
    a: "Oui. Créer un profil, rechercher des offres, enregistrer des favoris, postuler et suivre vos candidatures est entièrement gratuit.",
  },
  {
    q: "Je suis étudiant·e, puis-je trouver un job compatible avec mes cours ?",
    a: "C'est l'une des raisons d'être de Kairo. Filtrez par « Emploi étudiant », temps partiel et horaires (soirée, week-end…), et indiquez vos disponibilités dans votre profil.",
  },
  {
    q: "Dans quelles villes Kairo est-il disponible ?",
    a: "Nous lançons la plateforme en Île-de-France (Paris et les sept départements de la région). L'ouverture au reste de la France est prévue dans un second temps.",
  },
  {
    q: "Qui peut voir mon CV ?",
    a: "Uniquement les recruteurs des offres auxquelles vous avez postulé. Votre CV n'est jamais public et vous pouvez le supprimer, exporter vos données ou fermer votre compte à tout moment.",
  },
  {
    q: "Comment fonctionnent les abonnements recruteurs ?",
    a: "Starter (29 € HT/mois, 3 annonces actives) et Pro (59 € HT/mois, 10 annonces actives et mise en avant) sont sans engagement et résiliables à tout moment. Pour un besoin ponctuel, l'annonce à l'unité coûte 9,90 € HT.",
  },
  {
    q: "Comment les annonces sont-elles vérifiées ?",
    a: "Chaque annonce peut être signalée par les utilisateurs et notre équipe de modération supprime les offres frauduleuses ou non conformes. Les comptes entreprise sont contrôlés.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="container-page scroll-mt-20 py-20 sm:py-24" aria-labelledby="faq-title">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
        <SectionHeading
          eyebrow="FAQ"
          title={<span id="faq-title">Questions fréquentes</span>}
          description={
            <>
              Une autre question ?{" "}
              <Link href="/contact" className="font-medium text-electric-600 hover:underline">
                Écrivez-nous
              </Link>
              .
            </>
          }
        />
        <div className="divide-y divide-line border-y border-line">
          {FAQ_ITEMS.map((item) => (
            <details key={item.q} className="group py-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left font-medium text-navy-950">
                {item.q}
                <Plus className="size-5 shrink-0 text-ink-subtle transition-transform duration-200 group-open:rotate-45" aria-hidden />
              </summary>
              <p className="mt-3 pr-10 text-sm leading-relaxed text-ink-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
