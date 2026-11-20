import type { Metadata } from "next";
import { NewPasswordForm } from "@/components/auth/auth-forms";
import { homeForRole, requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Nouveau mot de passe", robots: { index: false } };

/** Atteinte via le lien de réinitialisation (session temporaire ouverte par /auth/confirm). */
export default async function NewPasswordPage() {
  const user = await requireUser(undefined, "/mot-de-passe/nouveau");
  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-semibold">Choisissez un nouveau mot de passe</h1>
      <p className="mt-2 text-sm text-ink-muted">Compte : {user.email}</p>
      <div className="mt-8">
        <NewPasswordForm redirectTo={homeForRole(user.profile.role)} />
      </div>
    </div>
  );
}
