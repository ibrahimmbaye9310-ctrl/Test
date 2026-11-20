import type { Metadata } from "next";
import { MailCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Vérifiez votre boîte mail", robots: { index: false } };

export default async function SignupConfirmationPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  return (
    <div className="animate-fade-up text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-electric-50 text-electric-600">
        <MailCheck className="size-6" aria-hidden />
      </div>
      <h1 className="mt-6 text-2xl font-semibold">Vérifiez votre boîte mail</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">
        Si cette adresse n&apos;est pas déjà inscrite, un lien de confirmation vient d&apos;être envoyé
        {email ? <> à <strong className="text-navy-900">{email.slice(0, 254)}</strong></> : null}. Cliquez dessus pour activer votre compte.
      </p>
      <p className="mt-3 text-xs text-ink-subtle">Pensez à vérifier vos courriers indésirables. Le lien est valable 24 heures.</p>
      <ButtonLink href="/connexion" variant="secondary" className="mt-8">
        Retour à la connexion
      </ButtonLink>
    </div>
  );
}
