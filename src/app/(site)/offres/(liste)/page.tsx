import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { SearchBar } from "@/components/jobs/search-bar";
import { JobCard } from "@/components/jobs/job-card";
import { SearchFilters } from "@/components/jobs/search-filters";
import { MobileFilters } from "@/components/jobs/mobile-filters";
import { ActiveFilters } from "@/components/jobs/active-filters";
import { SortSelect } from "@/components/jobs/sort-select";
import { Pagination } from "@/components/jobs/pagination";
import { ButtonLink } from "@/components/ui/button";
import { Callout, EmptyState } from "@/components/ui/misc";
import { searchOffers } from "@/lib/jobs/queries";
import { buildSearchHref, countActiveFilters, parseSearchParams, type RawSearchParams } from "@/lib/jobs/search-params";

type Props = { searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const c = parseSearchParams(await searchParams);
  const what = c.q ? `Offres « ${c.q} »` : "Offres d'emploi";
  const where = c.lieu ? ` à ${c.lieu}` : " en Île-de-France";
  const filtered = countActiveFilters(c) > 0 || c.page > 1 || c.tri !== "recent";
  return {
    title: `${what}${where}`,
    description: "CDI, CDD, intérim, alternance, stage, temps partiel et jobs étudiants en Île-de-France. Filtrez par horaires, distance et salaire.",
    // Seules les pages de recherche « simples » sont indexées, pour éviter des milliers de combinaisons de filtres en double.
    robots: filtered ? { index: false, follow: true } : undefined,
    alternates: { canonical: buildSearchHref({ ...c, contrat: [], horaire: [], secteur: [], temps: undefined, etudiant: false, salaire: undefined, rayon: undefined, tri: "recent", page: 1 }) },
  };
}

export default async function OffersPage({ searchParams }: Props) {
  const criteria = parseSearchParams(await searchParams);
  const result = await searchOffers(criteria);
  const canUseRadius = result.place.kind === "point";
  const activeCount = countActiveFilters(criteria);
  const hasDemo = result.items.some((o) => o.isDemo);

  // Filtres conservés quand on relance une recherche depuis la barre du haut.
  const keep = new URLSearchParams(buildSearchHref({ ...criteria, q: undefined, lieu: undefined, page: 1 }).split("?")[1] ?? "");
  const hiddenParams = [...keep.entries()].filter(([k]) => k !== "rayon" || criteria.lieu);
  const filtersKey = buildSearchHref(criteria, { page: 1 });

  return (
    <>
      <div className="border-b border-line bg-surface/60">
        <div className="container-page py-8 sm:py-10">
          <h1 className="text-2xl font-semibold sm:text-3xl">Offres d&apos;emploi</h1>
          <SearchBar key={filtersKey} defaultQuery={criteria.q} defaultLocation={criteria.lieu} hiddenParams={hiddenParams} className="mt-5 max-w-4xl" />
        </div>
      </div>

      <div className="container-page grid gap-8 py-8 lg:grid-cols-[260px_1fr] lg:py-10">
        <aside className="hidden lg:block" aria-label="Filtres">
          <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pb-6 pr-2">
            <SearchFilters key={filtersKey} criteria={criteria} canUseRadius={canUseRadius} idPrefix="d" />
          </div>
        </aside>

        <section aria-labelledby="results-title" className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="results-title" className="text-base font-semibold" aria-live="polite">
                {result.total} offre{result.total > 1 ? "s" : ""}
                {result.place.kind !== "none" && (
                  <span className="font-normal text-ink-muted">
                    {" "}
                    · {result.place.label}
                    {criteria.rayon && canUseRadius ? ` + ${criteria.rayon} km` : ""}
                  </span>
                )}
              </h2>
              {result.pageCount > 1 && (
                <p className="text-xs text-ink-subtle">
                  Page {result.page} sur {result.pageCount}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <MobileFilters key={filtersKey} criteria={criteria} canUseRadius={canUseRadius} activeCount={activeCount} />
              <SortSelect criteria={criteria} canSortByDistance={canUseRadius} />
            </div>
          </div>

          <div className="mt-4">
            <ActiveFilters criteria={criteria} />
          </div>

          {result.placeFallback && (
            <Callout tone="warning" className="mt-4">
              Nous n&apos;avons pas reconnu « {criteria.lieu} » parmi les communes d&apos;Île-de-France : recherche par nom de ville
              uniquement, sans rayon.
            </Callout>
          )}
          {hasDemo && (
            <Callout tone="warning" className="mt-4">
              Les offres affichées sont <strong>fictives</strong> et servent uniquement à présenter l&apos;interface. Elles ne
              correspondent à aucun poste réel.
            </Callout>
          )}

          <div className="mt-6">
            {result.total === 0 ? (
              <EmptyState
                icon={<SearchX />}
                title="Aucune offre ne correspond"
                description="Retirez un filtre, élargissez le rayon ou essayez un autre mot-clé."
                action={
                  <ButtonLink href="/offres" variant="secondary">
                    Réinitialiser la recherche
                  </ButtonLink>
                }
              />
            ) : (
              <ol className="grid gap-4 md:grid-cols-2">
                {result.items.map((o) => (
                  <li key={o.id} className="flex">
                    <JobCard offer={o} distanceKm={o.distanceKm} className="w-full" />
                  </li>
                ))}
              </ol>
            )}
          </div>

          <Pagination criteria={criteria} page={result.page} pageCount={result.pageCount} />
        </section>
      </div>
    </>
  );
}
