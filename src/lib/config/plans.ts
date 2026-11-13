/**
 * Source unique de vérité pour les formules recruteurs.
 * Les prix sont en centimes. Les limites sont appliquées côté serveur (phase 7).
 * Les identifiants de prix Stripe sont lus depuis l'environnement, jamais codés en dur.
 */
export type PlanId = "starter" | "pro" | "single";

export type Plan = {
  id: PlanId;
  name: string;
  priceCents: number;
  interval: "month" | "one_time";
  maxActiveOffers: number;
  featuredOffers: boolean;
  advancedStats: boolean;
  description: string;
  features: string[];
  highlighted?: boolean;
};

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    priceCents: 2900,
    interval: "month",
    maxActiveOffers: 3,
    featuredOffers: false,
    advancedStats: false,
    description: "Pour les petites structures qui recrutent régulièrement.",
    features: ["3 annonces actives maximum", "Gestion des candidatures", "Profil entreprise", "Statistiques essentielles"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceCents: 5900,
    interval: "month",
    maxActiveOffers: 10,
    featuredOffers: true,
    advancedStats: true,
    description: "Pour les équipes qui recrutent en continu.",
    features: [
      "10 annonces actives maximum",
      "Mise en avant des annonces",
      "Statistiques avancées",
      "Gestion des candidatures",
      "Profil entreprise",
    ],
    highlighted: true,
  },
  single: {
    id: "single",
    name: "Annonce à l'unité",
    priceCents: 990,
    interval: "one_time",
    maxActiveOffers: 1,
    featuredOffers: false,
    advancedStats: false,
    description: "Un besoin ponctuel, sans engagement.",
    features: ["1 annonce publiée 30 jours", "Gestion des candidatures", "Sans abonnement"],
  },
};

export const PLAN_ORDER: PlanId[] = ["starter", "pro", "single"];
