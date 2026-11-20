import "server-only";
import type Stripe from "stripe";
import { billingClient } from "./db";
import { planFromPrice, stripe } from "@/lib/stripe/server";
import { emailBilling } from "@/lib/email/notify";

type Db = ReturnType<typeof billingClient>;
const idOf = (x: string | { id: string } | null | undefined) => (typeof x === "string" ? x : x?.id ?? null);

async function must<T>(p: PromiseLike<{ data: T; error: { message: string } | null }>) {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data;
}

/** Données d'abonnement utiles, quelle que soit la version de l'API Stripe (période au niveau de l'item). */
export function subscriptionFields(sub: Stripe.Subscription) {
  const item = sub.items.data[0];
  const periodEnd = (item as { current_period_end?: number } | undefined)?.current_period_end ?? (sub as unknown as { current_period_end?: number }).current_period_end;
  return {
    plan: planFromPrice(item?.price.id),
    status: sub.status,
    periodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end || Boolean(sub.cancel_at),
  };
}

async function syncSubscription(db: Db, sub: Stripe.Subscription) {
  const f = subscriptionFields(sub);
  return must(
    db.rpc("billing_sync_subscription", {
      customer: idOf(sub.customer)!,
      subscription: sub.id,
      new_plan: f.plan ?? "",
      new_status: f.status,
      period_end: f.periodEnd!,
      cancel_at_end: f.cancelAtPeriodEnd,
    }),
  );
}

const PLAN_LABEL = { starter: "Starter", pro: "Pro" } as const;

/** Traite un événement Stripe vérifié. Idempotent : un événement déjà traité est ignoré. */
export async function handleStripeEvent(event: Stripe.Event): Promise<"processed" | "duplicate" | "ignored"> {
  const db = billingClient();
  const handled = ["checkout.session.completed", "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted", "invoice.paid", "invoice.payment_failed"];
  if (!handled.includes(event.type)) return "ignored";
  const first = await must(db.rpc("billing_event_first_seen", { event_id: event.id, event_type: event.type }));
  if (!first) return "duplicate";

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object;
        const company = s.metadata?.company_id;
        if (!company) break;
        if (s.mode === "payment" && s.payment_status === "paid" && s.metadata?.kind === "single_offer") {
          await must(db.rpc("billing_grant_credit", { company, reference: s.id }));
          await must(db.rpc("billing_record_payment", { company, payment_kind: "single_offer", reference: s.id, amount: s.amount_total ?? 0, cur: s.currency ?? "eur", payment_status: "succeeded", label: "Annonce à l'unité (30 jours)" }));
          await must(db.rpc("billing_notify", { company, kind: "single", title: "Paiement confirmé : 1 annonce à l'unité", body: "Votre crédit est disponible : publiez votre annonce pour 30 jours." }));
          await emailBilling(company, { kind: "single_offer" });
        }
        if (s.mode === "subscription" && s.subscription) {
          const sub = await stripe().subscriptions.retrieve(idOf(s.subscription)!);
          await syncSubscription(db, sub);
          const plan = subscriptionFields(sub).plan;
          await must(db.rpc("billing_notify", { company, kind: "subscription", title: `Abonnement ${plan ? PLAN_LABEL[plan] : ""} activé`, body: "Merci ! Votre formule est active : vous pouvez publier vos offres." }));
          if (plan) await emailBilling(company, { kind: "subscription_activated", plan });
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const company = await syncSubscription(db, sub);
        if (event.type === "customer.subscription.deleted" && company) {
          await must(db.rpc("billing_notify", { company, kind: "subscription", title: "Abonnement terminé", body: "Votre formule a pris fin. Vos annonces en ligne restent visibles jusqu'à leur expiration." }));
          await emailBilling(company, { kind: "ended" });
        }
        break;
      }
      case "invoice.paid":
      case "invoice.payment_failed": {
        const inv = event.data.object;
        const company = await must(db.rpc("billing_company_of", { customer: idOf(inv.customer)! }));
        if (!company || !inv.id) break;
        const ok = event.type === "invoice.paid";
        // Libellé en français (la description de Stripe est générée en anglais).
        const line = inv.lines.data[0] as { pricing?: { price_details?: { price?: string } }; price?: { id: string } | null } | undefined;
        const plan = planFromPrice(line?.pricing?.price_details?.price ?? line?.price?.id);
        const label = plan ? `Abonnement ${PLAN_LABEL[plan]} (mensuel)` : "Abonnement Kairo";
        await must(db.rpc("billing_record_payment", { company, payment_kind: "subscription", reference: inv.id, amount: ok ? inv.amount_paid : inv.amount_due, cur: inv.currency, payment_status: ok ? "succeeded" : "failed", label }));
        if (!ok) {
          await must(db.rpc("billing_notify", { company, kind: "subscription", title: "Échec du paiement de votre abonnement", body: "Mettez à jour votre moyen de paiement depuis la page Abonnement pour conserver votre formule." }));
          await emailBilling(company, { kind: "payment_failed", amountCents: inv.amount_due });
        } else if (inv.billing_reason === "subscription_cycle") {
          await must(db.rpc("billing_notify", { company, kind: "subscription", title: "Abonnement renouvelé", body: "Le paiement de votre abonnement a bien été reçu. Merci !" }));
          await emailBilling(company, { kind: "renewed", plan, amountCents: inv.amount_paid });
        }
        break;
      }
    }
    return "processed";
  } catch (e) {
    // Échec : on retire la marque « traité » pour que le renvoi automatique de Stripe soit pris en compte.
    await db.rpc("billing_event_forget", { event_id: event.id });
    throw e;
  }
}
