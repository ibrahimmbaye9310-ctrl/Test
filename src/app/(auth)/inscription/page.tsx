import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, User } from "lucide-react";
import { SignupForm } from "@/components/auth/auth-forms";
import { SupabaseNotConfigured } from "@/components/auth/not-configured";
import { PLANS, type PlanId } from "@/lib/config/plans";
import { getCurrentUser, homeForRole } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Inscription", robots: { index: false } };

type Props = { searchParams: Promise<{ role?: string; formule?: string }> };

export default async function SignupPage({ searchParams }: Props) {
  const { role, formule } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(homeForRole(user.profile.role));

  const isRecruiter = role === "recruteur";
  const plan = formule && formule in PLANS ? PLANS[formule as PlanId] : null;
  const tabs = [
    { href: "/inscription", label: "Je cherche un emploi", icon: User, active: !isRecruiter },
    { href: "/inscription?role=recruteur", label: "Je recrute", icon: Building2, active: isRecruiter },
  ];

  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-semibold">Créer un compte</h1>
      <p className="mt-2 text-sm text-ink-muted">
        {isRecruiter ? "Publiez vos offres et gérez vos candidatures." : "Gratuit, sans engagement, en moins de 3 minutes."}
      </p>

      <nav aria-label="Type de compte" className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-navy-50 p-1">
        {tabs.map(({ href, label, icon: Icon, active }) => (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
              active ? "bg-surface text-navy-950 shadow-card" : "text-ink-muted hover:text-navy-900",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        ))}
      </nav>

      {isRecruiter && plan && (
        <p className="mt-4 rounded-xl bg-electric-50 px-4 py-3 text-sm text-navy-800 ring-1 ring-inset ring-electric-100">
          Formule sélectionnée : <strong>{plan.name}</strong>. Vous pourrez l&apos;activer depuis votre espace après la création du compte.
        </p>
      )}

      <div className="mt-6">
        <SupabaseNotConfigured />
        <SignupForm key={isRecruiter ? "r" : "c"} role={isRecruiter ? "recruiter" : "candidate"} />
      </div>
      <p className="mt-8 text-center text-sm text-ink-muted">
        Déjà inscrit·e ?{" "}
        <Link href="/connexion" className="font-medium text-electric-600 hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
