/** Référentiels utilisés par les filtres, les formulaires et la base (valeurs = enums SQL). */

export const CONTRACT_TYPES = [
  { value: "cdi", label: "CDI" },
  { value: "cdd", label: "CDD" },
  { value: "interim", label: "Intérim" },
  { value: "alternance", label: "Alternance" },
  { value: "stage", label: "Stage" },
] as const;

export const WORK_TIMES = [
  { value: "full_time", label: "Temps plein" },
  { value: "part_time", label: "Temps partiel" },
] as const;

export const SCHEDULES = [
  { value: "morning", label: "Matin" },
  { value: "day", label: "Journée" },
  { value: "evening", label: "Soirée" },
  { value: "night", label: "Nuit" },
  { value: "weekend", label: "Week-end" },
] as const;

export const SECTORS = [
  { value: "retail", label: "Commerce & vente" },
  { value: "hospitality", label: "Hôtellerie & restauration" },
  { value: "logistics", label: "Logistique & transport" },
  { value: "tech", label: "Tech & numérique" },
  { value: "health", label: "Santé & social" },
  { value: "admin", label: "Administratif & support" },
  { value: "education", label: "Éducation & animation" },
  { value: "construction", label: "BTP & artisanat" },
  { value: "finance", label: "Banque & finance" },
  { value: "marketing", label: "Marketing & communication" },
] as const;

export const RADIUS_OPTIONS = [5, 10, 20, 30, 50] as const;

export type ContractType = (typeof CONTRACT_TYPES)[number]["value"];
export type WorkTime = (typeof WORK_TIMES)[number]["value"];
export type Schedule = (typeof SCHEDULES)[number]["value"];
export type Sector = (typeof SECTORS)[number]["value"];

export function labelOf<T extends { value: string; label: string }>(list: readonly T[], value: string) {
  return list.find((item) => item.value === value)?.label ?? value;
}
