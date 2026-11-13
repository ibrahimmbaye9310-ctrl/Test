import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { PricingCards } from "@/components/landing/pricing";
import { Faq } from "@/components/landing/faq";

export const metadata: Metadata = {
  title: "Tarifs recruteurs",
  description: "Starter 29 € HT/mois, Pro 59 € HT/mois ou annonce à l'unité à 9,90 € HT. Sans engagement. Gratuit pour les candidats.",
  alternates: { canonical: "/tarifs" },
};

export default function PricingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Tarifs"
        title="Recrutez au prix juste"
        description="Gratuit pour les candidats. Pour les entreprises, trois formules claires, sans engagement, résiliables à tout moment."
      />
      <div className="container-page py-16">
        <PricingCards className="mx-auto max-w-5xl" />
        <p className="mt-8 text-center text-xs text-ink-subtle">
          Prix hors taxes. Paiement sécurisé par Stripe. Changement de formule ou résiliation en un clic depuis votre espace.
        </p>
      </div>
      <Faq />
    </>
  );
}
