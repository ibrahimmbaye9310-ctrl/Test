import type { JobOffer } from "@/types/job";
import { siteConfig } from "@/lib/config/site";

const EMPLOYMENT_TYPE: Record<JobOffer["contractType"], string> = {
  cdi: "FULL_TIME",
  cdd: "TEMPORARY",
  interim: "TEMPORARY",
  alternance: "INTERN",
  stage: "INTERN",
};
const UNIT = { hour: "HOUR", month: "MONTH", year: "YEAR" } as const;

/**
 * Données structurées schema.org/JobPosting (Google for Jobs).
 * Retourne null pour toute offre fictive : Google interdit le balisage d'offres qui ne sont pas réelles.
 */
export function jobPostingJsonLd(o: JobOffer) {
  if (o.isDemo) return null;
  const description = [
    `<p>${o.shortDescription}</p>`,
    o.missions.length ? `<p><strong>Missions</strong></p><ul>${o.missions.map((m) => `<li>${m}</li>`).join("")}</ul>` : "",
    o.profile.length ? `<p><strong>Profil</strong></p><ul>${o.profile.map((m) => `<li>${m}</li>`).join("")}</ul>` : "",
  ].join("");
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: o.title,
    description,
    datePosted: o.publishedAt,
    validThrough: o.validThrough,
    employmentType: o.workTime === "part_time" ? [EMPLOYMENT_TYPE[o.contractType], "PART_TIME"] : EMPLOYMENT_TYPE[o.contractType],
    identifier: { "@type": "PropertyValue", name: o.companyName, value: o.id },
    hiringOrganization: { "@type": "Organization", name: o.companyName, ...(o.companyLogoUrl && { logo: o.companyLogoUrl }) },
    jobLocation: {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: o.city, postalCode: o.postalCode, addressRegion: "Île-de-France", addressCountry: "FR" },
    },
    ...(o.remote === "full" && { jobLocationType: "TELECOMMUTE", applicantLocationRequirements: { "@type": "Country", name: "FR" } }),
    ...(o.salaryMin != null &&
      o.salaryPeriod && {
        baseSalary: {
          "@type": "MonetaryAmount",
          currency: "EUR",
          value: { "@type": "QuantitativeValue", minValue: o.salaryMin, maxValue: o.salaryMax ?? o.salaryMin, unitText: UNIT[o.salaryPeriod] },
        },
      }),
    url: `${siteConfig.url}/offres/${o.slug}`,
  };
}

/** Sérialise sans permettre de fermer la balise <script> (injection HTML). */
export function safeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
