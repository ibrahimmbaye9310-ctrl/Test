"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { FileText, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { ActionForm } from "@/components/forms/action-form";
import { FormMessage, SubmitButton } from "@/components/forms/form-feedback";
import { applyAction } from "@/lib/candidate/actions";
import { initialActionState } from "@/lib/validation/common";

/** Formulaire de candidature : le profil (CV, disponibilités…) est joint automatiquement. */
export function ApplyPanel({ offerId, cvFilename }: { offerId: string; cvFilename: string | null }) {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState(applyAction, initialActionState);

  if (state.ok)
    return (
      <div className="space-y-3">
        <FormMessage state={state} />
        <Link href="/espace/candidatures" className="block text-center text-sm font-medium text-electric-600 hover:underline">
          Voir mes candidatures
        </Link>
      </div>
    );

  if (!open)
    return (
      <Button size="lg" className="w-full" onClick={() => setOpen(true)}>
        <Send aria-hidden /> Postuler
      </Button>
    );

  return (
    <ActionForm action={action} pending={isPending} className="space-y-3 rounded-xl bg-navy-50/60 p-4">
      <input type="hidden" name="offerId" value={offerId} />
      <FormMessage state={state} />
      <div className="flex items-center gap-2 text-sm">
        <FileText className="size-4 shrink-0 text-ink-subtle" aria-hidden />
        {cvFilename ? (
          <span className="truncate text-navy-800">CV joint : {cvFilename}</span>
        ) : (
          <span className="text-warning-600">
            Aucun CV. <Link href="/espace/profil#cv" className="underline">Ajoutez-en un</Link> pour augmenter vos chances.
          </span>
        )}
      </div>
      <label htmlFor="coverMessage" className="block text-sm font-medium text-navy-900">
        Message au recruteur <span className="font-normal text-ink-subtle">(facultatif)</span>
      </label>
      <Textarea id="coverMessage" name="coverMessage" rows={4} maxLength={3000} placeholder="Présentez-vous en quelques lignes…" />
      {state.fieldErrors?.coverMessage && <p className="text-xs text-danger-600">{state.fieldErrors.coverMessage}</p>}
      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
        <SubmitButton className="flex-1">Envoyer ma candidature</SubmitButton>
      </div>
    </ActionForm>
  );
}
