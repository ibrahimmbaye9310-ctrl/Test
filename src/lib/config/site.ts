export const siteConfig = {
  name: "Kairo",
  tagline: "Le bon job, au bon moment.",
  description:
    "Kairo met en relation étudiants, candidats en CDD, CDI ou temps partiel et entreprises qui recrutent en Île-de-France.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "fr_FR",
  launchRegion: "Île-de-France",
  contactEmail: "ibrahimmbaye9310@gmail.com",
} as const;

/**
 * Éditeur du site (mentions légales, CGU/CGV, politique de confidentialité).
 * Tant qu'un champ obligatoire est vide, les pages légales affichent un bandeau « à finaliser ».
 * `siret` : à renseigner dès l'immatriculation (obligatoire avant d'encaisser de vrais paiements).
 */
export const publisher = {
  firstName: "",
  lastName: "Mbaye",
  street: "21 rue Malot",
  postalCode: "",
  city: "",
  siret: "" as string,
  /** Micro-entreprise en franchise en base de TVA : mention « TVA non applicable, art. 293 B du CGI ». */
  vatExempt: true,
};

export const publisherName = [publisher.firstName, publisher.lastName].filter(Boolean).join(" ");
export const publisherAddress = [publisher.street, [publisher.postalCode, publisher.city].filter(Boolean).join(" "), "France"].filter(Boolean).join(", ");
export const publisherComplete = Boolean(publisher.firstName && publisher.lastName && publisher.street && publisher.postalCode && publisher.city);

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
