import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";
import { SupabaseNotConfigured } from "@/components/auth/not-configured";

export const metadata: Metadata = { title: "Mot de passe oublié", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-semibold">Mot de passe oublié</h1>
      <p className="mt-2 text-sm text-ink-muted">Saisissez votre adresse : nous vous enverrons un lien pour en choisir un nouveau.</p>
      <div className="mt-8">
        <SupabaseNotConfigured />
        <ForgotPasswordForm />
      </div>
      <p className="mt-8 text-center text-sm text-ink-muted">
        <Link href="/connexion" className="font-medium text-electric-600 hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
