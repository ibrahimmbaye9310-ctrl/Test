import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Compte supprimé", robots: { index: false } };

export default function AccountDeletedPage() {
  return (
    <div className="container-page flex max-w-xl! flex-col items-center py-24 text-center">
      <CheckCircle2 className="size-10 text-success-600" aria-hidden />
      <h1 className="mt-5 text-2xl font-semibold">Votre compte a été supprimé</h1>
      <p className="mt-3 text-ink-muted">Votre profil, vos fichiers et vos candidatures ont été définitivement effacés. Merci d&apos;avoir utilisé Kairo.</p>
      <ButtonLink href="/" className="mt-8">Retour à l&apos;accueil</ButtonLink>
    </div>
  );
}
