export const siteConfig = {
  name: "JobFinder",
  tagline: "Le bon job, au bon moment.",
  description:
    "JobFinder met en relation étudiants, candidats en CDD, CDI ou temps partiel et entreprises qui recrutent en Île-de-France.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "fr_FR",
  launchRegion: "Île-de-France",
  contactEmail: "contact@jobfinder.fr",
} as const;

/**
 * Offres de démonstration (fictives) : uniquement si NEXT_PUBLIC_ENABLE_DEMO_DATA vaut exactement "true".
 * Désactivées par défaut — et toujours en production Vercel — pour qu'aucune offre fictive ne soit publiée par oubli.
 */
export const demoDataEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA === "true" && process.env.NEXT_PUBLIC_VERCEL_ENV !== "production";

export const mainNav = [
  { href: "/offres", label: "Offres d'emploi" },
  { href: "/entreprises", label: "Entreprises" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/#faq", label: "FAQ" },
] as const;
