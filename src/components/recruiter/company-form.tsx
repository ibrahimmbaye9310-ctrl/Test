"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { ImageUp, Trash2 } from "lucide-react";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CompanyAvatar } from "@/components/ui/misc";
import { FormMessage, SubmitButton, errorProps } from "@/components/forms/form-feedback";
import { deleteLogoAction, saveCompanyAction, uploadLogoAction } from "@/lib/recruiter/actions";
import { initialActionState, type ActionState } from "@/lib/validation/common";
import { FILE_RULES } from "@/lib/validation/profile";
import type { Company } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

export function CompanyForm({ company, suggestedName }: { company: Company | null; suggestedName?: string }) {
  const [state, action] = useActionState(saveCompanyAction, initialActionState);
  const v = (k: string, saved: string | null | undefined) => state.values?.[k] ?? saved ?? "";
  const err = (k: string) => state.fieldErrors?.[k];
  return (
    <form action={action} className="space-y-4" noValidate>
      <Field label="Nom de l'entreprise" htmlFor="name" error={err("name")}>
        <Input id="name" name="name" defaultValue={v("name", company?.name ?? suggestedName)} required maxLength={120} autoComplete="organization" {...errorProps(state, "name")} />
      </Field>
      <Field label="Présentation" htmlFor="description" hint="Activité, valeurs, ambiance : affichée sur chacune de vos offres." error={err("description")}>
        <Textarea id="description" name="description" defaultValue={v("description", company?.description)} rows={5} maxLength={3000} {...errorProps(state, "description")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Site web" htmlFor="website" error={err("website")}>
          <Input id="website" name="website" defaultValue={v("website", company?.website)} inputMode="url" placeholder="www.exemple.fr" maxLength={200} {...errorProps(state, "website")} />
        </Field>
        <Field label="SIRET" htmlFor="siret" hint="Facultatif. Permet la vérification de votre entreprise." error={err("siret")}>
          <Input id="siret" name="siret" defaultValue={v("siret", company?.siret)} inputMode="numeric" maxLength={17} {...errorProps(state, "siret")} />
        </Field>
        <Field label="Ville" htmlFor="city" error={err("city")}>
          <Input id="city" name="city" defaultValue={v("city", company?.city)} maxLength={80} autoComplete="address-level2" {...errorProps(state, "city")} />
        </Field>
        <Field label="Code postal" htmlFor="postalCode" error={err("postalCode")}>
          <Input id="postalCode" name="postalCode" defaultValue={v("postalCode", company?.postal_code)} inputMode="numeric" maxLength={5} autoComplete="postal-code" {...errorProps(state, "postalCode")} />
        </Field>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        <FormMessage state={state} className="mr-auto py-2" />
        <SubmitButton>{company ? "Enregistrer" : "Créer mon entreprise"}</SubmitButton>
      </div>
    </form>
  );
}

export function LogoUpload({ name, url }: { name: string; url: string | null }) {
  const [state, action, pending] = useActionState(uploadLogoAction, initialActionState);
  const [local, setLocal] = useState<ActionState>({});
  const [deleting, startDelete] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const rules = FILE_RULES.logo;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <CompanyAvatar name={name} logoUrl={url} className="size-16 text-lg" />
        <p className="min-w-0 flex-1 text-sm text-ink-muted">
          {url ? "Logo affiché sur vos offres." : "Sans logo, vos initiales sont affichées."}
          <span className="block text-xs text-ink-subtle">{rules.label}. Format carré conseillé.</span>
        </p>
        <form ref={formRef} action={action}>
          <label className={cn("inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-surface px-4 text-sm font-medium text-navy-900 shadow-xs ring-1 ring-inset ring-line-strong hover:bg-navy-50 focus-within:outline-2 focus-within:outline-electric-500", pending && "pointer-events-none opacity-60")}>
            <ImageUp className="size-4" aria-hidden />
            {pending ? "Envoi…" : url ? "Remplacer" : "Ajouter un logo"}
            <input
              type="file"
              name="file"
              accept={rules.mime.join(",")}
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > rules.maxBytes) {
                  setLocal({ error: `Fichier trop lourd (${rules.label}).` });
                  e.target.value = "";
                  return;
                }
                setLocal({});
                formRef.current?.requestSubmit();
              }}
            />
          </label>
        </form>
        {url && (
          <Button variant="ghost" size="icon" aria-label="Supprimer le logo" loading={deleting} onClick={() => startDelete(async () => setLocal(await deleteLogoAction()))}>
            {!deleting && <Trash2 aria-hidden />}
          </Button>
        )}
      </div>
      <FormMessage state={state.error || state.message ? state : local} />
    </div>
  );
}
