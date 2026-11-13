import { Check } from "lucide-react";
import { PLANS, PLAN_ORDER } from "@/lib/config/plans";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/misc";
import { cn, formatPrice } from "@/lib/utils";

export function PricingCards({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-5 lg:grid-cols-3", className)}>
      {PLAN_ORDER.map((id) => {
        const plan = PLANS[id];
        return (
          <div
            key={id}
            className={cn(
              "relative flex flex-col rounded-3xl p-7 ring-1",
              plan.highlighted ? "bg-navy-950 text-white shadow-lift ring-navy-950" : "bg-surface shadow-card ring-line",
            )}
          >
            {plan.highlighted && (
              <span className="absolute -top-3 left-7 rounded-full bg-electric-500 px-3 py-1 text-xs font-semibold text-white shadow-glow">
                Recommandé
              </span>
            )}
            <h3 className={cn("text-lg font-semibold", plan.highlighted && "text-white")}>{plan.name}</h3>
            <p className={cn("mt-1.5 text-sm", plan.highlighted ? "text-navy-300" : "text-ink-muted")}>{plan.description}</p>
            <p className="mt-6 flex items-baseline gap-1.5">
              <span className="text-4xl font-semibold tracking-tight">{formatPrice(plan.priceCents)}</span>
              <span className={cn("text-sm", plan.highlighted ? "text-navy-300" : "text-ink-muted")}>
                {plan.interval === "month" ? "HT / mois" : "HT / annonce"}
              </span>
            </p>
            <ul className="mt-7 flex-1 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check className={cn("mt-0.5 size-4 shrink-0", plan.highlighted ? "text-electric-300" : "text-electric-500")} aria-hidden />
                  <span className={plan.highlighted ? "text-navy-100" : "text-navy-800"}>{f}</span>
                </li>
              ))}
            </ul>
            <ButtonLink
              href={`/inscription?role=recruteur&formule=${id}`}
              variant={plan.highlighted ? "primary" : "secondary"}
              size="lg"
              className="mt-8 w-full"
            >
              {plan.interval === "month" ? `Choisir ${plan.name}` : "Publier une annonce"}
            </ButtonLink>
          </div>
        );
      })}
    </div>
  );
}

export function Pricing() {
  return (
    <section id="tarifs" className="border-y border-line bg-surface py-20 sm:py-24" aria-labelledby="pricing-title">
      <div className="container-page">
        <SectionHeading
          align="center"
          eyebrow="Tarifs recruteurs"
          title={<span id="pricing-title">Des formules simples, sans engagement</span>}
          description="Gratuit pour les candidats. Les entreprises choisissent la formule adaptée à leur volume de recrutement, résiliable à tout moment."
        />
        <PricingCards className="mx-auto mt-14 max-w-5xl" />
        <p className="mt-8 text-center text-xs text-ink-subtle">
          Prix hors taxes. Paiement sécurisé par Stripe — JobFinder ne stocke jamais vos données bancaires.
        </p>
      </div>
    </section>
  );
}
