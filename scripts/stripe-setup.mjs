#!/usr/bin/env node
/**
 * Crée (ou retrouve) les produits, prix et la configuration du portail client JobFinder dans Stripe.
 * Ré-exécutable : les prix sont identifiés par leur « lookup key ».
 *
 * Usage :  STRIPE_SECRET_KEY=sk_test_… node scripts/stripe-setup.mjs
 * Puis copiez les 3 lignes STRIPE_PRICE_… affichées dans .env.local et dans Vercel.
 */
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("Définissez STRIPE_SECRET_KEY (clé secrète Stripe, sk_test_… pour le mode test).");
  process.exit(1);
}
const stripe = new Stripe(key);
const live = key.startsWith("sk_live_");
console.log(`Mode ${live ? "PRODUCTION (live)" : "TEST"}\n`);

const ITEMS = [
  { env: "STRIPE_PRICE_STARTER", lookup: "jobfinder_starter_monthly", product: "JobFinder Starter", description: "3 annonces actives, gestion des candidatures, profil entreprise.", amount: 2900, recurring: { interval: "month" } },
  { env: "STRIPE_PRICE_PRO", lookup: "jobfinder_pro_monthly", product: "JobFinder Pro", description: "10 annonces actives, mise en avant, statistiques avancées.", amount: 5900, recurring: { interval: "month" } },
  { env: "STRIPE_PRICE_SINGLE_OFFER", lookup: "jobfinder_single_offer", product: "JobFinder — Annonce à l'unité", description: "Publication d'une annonce pendant 30 jours.", amount: 990 },
];

const prices = {};
for (const item of ITEMS) {
  const existing = await stripe.prices.list({ lookup_keys: [item.lookup], active: true, limit: 1 });
  let price = existing.data[0];
  if (!price) {
    const product = await stripe.products.create({ name: item.product, description: item.description, metadata: { app: "jobfinder" } });
    price = await stripe.prices.create({
      product: product.id,
      currency: "eur",
      unit_amount: item.amount,
      tax_behavior: "exclusive", // prix affichés HT
      lookup_key: item.lookup,
      ...(item.recurring && { recurring: item.recurring }),
    });
    console.log(`✔ créé    ${item.product} — ${item.amount / 100} € HT`);
  } else {
    console.log(`✔ existant ${item.product}`);
  }
  prices[item.env] = price;
}

// Portail client : changement Starter ↔ Pro, résiliation en fin de période, moyen de paiement, factures.
const configs = await stripe.billingPortal.configurations.list({ is_default: true, limit: 1 });
const features = {
  customer_update: { enabled: true, allowed_updates: ["email", "address", "tax_id", "name"] },
  invoice_history: { enabled: true },
  payment_method_update: { enabled: true },
  subscription_cancel: { enabled: true, mode: "at_period_end", cancellation_reason: { enabled: true, options: ["too_expensive", "unused", "other"] } },
  subscription_update: {
    enabled: true,
    default_allowed_updates: ["price"],
    proration_behavior: "create_prorations",
    products: [
      { product: prices.STRIPE_PRICE_STARTER.product, prices: [prices.STRIPE_PRICE_STARTER.id] },
      { product: prices.STRIPE_PRICE_PRO.product, prices: [prices.STRIPE_PRICE_PRO.id] },
    ],
  },
};
const business_profile = { headline: "JobFinder — gérez votre abonnement" };
if (configs.data[0]) {
  await stripe.billingPortal.configurations.update(configs.data[0].id, { features, business_profile });
  console.log("✔ portail client mis à jour");
} else {
  await stripe.billingPortal.configurations.create({ features, business_profile });
  console.log("✔ portail client configuré");
}

console.log("\nÀ copier dans .env.local et dans Vercel :\n");
for (const [env, price] of Object.entries(prices)) console.log(`${env}=${price.id}`);
