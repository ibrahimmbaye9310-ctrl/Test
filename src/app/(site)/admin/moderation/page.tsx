import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { getModerationOffers } from "@/lib/admin/queries";
import { AdminHeader, Tabs } from "@/components/admin/admin-ui";
import { ModerateOfferButtons } from "@/components/admin/admin-actions";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { CONTRACT_TYPES, labelOf } from "@/lib/config/taxonomy";
import { formatRelativeDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Modération" };
const STATUSES = [
  { value: "pending", label: "En attente" },
  { value: "published", label: "En ligne" },
  { value: "rejected", label: "Refusées" },
  { value: "closed", label: "Retirées / fermées" },
];

export default async function ModerationPage({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const { statut } = await searchParams;
  const status = STATUSES.some((s) => s.value === statut) ? statut! : "pending";
  const offers = await getModerationOffers(status);
  return (
    <div className="space-y-6">
      <AdminHeader title="Modération des offres" description="Les offres des entreprises non vérifiées attendent votre validation avant d'être publiées." />
      <Tabs current={status} items={STATUSES.map((s) => ({ ...s, href: `/admin/moderation?statut=${s.value}` }))} />
      {offers.length === 0 ? (
        <EmptyState icon={<ShieldCheck />} title="Rien à afficher" description={status === "pending" ? "Aucune offre en attente : tout est à jour." : "Aucune offre dans cette catégorie."} />
      ) : (
        <ul className="space-y-3">
          {offers.map((o) => (
            <li key={o.id} className="rounded-card bg-surface p-5 shadow-card ring-1 ring-line">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/admin/offres/${o.id}`} className="font-semibold text-navy-950 hover:text-electric-600">{o.title}</Link>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {o.company.name} {o.company.is_verified ? <Badge tone="success">Vérifiée</Badge> : <Badge>Non vérifiée</Badge>} · {labelOf(CONTRACT_TYPES, o.contract_type)} · {o.city} ({o.postal_code})
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-navy-800">{o.short_description}</p>
                  <p className="mt-1 text-xs text-ink-subtle">Mise à jour {formatRelativeDate(o.updated_at).toLowerCase()}{o.moderation_note && ` · motif : ${o.moderation_note}`}</p>
                </div>
                {o.openReports > 0 && <Badge tone="danger">{o.openReports} signalement{o.openReports > 1 ? "s" : ""}</Badge>}
              </div>
              <div className="mt-4 border-t border-line pt-4">
                <ModerateOfferButtons offerId={o.id} status={o.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
