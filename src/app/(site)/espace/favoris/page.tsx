import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getMySavedJobs } from "@/lib/candidate/queries";
import { CONTRACT_TYPES, labelOf } from "@/lib/config/taxonomy";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { SaveJobButton } from "@/components/candidate/action-buttons";
import { formatRelativeDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Mes favoris" };

export default async function SavedJobsPage() {
  const user = await requireUser(["candidate"]);
  const saved = await getMySavedJobs(user.id);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">Offres enregistrées</h1>
        <p className="mt-1.5 text-ink-muted">Retrouvez les offres que vous avez mises de côté.</p>
      </header>
      {saved.length === 0 ? (
        <EmptyState
          icon={<Bookmark />}
          title="Aucune offre enregistrée"
          description="Sur une offre, cliquez sur « Enregistrer l'offre » pour la retrouver ici."
          action={<ButtonLink href="/offres">Parcourir les offres</ButtonLink>}
        />
      ) : (
        <ul className="space-y-3">
          {saved.map(({ offer, savedAt }) =>
            offer ? (
              <li key={offer.id}>
                <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
                  <div className="min-w-0">
                    <Link href={`/offres/${offer.slug}`} className="font-semibold text-navy-950 hover:text-electric-600">{offer.title}</Link>
                    <p className="mt-0.5 text-sm text-ink-muted">{offer.companyName} · {offer.city}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge tone="dark">{labelOf(CONTRACT_TYPES, offer.contractType)}</Badge>
                      {offer.status !== "published" && <Badge tone="warning">Offre fermée</Badge>}
                      <span className="text-xs text-ink-subtle">Enregistrée {formatRelativeDate(savedAt).toLowerCase()}</span>
                    </div>
                  </div>
                  <SaveJobButton offerId={offer.id} initialSaved compact />
                </Card>
              </li>
            ) : null,
          )}
        </ul>
      )}
    </div>
  );
}
