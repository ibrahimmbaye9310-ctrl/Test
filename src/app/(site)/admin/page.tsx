import type { Metadata } from "next";
import { getAdminStats } from "@/lib/admin/queries";
import { AdminHeader, StatTile } from "@/components/admin/admin-ui";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Vue d'ensemble" };

export default async function AdminOverview() {
  const s = await getAdminStats();
  return (
    <div className="space-y-8">
      <AdminHeader title="Vue d'ensemble" description="Indicateurs en temps réel de la plateforme." />
      {(s.offers_pending > 0 || s.reports_open > 0) && (
        <section aria-labelledby="todo" className="space-y-3">
          <h2 id="todo" className="text-sm font-semibold uppercase tracking-wide text-warning-600">À traiter</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {s.offers_pending > 0 && <StatTile tone="alert" label="Offres en attente de validation" value={s.offers_pending} href="/admin/moderation" />}
            {s.reports_open > 0 && <StatTile tone="alert" label="Signalements ouverts" value={s.reports_open} href="/admin/signalements" />}
          </div>
        </section>
      )}
      <section aria-labelledby="users" className="space-y-3">
        <h2 id="users" className="text-sm font-semibold uppercase tracking-wide text-ink-subtle">Utilisateurs</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <StatTile label="Candidats" value={s.candidates} href="/admin/utilisateurs?role=candidate" />
          <StatTile label="Recruteurs" value={s.recruiters} href="/admin/utilisateurs?role=recruiter" />
          <StatTile label="Inscriptions (30 j)" value={s.signups_30d} />
          <StatTile label="Comptes suspendus" value={s.suspended} />
        </div>
      </section>
      <section aria-labelledby="activity" className="space-y-3">
        <h2 id="activity" className="text-sm font-semibold uppercase tracking-wide text-ink-subtle">Activité</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <StatTile label="Offres en ligne" value={s.offers_published} hint={`${s.offers_total} au total`} href="/admin/moderation?statut=published" />
          <StatTile label="Candidatures" value={s.applications} hint={`${s.applications_30d} sur 30 jours`} />
          <StatTile label="Entreprises" value={s.companies} hint={`${s.verified_companies} vérifiée${s.verified_companies > 1 ? "s" : ""}`} href="/admin/entreprises" />
          <StatTile label="Signalements ouverts" value={s.reports_open} href="/admin/signalements" />
        </div>
      </section>
      <section aria-labelledby="revenue" className="space-y-3">
        <h2 id="revenue" className="text-sm font-semibold uppercase tracking-wide text-ink-subtle">Revenus</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile label="Revenus encaissés (total)" value={formatPrice(s.revenue_cents)} href="/admin/abonnements" />
          <StatTile label="Revenus (30 jours)" value={formatPrice(s.revenue_30d_cents)} />
          <StatTile label="Abonnements actifs" value={s.active_subscriptions} href="/admin/abonnements" />
        </div>
        <p className="text-xs text-ink-subtle">Montants TTC enregistrés par les webhooks Stripe (paiements réussis).</p>
      </section>
    </div>
  );
}
