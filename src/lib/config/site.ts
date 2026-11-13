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

/** Les offres de démonstration ne s'affichent jamais si ce flag vaut "false". */
export const demoDataEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA !== "false";

export const mainNav = [
  { href: "/offres", label: "Offres d'emploi" },
  { href: "/entreprises", label: "Entreprises" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/#faq", label: "FAQ" },
] as const;
