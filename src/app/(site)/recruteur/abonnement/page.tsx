import type { Metadata } from "next";
import { Check } from "lucide-react";
import { requireCompany } from "@/lib/recruiter/queries";
import { PLANS, PLAN_ORDER } from "@/lib/config/plans";
import { Callout } from "@/components/ui/misc";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Abonnement" };

/** Paiement Stripe et application des limites par formule : phase 7. */
export default async function SubscriptionPage() {
  await requireCompany("/recruteur/abonnement");
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">Abonnement</h1>
        <p className="mt-1.5 text-ink-muted">Formule actuelle : <strong className="text-navy-950">période de lancement</strong>, publication libre.</p>
      </header>
      <Callout>
        Le paiement en ligne (Stripe) ouvre prochainement. Vous pourrez alors choisir une formule, en changer ou la résilier
        depuis cette page. Aucun paiement ne vous sera demandé sans votre accord.
      </Callout>
      <ul className="grid gap-4 md:grid-cols-3">
        {PLAN_ORDER.map((id) => {
          const p = PLANS[id];
          return (
            <li key={id} className="rounded-card bg-surface p-5 shadow-card ring-1 ring-line">
              <p className="font-semibold">{p.name}</p>
              <p className="mt-1 text-2xl font-semibold">{formatPrice(p.priceCents)} <span className="text-sm font-normal text-ink-muted">HT {p.interval === "month" ? "/ mois" : "/ annonce"}</span></p>
              <ul className="mt-4 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-electric-500" aria-hidden />{f}</li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
