import type { Metadata } from "next";
import Link from "next/link";
import { Flag } from "lucide-react";
import { getReports } from "@/lib/admin/queries";
import { AdminHeader, Tabs } from "@/components/admin/admin-ui";
import { ModerateOfferButtons, ReportButtons } from "@/components/admin/admin-actions";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { REPORT_REASONS } from "@/lib/config/reports";
import { formatRelativeDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Signalements" };
const STATUSES = [
  { value: "open", label: "Nouveaux" },
  { value: "reviewing", label: "En cours" },
  { value: "resolved", label: "Traités" },
  { value: "dismissed", label: "Sans suite" },
];

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const { statut } = await searchParams;
  const status = STATUSES.some((s) => s.value === statut) ? statut! : "open";
  const reports = await getReports(status);
  return (
    <div className="space-y-6">
      <AdminHeader title="Signalements" description="Annonces signalées par les utilisateurs. Retirez ou refusez les annonces frauduleuses." />
      <Tabs current={status} items={STATUSES.map((s) => ({ ...s, href: `/admin/signalements?statut=${s.value}` }))} />
      {reports.length === 0 ? (
        <EmptyState icon={<Flag />} title="Aucun signalement" description="Rien dans cette catégorie." />
      ) : (
        <ul className="space-y-3">
          {reports.map((r) => (
            <li key={r.id} className="rounded-card bg-surface p-5 shadow-card ring-1 ring-line">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Badge tone="danger">{REPORT_REASONS.find((x) => x.value === r.reason)?.label ?? r.reason}</Badge>
                  {r.offer ? (
                    <p className="mt-2 font-semibold text-navy-950">
                      <Link href={`/admin/offres/${r.offer.id}`} className="hover:text-electric-600">{r.offer.title}</Link>
                      <span className="font-normal text-ink-muted"> · {r.offer.companies?.name} · offre {r.offer.status === "published" ? "en ligne" : r.offer.status}</span>
                    </p>
                  ) : (
                    <p className="mt-2 text-ink-muted">Offre supprimée</p>
                  )}
                  {r.details && <p className="mt-2 whitespace-pre-line text-sm text-navy-800">« {r.details} »</p>}
                  <p className="mt-1 text-xs text-ink-subtle">Signalé {formatRelativeDate(r.created_at).toLowerCase()}{r.admin_note && ` · note : ${r.admin_note}`}</p>
                </div>
              </div>
              {(status === "open" || status === "reviewing") && (
                <div className="mt-4 grid gap-4 border-t border-line pt-4 lg:grid-cols-2">
                  <div><p className="mb-2 text-xs font-semibold uppercase text-ink-subtle">Signalement</p><ReportButtons reportId={r.id} status={r.status} /></div>
                  {r.offer && <div><p className="mb-2 text-xs font-semibold uppercase text-ink-subtle">Annonce</p><ModerateOfferButtons offerId={r.offer.id} status={r.offer.status} /></div>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
