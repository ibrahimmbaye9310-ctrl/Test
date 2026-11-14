import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { getMyOffer, getOfferViews, getReceivedApplications, requireCompany } from "@/lib/recruiter/queries";
import { displayOfferStatus } from "@/lib/config/offer-status";
import { APPLICATION_STATUSES } from "@/lib/config/applications";
import { CONTRACT_TYPES, labelOf } from "@/lib/config/taxonomy";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Callout, EmptyState } from "@/components/ui/misc";
import { OfferActions } from "@/components/recruiter/offer-actions";
import { ViewsChart } from "@/components/recruiter/views-chart";
import { ApplicationList } from "@/components/recruiter/application-list";

export const metadata: Metadata = { title: "Offre" };
const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> };

export default async function RecruiterOfferPage({ params, searchParams }: Props) {
  const { id } = await params;
  const flags = await searchParams;
  const { company } = await requireCompany(`/recruteur/offres/${id}`);
  const offer = await getMyOffer(company.id, id);
  if (!offer) notFound();
  const [views, applications] = await Promise.all([getOfferViews(offer.id), getReceivedApplications(company.id, { offerId: offer.id })]);
  const st = displayOfferStatus(offer.status, offer.expires_at);
  const expired = st.label === "Expirée";
  const views30 = views.reduce((s, d) => s + d.views, 0);
  const rate = offer.views_count > 0 ? Math.round((applications.length / offer.views_count) * 1000) / 10 : null;

  return (
    <div className="space-y-6">
      <Link href="/recruteur/offres" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-navy-950">
        <ArrowLeft className="size-4" aria-hidden /> Mes offres
      </Link>
      {flags.publiee && <Callout>Offre publiée : elle est visible dans la recherche pendant 30 jours.</Callout>}
      {flags.brouillon && <Callout>Brouillon enregistré. Publiez-le quand il est prêt.</Callout>}
      {flags.enregistree && <Callout>Modifications enregistrées.</Callout>}
      {flags.verification && (
        <Callout>Offre envoyée en vérification. Notre équipe la valide sous 24 h ouvrées ; vous serez notifié·e dès sa mise en ligne.</Callout>
      )}
      {offer.status === "rejected" && (
        <Callout tone="warning">
          <strong>Offre refusée par la modération.</strong> {offer.moderation_note ? `Motif : ${offer.moderation_note}` : ""} Elle ne peut pas être republiée ; contactez-nous si besoin.
        </Callout>
      )}

      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={st.tone}>{st.label}</Badge>
          <span className="text-sm text-ink-muted">{labelOf(CONTRACT_TYPES, offer.contract_type)} · {offer.city} ({offer.postal_code})</span>
        </div>
        <h1 className="text-2xl font-semibold sm:text-3xl">{offer.title}</h1>
        {offer.status === "published" && offer.expires_at && (
          <p className="text-sm text-ink-muted">
            {expired ? "A expiré" : "En ligne jusqu'au"} {dateFmt.format(new Date(offer.expires_at))}
            {offer.published_at && ` · publiée le ${dateFmt.format(new Date(offer.published_at))}`}
          </p>
        )}
        <OfferActions offerId={offer.id} slug={offer.slug} status={offer.status} expired={expired} />
      </header>

      <div className="grid gap-4 sm:grid-cols-4">
        <Tile label="Vues totales" value={offer.views_count} />
        <Tile label="Vues (30 jours)" value={views30} />
        <Tile label="Candidatures" value={applications.length} />
        <Tile label="Taux de candidature" value={rate == null ? "—" : `${rate.toLocaleString("fr-FR")} %`} />
      </div>

      <Card className="p-5 sm:p-6">
        <h2 className="font-semibold">Vues des 30 derniers jours</h2>
        <p className="mb-4 text-xs text-ink-subtle">Vos propres consultations ne sont pas comptées.</p>
        <ViewsChart data={views} />
      </Card>

      <section aria-labelledby="apps-title" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="apps-title" className="text-lg font-semibold">Candidatures reçues</h2>
          <div className="flex flex-wrap gap-1.5">
            {APPLICATION_STATUSES.map((s) => {
              const n = applications.filter((a) => a.status === s.value).length;
              return n ? <Badge key={s.value} tone={s.tone}>{s.label} · {n}</Badge> : null;
            })}
          </div>
        </div>
        {applications.length === 0 ? (
          <EmptyState icon={<Users />} title="Pas encore de candidature" description={offer.status === "published" ? "Les candidatures apparaîtront ici dès qu'un candidat postule." : "Publiez l'offre pour commencer à recevoir des candidatures."} />
        ) : (
          <ApplicationList items={applications} showOffer={false} />
        )}
      </section>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-card bg-surface p-4 shadow-card ring-1 ring-line">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums text-navy-950">{value}</p>
    </div>
  );
}
