"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { getMyCompany } from "@/lib/recruiter/queries";
import { siteConfig } from "@/lib/config/site";
import { PRICE_IDS, isStripeConfigured, stripe } from "@/lib/stripe/server";
import { billingClient } from "./db";
import type { ActionState } from "@/lib/validation/common";

type Purchase = "starter" | "pro" | "single";

async function recruiterCompany() {
  const user = await requireUser(["recruiter"], "/recruteur/abonnement");
  const company = await getMyCompany(user.id);
  if (!company) redirect("/recruteur/entreprise");
  return { user, company };
}

/** Client Stripe de l'entreprise : réutilisé s'il existe, créé sinon (rattaché via le webhook-safe billing_link_customer). */
async function ensureCustomer(company: { id: string; name: string }, email: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("subscriptions").select("stripe_customer_id").eq("company_id", company.id).maybeSingle();
  if (data?.stripe_customer_id) return data.stripe_customer_id;
  const customer = await stripe().customers.create(
    { email, name: company.name, metadata: { company_id: company.id } },
    { idempotencyKey: `customer-${company.id}` },
  );
  const { error } = await billingClient().rpc("billing_link_customer", { company: company.id, customer: customer.id });
  if (error) throw new Error(error.message);
  return customer.id;
}

/** Démarre un paiement sur la page sécurisée de Stripe (aucune donnée bancaire ne transite par JobFinder). */
export async function startCheckoutAction(purchase: Purchase): Promise<ActionState> {
  const { user, company } = await recruiterCompany();
  if (!isStripeConfigured || !PRICE_IDS[purchase]) return { error: "Le paiement en ligne n'est pas encore activé. Réessayez plus tard." };
  const supabase = await createClient();
  const { data: summary } = await supabase.rpc("my_billing_summary");
  if (purchase !== "single" && summary?.plan) return { error: "Vous avez déjà un abonnement : changez de formule depuis « Gérer mon abonnement »." };

  let url: string | null;
  try {
    const customer = await ensureCustomer(company, user.email);
    const session = await stripe().checkout.sessions.create({
      mode: purchase === "single" ? "payment" : "subscription",
      customer,
      line_items: [{ price: PRICE_IDS[purchase], quantity: 1 }],
      locale: "fr",
      allow_promotion_codes: true,
      billing_address_collection: "required",
      customer_update: { address: "auto", name: "auto" },
      tax_id_collection: { enabled: true },
      automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX === "true" },
      metadata: { company_id: company.id, kind: purchase === "single" ? "single_offer" : "subscription" },
      ...(purchase !== "single" && { subscription_data: { metadata: { company_id: company.id } } }),
      ...(purchase === "single" && { invoice_creation: { enabled: true } }),
      success_url: `${siteConfig.url}/recruteur/abonnement?paiement=ok`,
      cancel_url: `${siteConfig.url}/recruteur/abonnement?paiement=annule`,
    });
    url = session.url;
  } catch (e) {
    console.error("[checkout]", e instanceof Error ? e.message : e);
    return { error: "Impossible d'ouvrir la page de paiement. Réessayez dans un instant." };
  }
  if (!url) return { error: "Impossible d'ouvrir la page de paiement." };
  redirect(url);
}

/** Portail client Stripe : changer de formule, moyen de paiement, factures, résiliation. */
export async function openBillingPortalAction(): Promise<ActionState> {
  const { company } = await recruiterCompany();
  if (!isStripeConfigured) return { error: "Le paiement en ligne n'est pas encore activé." };
  const supabase = await createClient();
  const { data } = await supabase.from("subscriptions").select("stripe_customer_id").eq("company_id", company.id).maybeSingle();
  if (!data?.stripe_customer_id) return { error: "Aucun abonnement à gérer pour l'instant." };
  let url: string;
  try {
    url = (await stripe().billingPortal.sessions.create({ customer: data.stripe_customer_id, return_url: `${siteConfig.url}/recruteur/abonnement`, locale: "fr" })).url;
  } catch (e) {
    console.error("[portal]", e instanceof Error ? e.message : e);
    return { error: "Impossible d'ouvrir l'espace de gestion. Réessayez dans un instant." };
  }
  redirect(url);
}
