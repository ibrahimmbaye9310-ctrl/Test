import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { getMyOffers, getReceivedApplications, requireCompany } from "@/lib/recruiter/queries";
import { APPLICATION_STATUSES } from "@/lib/config/applications";
import { EmptyState } from "@/components/ui/misc";
import { ApplicationList } from "@/components/recruiter/application-list";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Candidatures" };

export default async function ReceivedApplicationsPage({ searchParams }: { searchParams: Promise<{ statut?: string; offre?: string }> }) {
  const { statut, offre } = await searchParams;
  const { company } = await requireCompany("/recruteur/candidatures");
  const [all, offers] = await Promise.all([getReceivedApplications(company.id), getMyOffers(company.id)]);
  const status = APPLICATION_STATUSES.some((s) => s.value === statut) ? statut : undefined;
  const offerId = offers.some((o) => o.id === offre) ? offre : undefined;
  const list = all.filter((a) => (!status || a.status === status) && (!offerId || a.offer.id === offerId));
  const href = (s?: string, o?: string) => {
    const sp = new URLSearchParams();
    if (s) sp.set("statut", s);
    if (o) sp.set("offre", o);
    return `/recruteur/candidatures${sp.size ? `?${sp}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">Candidatures</h1>
        <p className="mt-1.5 text-ink-muted">{all.length} candidature{all.length > 1 ? "s" : ""} reçue{all.length > 1 ? "s" : ""} sur vos offres.</p>
      </header>

      <div className="flex flex-col gap-3">
        <nav aria-label="Filtrer par statut" className="-mx-4 overflow-x-auto px-4">
          <ul className="flex gap-2">
            {[{ value: undefined, label: "Toutes" }, ...APPLICATION_STATUSES].map((s) => {
              const n = all.filter((a) => (!s.value || a.status === s.value) && (!offerId || a.offer.id === offerId)).length;
              return (
                <li key={s.label} className="shrink-0">
                  <Link href={href(s.value, offerId)} aria-current={status === s.value ? "page" : undefined} className={cn("inline-flex gap-1.5 rounded-full px-3 py-1.5 text-sm ring-1 transition", status === s.value ? "bg-navy-900 text-white ring-navy-900" : "bg-surface text-navy-700 ring-line-strong hover:ring-navy-300")}>
                    {s.label} <span className="opacity-60">{n}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        {offers.length > 1 && (
          <nav aria-label="Filtrer par offre" className="-mx-4 overflow-x-auto px-4">
            <ul className="flex gap-2">
              {[{ id: undefined, title: "Toutes les offres" }, ...offers].map((o) => (
                <li key={o.id ?? "all"} className="shrink-0">
                  <Link href={href(status, o.id)} aria-current={offerId === o.id ? "page" : undefined} className={cn("inline-flex rounded-lg px-2.5 py-1 text-xs ring-1 transition", offerId === o.id ? "bg-electric-50 text-electric-700 ring-electric-200" : "text-ink-muted ring-line hover:text-navy-900")}>
                    {o.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      {list.length === 0 ? (
        <EmptyState icon={<Users />} title="Aucune candidature" description={all.length ? "Aucune candidature ne correspond à ce filtre." : "Les candidatures à vos offres apparaîtront ici."} />
      ) : (
        <ApplicationList items={list} />
      )}
    </div>
  );
}
