import { Inbox } from "lucide-react";
import type { JobOfferSummary } from "@/types/job";
import { JobCard } from "@/components/jobs/job-card";
import { ButtonLink } from "@/components/ui/button";
import { Callout, EmptyState, SectionHeading } from "@/components/ui/misc";

export function LatestOffers({ offers }: { offers: JobOfferSummary[] }) {
  const hasDemo = offers.some((o) => o.isDemo);
  return (
    <section className="border-y border-line bg-surface py-20 sm:py-24" aria-labelledby="latest-title">
      <div className="container-page">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading eyebrow="Dernières offres" title={<span id="latest-title">Publiées récemment</span>} />
          <ButtonLink href="/offres" variant="secondary">
            Voir toutes les offres
          </ButtonLink>
        </div>

        {hasDemo && (
          <Callout tone="warning" className="mt-8">
            <strong className="font-semibold">Offres de démonstration.</strong> Les annonces ci-dessous sont fictives et
            servent uniquement à présenter l&apos;interface. Elles ne correspondent à aucun poste réel.
          </Callout>
        )}

        {offers.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              icon={<Inbox />}
              title="Les premières offres arrivent"
              description="Les entreprises d'Île-de-France publient leurs annonces en ce moment. Créez votre profil pour être prêt·e."
              action={<ButtonLink href="/inscription">Créer mon profil</ButtonLink>}
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => (
              <JobCard key={offer.id} offer={offer} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
