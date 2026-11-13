import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Prose } from "@/components/layout/prose";

export const metadata: Metadata = { title: "Conditions générales d'utilisation", alternates: { canonical: "/cgu" } };

export default function TermsPage() {
  return (
    <>
      <PageHeader title="Conditions générales d'utilisation" />
      <Prose updatedAt="13 novembre 2026" draft>
        <h2>1. Objet</h2>
        <p>Les présentes conditions encadrent l&apos;utilisation de JobFinder par les candidats et les recruteurs.</p>
        <h2>2. Comptes</h2>
        <p>
          L&apos;inscription est réservée aux personnes âgées d&apos;au moins 16 ans. Chaque utilisateur est responsable de la
          confidentialité de ses identifiants et de l&apos;exactitude des informations fournies.
        </p>
        <h2>3. Annonces</h2>
        <p>
          Les recruteurs s&apos;engagent à publier des offres réelles, licites, non discriminatoires et conformes au Code du
          travail. JobFinder peut modérer, suspendre ou supprimer toute annonce frauduleuse ou non conforme, et suspendre le
          compte concerné.
        </p>
        <h2>4. Services payants</h2>
        <p>
          Les formules recruteurs (Starter, Pro, annonce à l&apos;unité) sont décrites sur la page Tarifs. Les abonnements sont
          mensuels, sans engagement, et résiliables à tout moment ; la résiliation prend effet à la fin de la période en cours.
          [Conditions générales de vente à compléter.]
        </p>
        <h2>5. Signalements</h2>
        <p>Tout utilisateur peut signaler une annonce ou un comportement abusif depuis la plateforme.</p>
        <h2>6. Droit applicable</h2>
        <p>Les présentes conditions sont soumises au droit français.</p>
      </Prose>
    </>
  );
}
