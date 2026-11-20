import type { JobOffer } from "@/types/job";
import type { PublicJobOffer } from "@/lib/supabase/database.types";
import { logoUrl } from "@/lib/storage";

/** Ligne SQL (snake_case) → objet de l'interface. */
export function offerFromRow(r: PublicJobOffer): JobOffer {
  const published = r.published_at ?? r.created_at;
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    companyName: r.company_name,
    companyLogoUrl: logoUrl(r.company_logo_path),
    companyDescription: r.company_description ?? "",
    city: r.city,
    postalCode: r.postal_code,
    communeCode: r.commune_code,
    contractType: r.contract_type,
    workTime: r.work_time,
    schedules: r.schedules,
    sector: r.sector,
    isStudentFriendly: r.is_student_friendly,
    salaryMin: r.salary_min == null ? null : Number(r.salary_min),
    salaryMax: r.salary_max == null ? null : Number(r.salary_max),
    salaryPeriod: r.salary_period,
    shortDescription: r.short_description,
    missions: r.missions,
    profile: r.profile,
    benefits: r.benefits,
    hoursPerWeek: r.hours_per_week,
    startDate: null,
    durationMonths: r.duration_months,
    remote: r.remote,
    publishedAt: published,
    validThrough: r.expires_at ?? new Date(new Date(published).getTime() + 30 * 86_400_000).toISOString(),
    isFeatured: r.is_featured,
    isDemo: false,
  };
}
