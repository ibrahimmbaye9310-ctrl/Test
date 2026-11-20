import type { Metadata } from "next";
import { ClipboardList, Megaphone, UserCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ForCompanies } from "@/components/landing/for-companies";
import { Pricing } from "@/components/landing/pricing";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Recruter avec Kairo",
  description: "Publiez vos offres et recrutez étudiants, temps partiels, CDD et CDI en Île-de-France.",
  alternates: { canonical: "/entreprises" },
};

const steps = [
  { icon: Megaphone, title: "Publiez", text: "Décrivez le poste, les horaires et le lieu. Votre annonce est en ligne après validation." },
  { icon: ClipboardList, title: "Triez", text: "Consultez les profils, CV et disponibilités, et faites avancer chaque candidature." },
  { icon: UserCheck, title: "Recrutez", text: "Planifiez les entretiens et informez automatiquement les candidats de votre décision." },
];

export default function CompaniesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Entreprises"
        title="Le recrutement, sans la friction."
        description="Une plateforme pensée pour les commerces, restaurants, entrepôts, agences et startups d'Île-de-France."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/inscription?role=recruteur" size="lg">
            Créer un compte entreprise
          </ButtonLink>
          <ButtonLink href="/tarifs" size="lg" variant="secondary">
            Voir les tarifs
          </ButtonLink>
        </div>
      </PageHeader>
      <div className="container-page grid gap-4 py-16 md:grid-cols-3">
        {steps.map(({ icon: Icon, title, text }) => (
          <Card key={title} className="p-6">
            <div className="flex size-10 items-center justify-center rounded-xl bg-electric-50 text-electric-600">
              <Icon className="size-5" aria-hidden />
            </div>
            <h2 className="mt-5 text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{text}</p>
          </Card>
        ))}
      </div>
      <ForCompanies />
      <Pricing />
    </>
  );
}
