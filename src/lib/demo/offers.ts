import type { JobOfferSummary } from "@/types/job";

/**
 * ⚠️ DONNÉES DE DÉMONSTRATION — ENTIÈREMENT FICTIVES.
 * Entreprises et postes inventés pour illustrer l'interface.
 * Chaque offre porte isDemo: true et s'affiche avec un badge « Exemple fictif ».
 * Désactivées via NEXT_PUBLIC_ENABLE_DEMO_DATA=false et remplacées par la base Supabase (phase 2/5).
 */
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

type DemoInput = Omit<JobOfferSummary, "isDemo" | "publishedAt" | "companyLogoUrl"> & { ageDays: number };

const raw: DemoInput[] = [
  {
    id: "demo-1", slug: "demo-vendeur-conseil-paris-11", title: "Vendeur·se conseil", companyName: "Maison Exemple (fictif)",
    city: "Paris 11e", postalCode: "75011", contractType: "cdi", workTime: "full_time", schedules: ["day"], sector: "retail",
    isStudentFriendly: false, salaryMin: 1900, salaryMax: 2150, salaryPeriod: "month",
    shortDescription: "Accueil et conseil clients dans une boutique de décoration, gestion des encaissements et mise en rayon.",
    isFeatured: true, ageDays: 0,
  },
  {
    id: "demo-2", slug: "demo-equipier-restauration-boulogne", title: "Équipier·ère de restauration", companyName: "Comptoir Démo (fictif)",
    city: "Boulogne-Billancourt", postalCode: "92100", contractType: "cdd", workTime: "part_time", schedules: ["evening", "weekend"],
    sector: "hospitality", isStudentFriendly: true, salaryMin: 12.2, salaryMax: null, salaryPeriod: "hour",
    shortDescription: "Service en salle et préparation au comptoir, 15 h par semaine, compatible avec un emploi du temps étudiant.",
    isFeatured: false, ageDays: 1,
  },
  {
    id: "demo-3", slug: "demo-preparateur-commandes-roissy", title: "Préparateur·rice de commandes", companyName: "LogiTest (fictif)",
    city: "Roissy-en-France", postalCode: "95700", contractType: "interim", workTime: "full_time", schedules: ["morning"],
    sector: "logistics", isStudentFriendly: false, salaryMin: 1850, salaryMax: 2000, salaryPeriod: "month",
    shortDescription: "Préparation de commandes en entrepôt, CACES 1 apprécié. Mission de 3 mois renouvelable.",
    isFeatured: false, ageDays: 2,
  },
  {
    id: "demo-4", slug: "demo-developpeur-front-alternance-paris", title: "Développeur·se front-end en alternance", companyName: "Studio Fictif",
    city: "Paris 2e", postalCode: "75002", contractType: "alternance", workTime: "full_time", schedules: ["day"], sector: "tech",
    isStudentFriendly: true, salaryMin: null, salaryMax: null, salaryPeriod: null,
    shortDescription: "Intégration d'interfaces React au sein d'une équipe produit de 8 personnes. Rythme 3 semaines / 1 semaine.",
    isFeatured: true, ageDays: 3,
  },
  {
    id: "demo-5", slug: "demo-aide-soignant-nuit-creteil", title: "Aide-soignant·e de nuit", companyName: "Résidence Exemple (fictif)",
    city: "Créteil", postalCode: "94000", contractType: "cdd", workTime: "full_time", schedules: ["night"], sector: "health",
    isStudentFriendly: false, salaryMin: 2100, salaryMax: 2350, salaryPeriod: "month",
    shortDescription: "Accompagnement des résidents la nuit au sein d'une équipe pluridisciplinaire. Diplôme d'État requis.",
    isFeatured: false, ageDays: 4,
  },
  {
    id: "demo-6", slug: "demo-assistant-administratif-saint-denis", title: "Assistant·e administratif·ve", companyName: "Cabinet Démo (fictif)",
    city: "Saint-Denis", postalCode: "93200", contractType: "stage", workTime: "full_time", schedules: ["day"], sector: "admin",
    isStudentFriendly: true, salaryMin: 4.35, salaryMax: null, salaryPeriod: "hour",
    shortDescription: "Stage de 6 mois : gestion des dossiers clients, agenda et suivi de facturation.",
    isFeatured: false, ageDays: 6,
  },
];

export const DEMO_OFFERS: JobOfferSummary[] = raw.map(({ ageDays, ...offer }) => ({
  ...offer,
  companyLogoUrl: null,
  publishedAt: daysAgo(ageDays),
  isDemo: true,
}));
