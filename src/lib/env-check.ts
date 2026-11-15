/**
 * Vérification de la configuration au démarrage du serveur (journalisée, sans jamais afficher de valeur).
 * En production, une variable manquante est signalée en erreur avec la fonctionnalité concernée.
 */
const REQUIRED: { name: string; feature: string; alternatives?: string[] }[] = [
  { name: "NEXT_PUBLIC_SITE_URL", feature: "liens des e-mails, plan du site, redirections de paiement" },
  { name: "NEXT_PUBLIC_SUPABASE_URL", feature: "base de données et comptes" },
  { name: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", feature: "base de données et comptes", alternatives: ["NEXT_PUBLIC_SUPABASE_ANON_KEY"] },
  { name: "SUPABASE_SECRET_KEY", feature: "suppression de compte, webhook Stripe, e-mails", alternatives: ["SUPABASE_SERVICE_ROLE_KEY"] },
  { name: "RATE_LIMIT_SECRET", feature: "limitation des tentatives abusives" },
  { name: "STRIPE_SECRET_KEY", feature: "paiements" },
  { name: "STRIPE_WEBHOOK_SECRET", feature: "activation des abonnements" },
  { name: "STRIPE_PRICE_STARTER", feature: "formule Starter" },
  { name: "STRIPE_PRICE_PRO", feature: "formule Pro" },
  { name: "STRIPE_PRICE_SINGLE_OFFER", feature: "annonce à l'unité" },
  { name: "RESEND_API_KEY", feature: "e-mails" },
  { name: "EMAIL_FROM", feature: "expéditeur des e-mails" },
];

export function checkEnvironment() {
  const production = process.env.VERCEL_ENV === "production" || (process.env.NODE_ENV === "production" && !process.env.VERCEL_ENV && process.env.CI !== "true");
  const missing = REQUIRED.filter((v) => !process.env[v.name] && !v.alternatives?.some((a) => process.env[a]));
  const problems: string[] = missing.map((v) => `${v.name} manquante (${v.feature})`);
  if (process.env.VERCEL_ENV === "production") {
    if (process.env.EMAIL_REDIRECT_TO) problems.push("EMAIL_REDIRECT_TO est défini en production : les e-mails n'atteindraient pas leurs destinataires");
    if (process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) problems.push("clé Stripe de TEST en production : aucun paiement réel ne sera encaissé");
    if (process.env.NEXT_PUBLIC_SITE_URL?.includes("localhost")) problems.push("NEXT_PUBLIC_SITE_URL pointe vers localhost");
    if (!process.env.RATE_LIMIT_SECRET || process.env.RATE_LIMIT_SECRET.length < 32) problems.push("RATE_LIMIT_SECRET absente ou trop courte (32 caractères minimum)");
  }
  if (problems.length === 0) return console.info("[config] configuration complète");
  for (const p of problems) (production ? console.error : console.warn)(`[config] ${p}`);
}
