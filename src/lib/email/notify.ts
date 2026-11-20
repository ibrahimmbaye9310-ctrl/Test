import "server-only";
import { billingClient } from "@/lib/billing/db";
import { siteConfig } from "@/lib/config/site";
import { PLANS } from "@/lib/config/plans";
import { formatPrice } from "@/lib/utils";
import { sendEmail } from "./send";
import { templates } from "./templates";

/** Coordonnées lues par le serveur uniquement (fonctions SQL réservées au serveur). */
async function userContact(userId: string) {
  try {
    const { data } = await billingClient().rpc("server_user_contact", { target: userId });
    return data?.[0] ?? null;
  } catch {
    return null;
  }
}

async function companyContact(companyId: string) {
  try {
    const { data } = await billingClient().rpc("server_company_contact", { company: companyId });
    return data?.[0] ?? null;
  } catch {
    return null;
  }
}

const url = (path: string) => `${siteConfig.url}${path}`;
const firstName = (name: string) => name.split(" ")[0] || name;

/** Candidature envoyée : confirmation au candidat + alerte au recruteur. */
export async function emailApplicationSubmitted(d: { applicationId: string; candidateEmail: string; candidateName: string; offerTitle: string; companyId: string; companyName: string }) {
  const recruiter = await companyContact(d.companyId);
  return Promise.all([
    sendEmail(d.candidateEmail, templates.applicationConfirmation({ candidateName: firstName(d.candidateName), offerTitle: d.offerTitle, companyName: d.companyName, url: url("/espace/candidatures") }), "application_confirmation"),
    sendEmail(recruiter?.email, templates.applicationReceived({ recruiterName: firstName(recruiter?.full_name ?? ""), candidateName: d.candidateName, offerTitle: d.offerTitle, url: url(`/recruteur/candidatures/${d.applicationId}`) }), "application_received"),
  ]);
}

/** Changement de statut décidé par le recruteur → candidat. */
export async function emailApplicationStatus(d: { candidateId: string; offerTitle: string; companyName: string; status: string }) {
  const candidate = await userContact(d.candidateId);
  if (!candidate) return { skipped: "candidat introuvable" };
  return sendEmail(candidate.email, templates.applicationStatus({ candidateName: firstName(candidate.full_name), offerTitle: d.offerTitle, companyName: d.companyName, status: d.status, url: url("/espace/candidatures") }), "application_status");
}

type BillingEmail =
  | { kind: "subscription_activated"; plan: "starter" | "pro" }
  | { kind: "single_offer" }
  | { kind: "renewed"; plan: "starter" | "pro" | null; amountCents: number }
  | { kind: "payment_failed"; amountCents: number }
  | { kind: "ended" };

/** E-mails de facturation (webhook Stripe) → responsable de l'entreprise. */
export async function emailBilling(companyId: string, e: BillingEmail) {
  const c = await companyContact(companyId);
  if (!c) return { skipped: "entreprise introuvable" };
  const name = firstName(c.full_name);
  const billing = url("/recruteur/abonnement");
  switch (e.kind) {
    case "subscription_activated":
      return sendEmail(c.email, templates.subscriptionActivated({ name, plan: PLANS[e.plan].name, limit: PLANS[e.plan].maxActiveOffers, url: url("/recruteur/offres/nouvelle") }), "subscription_activated");
    case "single_offer":
      return sendEmail(c.email, templates.singleOfferPurchased({ name, url: url("/recruteur/offres/nouvelle") }), "single_offer");
    case "renewed":
      return sendEmail(c.email, templates.subscriptionRenewed({ name, plan: e.plan ? PLANS[e.plan].name : "Kairo", amount: formatPrice(e.amountCents), url: billing }), "subscription_renewed");
    case "payment_failed":
      return sendEmail(c.email, templates.paymentFailed({ name, amount: formatPrice(e.amountCents), url: billing }), "payment_failed");
    case "ended":
      return sendEmail(c.email, templates.subscriptionEnded({ name, url: billing }), "subscription_ended");
  }
}
