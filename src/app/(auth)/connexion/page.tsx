import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/auth-forms";
import { SupabaseNotConfigured } from "@/components/auth/not-configured";
import { Callout } from "@/components/ui/misc";
import { getCurrentUser, homeForRole, safeNextPath } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

type Props = { searchParams: Promise<{ suite?: string; erreur?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { suite, erreur } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(safeNextPath(suite, homeForRole(user.profile.role)));
  const next = safeNextPath(suite, "");

  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-semibold">Bon retour</h1>
      <p className="mt-2 text-sm text-ink-muted">Connectez-vous pour retrouver vos candidatures et vos favoris.</p>
      <div className="mt-8">
        <SupabaseNotConfigured />
        {erreur === "lien" && (
          <Callout tone="warning" className="mb-6">
            Ce lien est invalide ou a expiré. Connectez-vous, ou demandez un nouveau lien de réinitialisation.
          </Callout>
        )}
        <LoginForm next={next || undefined} />
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
