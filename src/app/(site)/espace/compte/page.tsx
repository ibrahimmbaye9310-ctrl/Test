import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { signOutAction } from "@/lib/auth/actions";
import { ProfileSection } from "@/components/candidate/profile-forms";
import { DeleteAccountForm, ExportDataButton } from "@/components/candidate/action-buttons";
import { NewPasswordForm } from "@/components/auth/auth-forms";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Compte" };

export default async function AccountPage() {
  const user = await requireUser(["candidate"]);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">Compte</h1>
        <p className="mt-1.5 text-ink-muted">Connecté·e avec {user.email}</p>
      </header>
      <ProfileSection id="mot-de-passe" title="Mot de passe">
        <div className="max-w-sm">
          <NewPasswordForm redirectTo="/espace" />
        </div>
      </ProfileSection>
      <ProfileSection id="donnees" title="Mes données" description="Récupérez une copie de toutes vos données (profil, candidatures, favoris, liens vers vos fichiers).">
        <ExportDataButton />
      </ProfileSection>
      <ProfileSection id="session" title="Session">
        <form action={signOutAction}>
          <Button type="submit" variant="secondary">Se déconnecter</Button>
        </form>
      </ProfileSection>
      <section aria-labelledby="delete-title" className="rounded-card bg-surface p-5 ring-1 ring-danger-600/25 sm:p-7">
        <h2 id="delete-title" className="text-lg font-semibold text-danger-600">Supprimer mon compte</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Votre profil, votre CV, votre photo, vos candidatures et vos favoris seront définitivement effacés. Cette action est irréversible.
        </p>
        <div className="mt-6">
          <DeleteAccountForm />
        </div>
      </section>
    </div>
  );
}
