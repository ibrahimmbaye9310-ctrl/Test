import type { JobOfferSummary } from "@/types/job";

const num = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
const PERIOD = { hour: "/h", month: "/mois", year: "/an" } as const;

/** "1 900 – 2 150 € brut/mois", "12,2 € brut/h" ou null si non renseigné. */
export function formatSalary(o: Pick<JobOfferSummary, "salaryMin" | "salaryMax" | "salaryPeriod">) {
  if (o.salaryMin == null || !o.salaryPeriod) return null;
  const range = o.salaryMax && o.salaryMax !== o.salaryMin ? `${num.format(o.salaryMin)} – ${num.format(o.salaryMax)}` : num.format(o.salaryMin);
  return `${range} € brut${PERIOD[o.salaryPeriod]}`;
}
