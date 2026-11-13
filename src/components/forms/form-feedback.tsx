"use client";

import { useState, type ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/lib/validation/common";
import { cn } from "@/lib/utils";

/** Bouton d'envoi qui affiche un indicateur pendant l'exécution de la Server Action. */
export function SubmitButton({ children, ...props }: ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} {...props}>
      {children}
    </Button>
  );
}

/** Message global (succès ou erreur) d'un formulaire, annoncé aux lecteurs d'écran. */
export function FormMessage({ state, className }: { state: ActionState; className?: string }) {
  if (!state.error && !state.message) return null;
  const success = !state.error;
  return (
    <div
      role={success ? "status" : "alert"}
      className={cn(
        "flex gap-2.5 rounded-xl px-3.5 py-3 text-sm ring-1 ring-inset",
        success ? "bg-success-50 text-success-600 ring-success-600/20" : "bg-danger-50 text-danger-600 ring-danger-600/20",
        className,
      )}
    >
      {success ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden /> : <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />}
      <p>{state.error ?? state.message}</p>
    </div>
  );
}

/** Champ mot de passe avec bouton afficher / masquer. */
export function PasswordInput({ className, ...props }: ComponentProps<"input">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input type={visible ? "text" : "password"} className={cn("pr-11", className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-xl text-ink-subtle hover:text-navy-900"
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  );
}

/** Attributs d'accessibilité pour un champ en erreur. */
export function errorProps(state: ActionState, name: string) {
  const error = state.fieldErrors?.[name];
  return error ? { "aria-invalid": true as const, "aria-describedby": `${name}-error` } : {};
}
