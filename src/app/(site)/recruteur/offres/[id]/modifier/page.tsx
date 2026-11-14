import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMyOffer, requireCompany } from "@/lib/recruiter/queries";
import { OfferForm } from "@/components/recruiter/offer-form";

export const metadata: Metadata = { title: "Modifier l'offre" };

export default async function EditOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { company } = await requireCompany(`/recruteur/offres/${id}/modifier`);
  const offer = await getMyOffer(company.id, id);
  if (!offer) notFound();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">Modifier l&apos;offre</h1>
        <p className="mt-1.5 text-ink-muted">{offer.title}</p>
      </header>
      <OfferForm offer={offer} />
    </div>
  );
}
