import type { Metadata } from "next";
import Link from "next/link";
import { FilePlus2, FileText } from "lucide-react";
import { getMyOffers, requireCompany } from "@/lib/recruiter/queries";
import { displayOfferStatus } from "@/lib/config/offer-status";
import { CONTRACT_TYPES, labelOf } from "@/lib/config/taxonomy";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Callout, EmptyState } from "@/components/ui/misc";
import { formatRelativeDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Mes offres" };

export default async function RecruiterOffersPage({ searchParams }: { searchParams: Promise<{ supprimee?: string }> }) {
  const { supprimee } = await searchParams;
  const { company } = await requireCompany("/recruteur/offres");
  const offers = await getMyOffers(company.id);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Mes offres</h1>
          <p className="mt-1.5 text-ink-muted">{offers.filter((o) => o.status === "published" && !o.isExpired).length} en ligne · {offers.length} au total</p>
        </div>
        <ButtonLink href="/recruteur/offres/nouvelle"><FilePlus2 aria-hidden /> Nouvelle offre</ButtonLink>
      </header>
      {supprimee && <Callout>Offre supprimée.</Callout>}
      {offers.length === 0 ? (
        <EmptyState icon={<FileText />} title="Aucune offre pour l'instant" description="Publiez votre première offre : elle sera visible immédiatement dans la recherche." action={<ButtonLink href="/recruteur/offres/nouvelle">Créer une offre</ButtonLink>} />
      ) : (
        <div className="overflow-x-auto rounded-card bg-surface shadow-card ring-1 ring-line">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-subtle">
              <tr>
                <th className="px-5 py-3 font-medium">Offre</th>
                <th className="px-3 py-3 font-medium">Statut</th>
                <th className="px-3 py-3 text-right font-medium">Vues</th>
                <th className="px-3 py-3 text-right font-medium">Candidatures</th>
                <th className="px-5 py-3 text-right font-medium">Mise à jour</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {offers.map((o) => {
                const st = displayOfferStatus(o.status, o.expires_at);
                return (
                  <tr key={o.id} className="hover:bg-navy-50/40">
                    <td className="px-5 py-3.5">
                      <Link href={`/recruteur/offres/${o.id}`} className="font-medium text-navy-950 hover:text-electric-600">{o.title}</Link>
                      <p className="text-xs text-ink-muted">{labelOf(CONTRACT_TYPES, o.contract_type)} · {o.city}</p>
                    </td>
                    <td className="px-3 py-3.5"><Badge tone={st.tone}>{st.label}</Badge></td>
                    <td className="px-3 py-3.5 text-right tabular-nums">{o.views_count}</td>
                    <td className="px-3 py-3.5 text-right tabular-nums">
                      {o.applicationsCount}
                      {o.newApplications > 0 && <span className="ml-1.5 rounded-full bg-electric-500 px-1.5 text-[11px] font-semibold text-white">{o.newApplications} nouv.</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right text-ink-muted">{formatRelativeDate(o.updated_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
