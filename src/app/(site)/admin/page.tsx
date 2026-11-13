import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { Callout } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Administration", robots: { index: false } };

/** Réservé au rôle admin (attribué uniquement en SQL). Tableau de bord complet : phase 6. */
export default async function AdminHomePage() {
  await requireUser(["admin"], "/admin");
  return (
    <div className="container-page max-w-3xl! py-12">
      <h1 className="text-3xl font-semibold">Administration</h1>
      <Callout className="mt-6">Le tableau de bord administrateur (statistiques, modération, signalements) arrive en phase 6.</Callout>
    </div>
  );
}
