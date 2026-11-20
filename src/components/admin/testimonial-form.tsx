"use client";

import { useActionState } from "react";
import { Field, Input, Textarea } from "@/components/ui/input";
import { ActionForm } from "@/components/forms/action-form";
import { FormMessage, SubmitButton, errorProps } from "@/components/forms/form-feedback";
import { createTestimonialAction } from "@/lib/admin/actions";
import { initialActionState } from "@/lib/validation/common";

export function TestimonialForm() {
  const [state, action, isPending] = useActionState(createTestimonialAction, initialActionState);
  const err = (k: string) => state.fieldErrors?.[k];
  return (
    <ActionForm action={action} pending={isPending} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Auteur" htmlFor="authorName" hint="Prénom ou prénom + initiale" error={err("authorName")}>
          <Input id="authorName" name="authorName" maxLength={80} {...errorProps(state, "authorName")} />
        </Field>
        <Field label="Profil" htmlFor="authorRole" hint="Ex. « Étudiante, Créteil »" error={err("authorRole")}>
          <Input id="authorRole" name="authorRole" maxLength={120} {...errorProps(state, "authorRole")} />
        </Field>
        <Field label="Date du consentement" htmlFor="consentAt" error={err("consentAt")}>
          <Input id="consentAt" name="consentAt" type="date" {...errorProps(state, "consentAt")} />
        </Field>
      </div>
      <Field label="Avis (tel que rédigé par son auteur)" htmlFor="quote" error={err("quote")}>
        <Textarea id="quote" name="quote" rows={3} maxLength={600} {...errorProps(state, "quote")} />
      </Field>
      <label className="flex items-start gap-2.5 text-sm text-navy-800">
        <input type="checkbox" name="confirm" className="mt-0.5 size-4 accent-electric-500" />
        <span>Je certifie que cet avis est authentique, non modifié, et que son auteur a donné son accord écrit pour sa publication.</span>
      </label>
      {err("confirm") && <p role="alert" className="text-xs text-danger-600">{err("confirm")}</p>}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <FormMessage state={state} className="mr-auto py-2" />
        <SubmitButton>Enregistrer l&apos;avis</SubmitButton>
      </div>
    </ActionForm>
  );
}
