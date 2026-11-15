import type { Metadata } from "next";
import { Check, CreditCard } from "lucide-react";
import { requireCompany } from "@/lib/recruiter/queries";
import { createClient } from "@/lib/supabase/server";
import { PLANS } from "@/lib/config/plans";
import { isStripeConfigured } from "@/lib/stripe/server";
import { CheckoutButton, PortalButton } from "@/components/recruiter/billing-buttons";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Callout } from "@/components/ui/misc";
import { cn, formatPrice, formatRelativeDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Abonnement" };
const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const STATUS: Record<string, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  active: { label: "Actif", tone: "success" }, trialing: { label: "Essai", tone: "success" }, past_due: { label: "Paiement en retard", tone: "warning" },
  unpaid: { label: "Impayé", tone: "danger" }, canceled: { label: "Résilié", tone: "neutral" }, incomplete: { label: "En attente de paiement", tone: "warning" },
  incomplete_expired: { label: "Expiré", tone: "neutral" }, paused: { label: "En pause", tone: "neutral" },
};

export default async function SubscriptionPage({ searchParams }: { searchParams: Promise<{ paiement?: string }> }) {
  const { paiement } = await searchParams;
  const { company } = await requireCompany("/recruteur/abonnement");
  const supabase = await createClient();
  const [{ data: summary }, { data: sub }, { data: payments }] = await Promise.all([
    supabase.rpc("my_billing_summary"),
    supabase.from("subscriptions").select("*").eq("company_id", company.id).maybeSingle(),
    supabase.from("payments").select("*").eq("company_id", company.id).order("created_at", { ascending: false }).limit(20),
  ]);
  const plan = summary?.plan ? PLANS[summary.plan] : null;
  const capacity = (summary?.limit ?? 0) + (summary?.credits_in_use ?? 0) + (summary?.credits_available ?? 0);
  const st = sub?.status ? STATUS[sub.status] : null;
  const active = summary?.active_offers ?? 0;
  // Après une résiliation, les annonces déjà en ligne le restent jusqu'à leur expiration.
  const over = active > capacity;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">Abonnement</h1>
        <p className="mt-1.5 text-ink-muted">Paiements sécurisés par Stripe. JobFinder ne voit ni ne stocke vos données bancaires.</p>
      </header>
      {paiement === "ok" && <Callout>Paiement reçu, merci ! L&apos;activation prend quelques secondes : actualisez la page si votre formule n&apos;apparaît pas encore.</Callout>}
      {paiement === "annule" && <Callout tone="warning">Paiement annulé : aucun montant n&apos;a été débité.</Callout>}
      {!isStripeConfigured && <Callout tone="warning">Le paiement en ligne n&apos;est pas encore activé sur ce site.</Callout>}

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-ink-muted">Formule actuelle</p>
            <p className="mt-1 text-2xl font-semibold">{plan ? plan.name : "Aucune formule"} {st && <Badge tone={st.tone}>{st.label}</Badge>}</p>
            {sub?.current_period_end && plan && (
              <p className="mt-1 text-sm text-ink-muted">
                {sub.cancel_at_period_end ? "Prend fin le" : "Prochain renouvellement le"} {dateFmt.format(new Date(sub.current_period_end))}
              </p>
            )}
          </div>
          {sub?.stripe_customer_id && <PortalButton />}
        </div>
        <div className="mt-6">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium text-navy-900">Annonces actives</span>
            <span className="tabular-nums text-ink-muted">{over ? `${active} en ligne · capacité ${capacity}` : `${active} / ${capacity}`}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-navy-50" role="progressbar" aria-valuenow={summary?.active_offers ?? 0} aria-valuemin={0} aria-valuemax={capacity} aria-label="Annonces actives">
            <div className={cn("h-full rounded-full", (summary?.active_offers ?? 0) >= capacity ? "bg-warning-600" : "bg-electric-500")} style={{ width: `${capacity ? Math.min(100, ((summary?.active_offers ?? 0) / capacity) * 100) : 0}%` }} />
          </div>
          {over && (
            <p className="mt-2 text-xs text-warning-600">
              Vos annonces déjà en ligne restent visibles jusqu&apos;à leur expiration. Pour en publier de nouvelles, choisissez une formule ou achetez une annonce à l&apos;unité.
            </p>
          )}
          <p className="mt-2 text-xs text-ink-subtle">
            {plan ? `${plan.maxActiveOffers} incluses dans votre formule` : "Aucune annonce incluse sans formule"}
            {summary?.credits_available ? ` · ${summary.credits_available} crédit${summary.credits_available > 1 ? "s" : ""} à l'unité disponible${summary.credits_available > 1 ? "s" : ""}` : ""}
            {summary?.credits_in_use ? ` · ${summary.credits_in_use} annonce${summary.credits_in_use > 1 ? "s" : ""} à l'unité en cours` : ""}
          </p>
        </div>
      </Card>

      <section aria-labelledby="plans-title" className="space-y-4">
        <h2 id="plans-title" className="text-lg font-semibold">{plan ? "Formules" : "Choisir une formule"}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {(["starter", "pro", "single"] as const).map((id) => {
            const p = PLANS[id];
            const current = summary?.plan === id;
            return (
              <div key={id} className={cn("flex flex-col rounded-card p-5 ring-1", p.highlighted ? "bg-navy-950 text-white ring-navy-950" : "bg-surface shadow-card ring-line")}>
                <p className="font-semibold">{p.name} {current && <Badge tone="success">Votre formule</Badge>}</p>
                <p className="mt-1 text-2xl font-semibold">{formatPrice(p.priceCents)} <span className={cn("text-sm font-normal", p.highlighted ? "text-navy-300" : "text-ink-muted")}>HT {p.interval === "month" ? "/ mois" : "/ annonce"}</span></p>
                <ul className="mt-4 flex-1 space-y-2 text-sm">
                  {p.features.map((f) => <li key={f} className="flex gap-2"><Check className={cn("mt-0.5 size-4 shrink-0", p.highlighted ? "text-electric-300" : "text-electric-500")} aria-hidden />{f}</li>)}
                </ul>
                <div className="mt-5">
                  {id === "single" ? (
                    <CheckoutButton purchase="single" label="Acheter une annonce" variant={p.highlighted ? "primary" : "secondary"} />
                  ) : current ? (
                    <p className={cn("text-center text-sm", p.highlighted ? "text-navy-300" : "text-ink-muted")}>Formule active</p>
                  ) : summary?.plan ? (
                    <p className={cn("text-center text-xs", p.highlighted ? "text-navy-300" : "text-ink-muted")}>Changez de formule via « Gérer mon abonnement »</p>
                  ) : (
                    <CheckoutButton purchase={id} label={`Choisir ${p.name}`} variant={p.highlighted ? "primary" : "secondary"} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-ink-subtle">Sans engagement : résiliation à tout moment, effective à la fin de la période payée. Factures disponibles dans « Gérer mon abonnement ».</p>
      </section>

      <section aria-labelledby="pay-title" className="space-y-3">
        <h2 id="pay-title" className="text-lg font-semibold">Historique des paiements</h2>
        {payments?.length ? (
          <ul className="divide-y divide-line overflow-hidden rounded-card bg-surface shadow-card ring-1 ring-line">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                <span className="flex items-center gap-2"><CreditCard className="size-4 text-ink-subtle" aria-hidden />{p.description ?? (p.kind === "subscription" ? "Abonnement" : "Annonce à l'unité")}</span>
                <span className="flex items-center gap-3">
                  <span className="text-ink-subtle">{formatRelativeDate(p.created_at)}</span>
                  <span className="tabular-nums font-medium">{formatPrice(p.amount_cents)}</span>
                  <Badge tone={p.status === "succeeded" ? "success" : p.status === "failed" ? "danger" : "neutral"}>{p.status === "succeeded" ? "Payé" : p.status === "failed" ? "Échec" : p.status === "refunded" ? "Remboursé" : "En attente"}</Badge>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-card bg-surface p-5 text-sm text-ink-muted ring-1 ring-line">Aucun paiement pour l&apos;instant.</p>
        )}
      </section>
    </div>
  );
}
