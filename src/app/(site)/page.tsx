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

// Les dates relatives ("il y a 2 jours") sont recalculées toutes les heures.
export const revalidate = 3600;

export default async function HomePage() {
  const [offers, testimonials] = await Promise.all([getLatestOffers(6), getApprovedTestimonials()]);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
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
