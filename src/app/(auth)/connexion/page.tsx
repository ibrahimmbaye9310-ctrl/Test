import type { Metadata } from "next";
import Link from "next/link";
import { Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { AuthPendingNotice } from "@/components/auth/auth-pending-notice";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-semibold">Bon retour 👋</h1>
      <p className="mt-2 text-sm text-ink-muted">Connectez-vous pour retrouver vos candidatures et vos favoris.</p>
      <div className="mt-8">
        <AuthPendingNotice />
        <form className="space-y-4" aria-describedby="auth-disabled">
          <fieldset disabled className="space-y-4">
            <Field label="Adresse e-mail" htmlFor="email">
              <Input id="email" name="email" type="email" autoComplete="email" icon={<Mail />} placeholder="vous@exemple.fr" required />
            </Field>
            <Field label="Mot de passe" htmlFor="password">
              <Input id="password" name="password" type="password" autoComplete="current-password" icon={<Lock />} required />
            </Field>
            <Button type="submit" size="lg" className="w-full">
              Se connecter
            </Button>
          </fieldset>
          <p id="auth-disabled" className="sr-only">Connexion indisponible jusqu&apos;à l&apos;activation des comptes.</p>
        </form>
      </div>
      <p className="mt-8 text-center text-sm text-ink-muted">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-medium text-electric-600 hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
