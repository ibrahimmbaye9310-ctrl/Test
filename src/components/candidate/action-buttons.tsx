"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck, Download, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { FormMessage, SubmitButton } from "@/components/forms/form-feedback";
import { deleteAccountAction, toggleSavedJobAction, withdrawApplicationAction } from "@/lib/candidate/actions";
import { initialActionState, type ActionState } from "@/lib/validation/common";

export function WithdrawButton({ applicationId }: { applicationId: string }) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<ActionState>({});
  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        loading={pending}
        onClick={() => {
          if (!window.confirm("Retirer cette candidature ? Le recruteur ne la verra plus.")) return;
          start(async () => setState(await withdrawApplicationAction(applicationId)));
        }}
      >
        {!pending && <Undo2 aria-hidden />} Retirer
      </Button>
      {state.error && <p role="alert" className="text-xs text-danger-600">{state.error}</p>}
    </div>
  );
}

/** Ajout / retrait d'un favori, avec mise à jour optimiste. */
export function SaveJobButton({ offerId, initialSaved, compact }: { offerId: string; initialSaved: boolean; compact?: boolean }) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const router = useRouter();
  const toggle = () =>
    start(async () => {
      const next = !saved;
      setSaved(next);
      const res = await toggleSavedJobAction(offerId, next);
      if (res.error) {
        setSaved(!next);
        setError(res.error);
      } else router.refresh();
    });
  return (
    <>
      <Button variant={compact ? "ghost" : "secondary"} size={compact ? "sm" : "md"} onClick={toggle} disabled={pending} aria-pressed={saved} className={compact ? undefined : "w-full"}>
        {saved ? <BookmarkCheck aria-hidden className="text-electric-600" /> : <Bookmark aria-hidden />}
        {compact ? (saved ? "Retirer" : "Enregistrer") : saved ? "Offre enregistrée" : "Enregistrer l'offre"}
      </Button>
      {error && <p role="alert" className="text-xs text-danger-600">{error}</p>}
    </>
  );
}

export function ExportDataButton() {
  return (
    <a href="/espace/compte/export" download className="inline-flex h-10 items-center gap-2 rounded-xl bg-surface px-4 text-sm font-medium text-navy-900 shadow-xs ring-1 ring-inset ring-line-strong hover:bg-navy-50">
      <Download className="size-4" aria-hidden />
      Télécharger mes données (JSON)
    </a>
  );
}

export function DeleteAccountForm() {
  const [state, action] = useActionState(deleteAccountAction, initialActionState);
  // Champ contrôlé : la réinitialisation automatique du formulaire par React ne peut pas effacer la saisie.
  const [typed, setTyped] = useState("");
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <Field label="Pour confirmer, tapez SUPPRIMER" htmlFor="delete-confirm" error={state.fieldErrors?.confirm}>
        <Input id="delete-confirm" name="confirm" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" placeholder="SUPPRIMER" className="max-w-xs" aria-invalid={state.fieldErrors?.confirm ? true : undefined} />
      </Field>
      <SubmitButton variant="danger" disabled={typed !== "SUPPRIMER"}>
        <Trash2 aria-hidden /> Supprimer définitivement mon compte
      </SubmitButton>
    </form>
  );
}
