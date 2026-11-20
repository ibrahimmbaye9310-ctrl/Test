import "server-only";
import Stripe from "stripe";

/**
 * Stripe côté serveur uniquement. La clé secrète ne quitte jamais le serveur ; aucune donnée de carte
 * ne transite par Kairo (paiement sur les pages hébergées par Stripe).
 */
export const isStripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);

let client: Stripe | null = null;
export function stripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY manquante.");
  // Client HTTP basé sur fetch : compatible avec tous les environnements (Vercel, proxys d'entreprise).
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY, { appInfo: { name: "Kairo" }, maxNetworkRetries: 2, httpClient: Stripe.createFetchHttpClient() });
  return client;
}

/** Identifiants des prix Stripe (créés par scripts/stripe-setup.mjs), lus depuis l'environnement. */
export const PRICE_IDS = {
  starter: process.env.STRIPE_PRICE_STARTER ?? "",
  pro: process.env.STRIPE_PRICE_PRO ?? "",
  single: process.env.STRIPE_PRICE_SINGLE_OFFER ?? "",
} as const;

export function planFromPrice(priceId: string | null | undefined): "starter" | "pro" | null {
  if (!priceId) return null;
  if (priceId === PRICE_IDS.pro) return "pro";
  if (priceId === PRICE_IDS.starter) return "starter";
  return null;
}
