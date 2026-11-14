import type { Metadata } from "next";
import { getBilling } from "@/lib/admin/queries";
import { AdminHeader } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { Callout } from "@/components/ui/misc";
import { formatPrice, formatRelativeDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Abonnements" };
const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export default async function BillingAdminPage() {
  const { subscriptions, payments } = await getBilling();
  return (
    <div className="space-y-8">
      <AdminHeader title="Abonnements et paiements" description="Données synchronisées depuis Stripe. Aucune donnée bancaire n'est stockée." />
      {subscriptions.length === 0 && payments.length === 0 && <Callout>Aucun abonnement pour l&apos;instant. Ils apparaîtront ici dès l&apos;activation de Stripe.</Callout>}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Abonnements ({subscriptions.length})</h2>
        <div className="overflow-x-auto rounded-card bg-surface shadow-card ring-1 ring-line">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-subtle"><tr><th className="px-4 py-3 font-medium">Entreprise</th><th className="px-3 py-3 font-medium">Formule</th><th className="px-3 py-3 font-medium">Statut</th><th className="px-4 py-3 font-medium">Échéance</th></tr></thead>
            <tbody className="divide-y divide-line">
              {subscriptions.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium">{(s.companies as unknown as { name: string } | null)?.name ?? "—"}</td>
                  <td className="px-3 py-3 capitalize">{s.plan ?? "—"}</td>
                  <td className="px-3 py-3"><Badge tone={s.status === "active" ? "success" : s.status === "past_due" ? "warning" : "neutral"}>{s.status ?? "—"}</Badge>{s.cancel_at_period_end && <span className="ml-2 text-xs text-ink-subtle">résiliation programmée</span>}</td>
                  <td className="px-4 py-3 text-ink-muted">{s.current_period_end ? dateFmt.format(new Date(s.current_period_end)) : "—"}</td>
                </tr>
              ))}
              {subscriptions.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-ink-muted">Aucun abonnement.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Paiements ({payments.length})</h2>
        <div className="overflow-x-auto rounded-card bg-surface shadow-card ring-1 ring-line">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-subtle"><tr><th className="px-4 py-3 font-medium">Date</th><th className="px-3 py-3 font-medium">Entreprise</th><th className="px-3 py-3 font-medium">Type</th><th className="px-3 py-3 text-right font-medium">Montant</th><th className="px-4 py-3 font-medium">Statut</th></tr></thead>
            <tbody className="divide-y divide-line">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-ink-muted">{formatRelativeDate(p.created_at)}</td>
                  <td className="px-3 py-3">{(p.companies as unknown as { name: string } | null)?.name ?? "—"}</td>
                  <td className="px-3 py-3">{p.kind === "subscription" ? "Abonnement" : "Annonce à l'unité"}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{formatPrice(p.amount_cents)}</td>
                  <td className="px-4 py-3"><Badge tone={p.status === "succeeded" ? "success" : p.status === "failed" ? "danger" : "neutral"}>{p.status}</Badge></td>
                </tr>
              ))}
              {payments.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-ink-muted">Aucun paiement.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
