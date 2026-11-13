import { Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <main id="contenu" className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Logo className="mb-12" />
      <div className="flex size-14 items-center justify-center rounded-2xl bg-navy-50 text-navy-700">
        <Compass className="size-6" aria-hidden />
      </div>
      <p className="mt-6 text-sm font-semibold text-electric-600">Erreur 404</p>
      <h1 className="mt-2 text-3xl font-semibold">Cette page est introuvable</h1>
      <p className="mt-3 max-w-md text-ink-muted">L&apos;offre a peut-être été pourvue ou le lien est incorrect.</p>
      <div className="mt-8 flex gap-3">
        <ButtonLink href="/">Retour à l&apos;accueil</ButtonLink>
        <ButtonLink href="/offres" variant="secondary">Voir les offres</ButtonLink>
      </div>
    </main>
  );
}
