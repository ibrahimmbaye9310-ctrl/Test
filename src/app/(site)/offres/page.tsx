import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SearchBar } from "@/components/jobs/search-bar";
import { JobCard } from "@/components/jobs/job-card";
import { ButtonLink } from "@/components/ui/button";
import { Callout, EmptyState } from "@/components/ui/misc";
import { searchOffers } from "@/lib/jobs/queries";

export const metadata: Metadata = {
  title: "Offres d'emploi en Île-de-France",
  description: "CDI, CDD, intérim, alternance, stage, temps partiel et jobs étudiants en Île-de-France.",
  alternates: { canonical: "/offres" },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.slice(0, 100);

export default async function OffersPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = first(params.q);
  const lieu = first(params.lieu);
  const offers = await searchOffers({ q, lieu });
  const hasDemo = offers.some((o) => o.isDemo);

  return (
    <>
      <PageHeader eyebrow="Recherche" title="Offres d'emploi" description="Trouvez un poste adapté à votre rythme, près de chez vous.">
        <SearchBar defaultQuery={q} defaultLocation={lieu} className="max-w-3xl" />
      </PageHeader>

      <div className="container-page py-10">
        <Callout className="mb-6">
          Version de démonstration : la recherche par mot-clé et lieu fonctionne. Les filtres avancés (contrat, horaires,
          rayon, salaire, secteur), le tri et la pagination arrivent en phase 2.
        </Callout>
        {hasDemo && (
          <Callout tone="warning" className="mb-6">
            Toutes les offres affichées sont <strong>fictives</strong> et servent uniquement à présenter l&apos;interface.
          </Callout>
        )}

        <p className="mb-5 text-sm text-ink-muted" aria-live="polite">
          {offers.length} offre{offers.length > 1 ? "s" : ""}
          {q ? ` pour « ${q} »` : ""}
          {lieu ? ` à « ${lieu} »` : ""}
        </p>

        {offers.length === 0 ? (
          <EmptyState
            icon={<SearchX />}
            title="Aucune offre ne correspond"
            description="Essayez un autre mot-clé ou élargissez la zone de recherche."
            action={<ButtonLink href="/offres" variant="secondary">Réinitialiser la recherche</ButtonLink>}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {offers.map((o) => (
              <JobCard key={o.id} offer={o} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
