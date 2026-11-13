import type { ContractType, Schedule, Sector, WorkTime } from "@/lib/config/taxonomy";

export type SalaryPeriod = "hour" | "month" | "year";

/** Vue publique d'une offre, telle qu'affichée dans les listes. */
export type JobOfferSummary = {
  id: string;
  slug: string;
  title: string;
  companyName: string;
  companyLogoUrl: string | null;
  city: string;
  postalCode: string;
  /** Code INSEE de la commune : sert au calcul de distance (rayon). */
  communeCode: string | null;
  contractType: ContractType;
  workTime: WorkTime;
  schedules: Schedule[];
  sector: Sector;
  isStudentFriendly: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPeriod: SalaryPeriod | null;
  shortDescription: string;
  publishedAt: string;
  isFeatured: boolean;
  /** true = donnée de démonstration fictive, toujours signalée dans l'interface. */
  isDemo: boolean;
};

/** Offre complète (page détaillée). */
export type JobOffer = JobOfferSummary & {
  missions: string[];
  profile: string[];
  benefits: string[];
  hoursPerWeek: number | null;
  startDate: string | null;
  /** Durée en mois pour CDD, intérim, stage, alternance. */
  durationMonths: number | null;
  remote: "none" | "partial" | "full";
  companyDescription: string;
  validThrough: string;
};
