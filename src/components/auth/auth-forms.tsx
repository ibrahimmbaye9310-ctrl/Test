"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Building2, Mail, User } from "lucide-react";
import { Field, Input } from "@/components/ui/input";
import { ActionForm } from "@/components/forms/action-form";
import { FormMessage, PasswordInput, SubmitButton, errorProps } from "@/components/forms/form-feedback";
import { requestPasswordResetAction, signInAction, signUpAction, updatePasswordAction } from "@/lib/auth/actions";
import { initialActionState } from "@/lib/validation/common";
import { ButtonLink } from "@/components/ui/button";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, isPending] = useActionState(signInAction, initialActionState);
  return (
    <ActionForm action={action} pending={isPending} className="space-y-4" noValidate>
      <FormMessage state={state} />
      {next && <input type="hidden" name="suite" value={next} />}
      <Field label="Adresse e-mail" htmlFor="email" error={state.fieldErrors?.email}>
        <Input id="email" name="email" defaultValue={state.values?.email} type="email" autoComplete="email" icon={<Mail />} placeholder="vous@exemple.fr" required {...errorProps(state, "email")} />
      </Field>
      <Field label="Mot de passe" htmlFor="password" error={state.fieldErrors?.password}>
        <PasswordInput id="password" name="password" autoComplete="current-password" required {...errorProps(state, "password")} />
      </Field>
      <div className="flex justify-end">
        <Link href="/mot-de-passe-oublie" className="text-sm font-medium text-electric-600 hover:underline">
          Mot de passe oublié ?
        </Link>
      </div>
      <SubmitButton size="lg" className="w-full">
        Se connecter
      </SubmitButton>
    </ActionForm>
  );
}

export function SignupForm({ role }: { role: "candidate" | "recruiter" }) {
  const [state, action, isPending] = useActionState(signUpAction, initialActionState);
  return (
    <ActionForm action={action} pending={isPending} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <input type="hidden" name="role" value={role} />
      {role === "recruiter" && (
        <Field label="Nom de l'entreprise" htmlFor="companyName" error={state.fieldErrors?.companyName}>
          <Input id="companyName" name="companyName" defaultValue={state.values?.companyName} autoComplete="organization" icon={<Building2 />} required maxLength={120} {...errorProps(state, "companyName")} />
        </Field>
      )}
      <Field label="Nom complet" htmlFor="fullName" error={state.fieldErrors?.fullName}>
        <Input id="fullName" name="fullName" defaultValue={state.values?.fullName} autoComplete="name" icon={<User />} required maxLength={120} {...errorProps(state, "fullName")} />
      </Field>
      <Field label="Adresse e-mail" htmlFor="email" error={state.fieldErrors?.email}>
        <Input id="email" name="email" defaultValue={state.values?.email} type="email" autoComplete="email" icon={<Mail />} placeholder="vous@exemple.fr" required {...errorProps(state, "email")} />
      </Field>
      <Field label="Mot de passe" htmlFor="password" hint="10 caractères minimum, dont une lettre et un chiffre." error={state.fieldErrors?.password}>
        <PasswordInput id="password" name="password" autoComplete="new-password" minLength={10} required {...errorProps(state, "password")} />
      </Field>
      <div>
        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-navy-800">
          <input type="checkbox" name="terms" required defaultChecked={state.values?.terms === "on"} className="mt-0.5 size-4 rounded accent-electric-500" {...errorProps(state, "terms")} />
          <span>
            J&apos;accepte les{" "}
            <Link href="/cgu" target="_blank" className="text-electric-600 underline-offset-2 hover:underline">CGU</Link> et la{" "}
            <Link href="/confidentialite" target="_blank" className="text-electric-600 underline-offset-2 hover:underline">politique de confidentialité</Link>.
          </span>
        </label>
        {state.fieldErrors?.terms && <p id="terms-error" role="alert" className="mt-1.5 text-xs text-danger-600">{state.fieldErrors.terms}</p>}
      </div>
      <SubmitButton size="lg" className="w-full">
        Créer mon compte
      </SubmitButton>
    </ActionForm>
  );
}

export function ForgotPasswordForm() {
  const [state, action, isPending] = useActionState(requestPasswordResetAction, initialActionState);
  if (state.ok) return <FormMessage state={state} />;
  return (
    <ActionForm action={action} pending={isPending} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <Field label="Adresse e-mail" htmlFor="email" error={state.fieldErrors?.email}>
        <Input id="email" name="email" defaultValue={state.values?.email} type="email" autoComplete="email" icon={<Mail />} required {...errorProps(state, "email")} />
      </Field>
      <SubmitButton size="lg" className="w-full">
        Recevoir le lien
      </SubmitButton>
    </ActionForm>
  );
}

export function NewPasswordForm({ redirectTo }: { redirectTo: string }) {
  const [state, action, isPending] = useActionState(updatePasswordAction, initialActionState);
  if (state.ok)
    return (
      <div className="space-y-4">
        <FormMessage state={state} />
        <ButtonLink href={redirectTo} size="lg" className="w-full">Continuer</ButtonLink>
      </div>
    );
  return (
    <ActionForm action={action} pending={isPending} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <Field label="Nouveau mot de passe" htmlFor="password" hint="10 caractères minimum, dont une lettre et un chiffre." error={state.fieldErrors?.password}>
        <PasswordInput id="password" name="password" autoComplete="new-password" required {...errorProps(state, "password")} />
      </Field>
      <Field label="Confirmation" htmlFor="confirm" error={state.fieldErrors?.confirm}>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" required {...errorProps(state, "confirm")} />
      </Field>
      <SubmitButton size="lg" className="w-full">
        Enregistrer
      </SubmitButton>
    </ActionForm>
  );
}
