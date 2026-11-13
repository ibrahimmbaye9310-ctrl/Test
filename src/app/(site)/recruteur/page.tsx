import type { Metadata } from "next";
import { Building2, Construction } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { signOutAction } from "@/lib/auth/actions";
import { Card } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Espace recruteur", robots: { index: false } };

/** Accueil de l'espace recruteur. Publication d'offres, candidatures et abonnement : phase 4 et 7. */
export default async function RecruiterHomePage() {
  const user = await requireUser(["recruiter"], "/recruteur");
  return (
    <div className="container-page max-w-3xl! py-12">
      <p className="text-sm font-semibold text-electric-600">Espace recruteur</p>
      <h1 className="mt-2 text-3xl font-semibold">Bienvenue {user.profile.full_name.split(" ")[0]}</h1>
      <Card className="mt-8 flex gap-4 p-6">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-warning-50 text-warning-600">
          <Construction className="size-5" aria-hidden />
        </div>
        <div>
          <h2 className="font-semibold">Votre compte entreprise est créé</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">
            La création du profil entreprise, la publication d&apos;offres et la gestion des candidatures ouvrent très bientôt.
            Votre compte est prêt : vous n&apos;aurez rien à refaire.
          </p>
        </div>
      </Card>
      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink href="/tarifs" variant="secondary"><Building2 aria-hidden /> Voir les formules</ButtonLink>
        <form action={signOutAction}><Button type="submit" variant="ghost">Se déconnecter</Button></form>
      </div>
    </div>
  );
}
