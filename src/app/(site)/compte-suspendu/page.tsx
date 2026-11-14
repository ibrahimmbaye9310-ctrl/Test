import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { signOutAction } from "@/lib/auth/actions";
import { siteConfig } from "@/lib/config/site";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Compte suspendu", robots: { index: false } };

export default function SuspendedPage() {
  return (
    <div className="container-page flex max-w-xl! flex-col items-center py-24 text-center">
      <ShieldAlert className="size-10 text-danger-600" aria-hidden />
      <h1 className="mt-5 text-2xl font-semibold">Compte suspendu</h1>
      <p className="mt-3 text-ink-muted">
        Votre compte a été suspendu par l&apos;équipe de modération. Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, écrivez à{" "}
        <span className="select-all font-medium text-navy-900">{siteConfig.contactEmail}</span>.
      </p>
      <form action={signOutAction} className="mt-8"><Button type="submit" variant="secondary">Se déconnecter</Button></form>
    </div>
  );
}
