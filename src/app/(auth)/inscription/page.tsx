import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Lock, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/input";
import { AuthPendingNotice } from "@/components/auth/auth-pending-notice";
import { PLANS, type PlanId } from "@/lib/config/plans";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Inscription", robots: { index: false } };

type Props = { searchParams: Promise<{ role?: string; formule?: string }> };

export default async function SignupPage({ searchParams }: Props) {
  const { role, formule } = await searchParams;
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
          Formule sélectionnée : <strong>{plan.name}</strong>. Le paiement aura lieu après la création du compte.
        </p>
      )}

      <div className="mt-6">
        <AuthPendingNotice />
        <form>
          <fieldset disabled className="space-y-4">
            {isRecruiter && (
              <Field label="Nom de l'entreprise" htmlFor="company">
                <Input id="company" name="company" autoComplete="organization" icon={<Building2 />} required />
              </Field>
            )}
            <Field label="Nom complet" htmlFor="fullName">
              <Input id="fullName" name="fullName" autoComplete="name" icon={<User />} required />
            </Field>
            <Field label="Adresse e-mail" htmlFor="email">
              <Input id="email" name="email" type="email" autoComplete="email" icon={<Mail />} placeholder="vous@exemple.fr" required />
            </Field>
            <Field label="Mot de passe" htmlFor="password" hint="10 caractères minimum, dont une lettre et un chiffre.">
              <Input id="password" name="password" type="password" autoComplete="new-password" icon={<Lock />} minLength={10} required />
            </Field>
            <Checkbox
              name="terms"
              required
              label={
                <span>
                  J&apos;accepte les <Link href="/cgu" className="text-electric-600 underline-offset-2 hover:underline">CGU</Link> et la{" "}
                  <Link href="/confidentialite" className="text-electric-600 underline-offset-2 hover:underline">politique de confidentialité</Link>.
                </span>
              }
            />
            <Button type="submit" size="lg" className="w-full">
              Créer mon compte
            </Button>
          </fieldset>
        </form>
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
