import { Hero } from "@/components/landing/hero";
import { Categories } from "@/components/landing/categories";
import { LatestOffers } from "@/components/landing/latest-offers";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ForCompanies } from "@/components/landing/for-companies";
import { Pricing } from "@/components/landing/pricing";
import { Testimonials } from "@/components/landing/testimonials";
import { Faq, FAQ_ITEMS } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";
import { getLatestOffers } from "@/lib/jobs/queries";
import { getApprovedTestimonials } from "@/lib/testimonials";
import { safeJsonLd } from "@/lib/seo/job-posting";
import { siteConfig } from "@/lib/config/site";

// Les dates relatives ("il y a 2 jours") sont recalculées toutes les heures.
export const revalidate = 3600;

export default async function HomePage() {
  const [offers, testimonials] = await Promise.all([getLatestOffers(6), getApprovedTestimonials()]);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };

  // Organisation + moteur de recherche interne (affichage possible d'un champ de recherche dans Google).
  const siteJsonLd = [
    { "@context": "https://schema.org", "@type": "Organization", name: siteConfig.name, url: siteConfig.url, logo: `${siteConfig.url}/icon.svg`, email: siteConfig.contactEmail, areaServed: "Île-de-France" },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
      inLanguage: "fr-FR",
      potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${siteConfig.url}/offres?q={search_term_string}` }, "query-input": "required name=search_term_string" },
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(siteJsonLd) }} />
      <Hero />
      <Categories />
      <LatestOffers offers={offers} />
      <HowItWorks />
      <ForCompanies />
      <Pricing />
      <Testimonials items={testimonials} />
      <Faq />
      <FinalCta />
    </>
  );
}
