import type { Metadata } from "next";
import { requireCompany } from "@/lib/recruiter/queries";
import { OfferForm } from "@/components/recruiter/offer-form";
import { Callout } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Nouvelle offre" };

export default async function NewOfferPage() {
  const { company } = await requireCompany("/recruteur/offres/nouvelle");
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">Nouvelle offre</h1>
        <p className="mt-1.5 text-ink-muted">Enregistrez un brouillon ou publiez directement : l&apos;offre est alors visible 30 jours.</p>
      </header>
      {!company.is_verified && (
        <Callout>
          Votre entreprise n&apos;est pas encore vérifiée : vos offres sont contrôlées par notre équipe avant publication (sous 24 h ouvrées).
        </Callout>
      )}
      <OfferForm />
    </div>
  );
}
