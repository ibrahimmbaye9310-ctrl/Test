import type { Metadata } from "next";
import { getAuditLog } from "@/lib/admin/queries";
import { AdminHeader } from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "Journal" };
const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" });
const LABELS: Record<string, string> = {
  "offer.approve": "Offre validée", "offer.reject": "Offre refusée", "offer.close": "Offre retirée", "offer.delete": "Offre supprimée",
  "company.verify": "Entreprise vérifiée", "company.unverify": "Vérification retirée", "user.suspend": "Compte suspendu", "user.unsuspend": "Compte réactivé",
  "user.delete": "Compte supprimé", "report.reviewing": "Signalement pris en charge", "report.resolved": "Signalement traité", "report.dismissed": "Signalement sans suite",
  "testimonial.create": "Avis ajouté", "testimonial.publish": "Avis publié", "testimonial.unpublish": "Avis dépublié", "testimonial.delete": "Avis supprimé",
};

export default async function AuditPage() {
  const rows = await getAuditLog();
  return (
    <div className="space-y-6">
      <AdminHeader title="Journal d'administration" description="Trace non modifiable de chaque action effectuée depuis cet espace." />
      <div className="overflow-x-auto rounded-card bg-surface shadow-card ring-1 ring-line">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-subtle"><tr><th className="px-4 py-3 font-medium">Date</th><th className="px-3 py-3 font-medium">Action</th><th className="px-3 py-3 font-medium">Détail</th><th className="px-4 py-3 font-medium">Par</th></tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => {
              const d = r.details as Record<string, unknown>;
              const detail = [d.title, d.name, d.author, d.reason, d.note].filter((x) => typeof x === "string" && x).join(" · ");
              return (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-ink-muted">{fmt.format(new Date(r.created_at))}</td>
                  <td className="px-3 py-3 font-medium">{LABELS[r.action] ?? r.action}</td>
                  <td className="px-3 py-3 text-ink-muted">{detail || `${r.target_type} ${r.target_id.slice(0, 8)}`}</td>
                  <td className="px-4 py-3">{r.adminName}</td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-ink-muted">Aucune action enregistrée.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
