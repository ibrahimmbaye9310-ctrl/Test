import type { ContractType, Schedule, Sector, WorkTime } from "@/lib/config/taxonomy";

/** Vue publique d'une offre, telle qu'affichée dans les listes. */
export type JobOfferSummary = {
  id: string;
  slug: string;
  title: string;
  companyName: string;
  companyLogoUrl: string | null;
  city: string;
  postalCode: string;
  contractType: ContractType;
  workTime: WorkTime;
  schedules: Schedule[];
  sector: Sector;
  isStudentFriendly: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPeriod: "hour" | "month" | "year" | null;
  shortDescription: string;
  publishedAt: string;
  isFeatured: boolean;
  /** true = donnée de démonstration fictive, toujours signalée dans l'interface. */
  isDemo: boolean;
};
