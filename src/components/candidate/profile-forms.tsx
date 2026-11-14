"use client";

import { useActionState, useRef, useState, useTransition, type ReactNode } from "react";
import { FileText, ImageUp, Plus, Trash2, Upload, X } from "lucide-react";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ActionForm } from "@/components/forms/action-form";
import { FormMessage, SubmitButton, errorProps } from "@/components/forms/form-feedback";
import {
  deleteFileAction, updateAvailabilityAction, updatePreferencesAction, updateProfileInfoAction, updateSkillsAction, uploadFileAction,
} from "@/lib/candidate/actions";
import { initialActionState, type ActionState } from "@/lib/validation/common";
import { FILE_RULES, type CandidateFileKind } from "@/lib/validation/profile";
import { CONTRACT_TYPES, RADIUS_OPTIONS, SCHEDULES, SECTORS, WORK_TIMES } from "@/lib/config/taxonomy";
import type { Profile } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";
import { UserAvatar } from "./user-avatar";

export function ProfileSection({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 rounded-card bg-surface p-5 shadow-card ring-1 ring-line sm:p-7">
      <h2 id={`${id}-title`} className="text-lg font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function InfoForm({ profile }: { profile: Profile }) {
  const [state, action, isPending] = useActionState(updateProfileInfoAction, initialActionState);
  const err = (k: string) => state.fieldErrors?.[k];
  // Après une erreur, on réaffiche la saisie ; sinon les valeurs enregistrées.
  const v = (k: string, saved: string | null) => state.values?.[k] ?? saved ?? "";
  return (
    <ActionForm action={action} pending={isPending} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom complet" htmlFor="fullName" error={err("fullName")}>
          <Input id="fullName" name="fullName" defaultValue={v("fullName", profile.full_name)} autoComplete="name" required maxLength={120} {...errorProps(state, "fullName")} />
        </Field>
        <Field label="Téléphone" htmlFor="phone" hint="Visible uniquement des recruteurs auxquels vous postulez." error={err("phone")}>
          <Input id="phone" name="phone" type="tel" defaultValue={v("phone", profile.phone)} autoComplete="tel" maxLength={20} {...errorProps(state, "phone")} />
        </Field>
        <Field label="Ville" htmlFor="city" error={err("city")}>
          <Input id="city" name="city" defaultValue={v("city", profile.city)} autoComplete="address-level2" maxLength={80} {...errorProps(state, "city")} />
        </Field>
        <Field label="Code postal" htmlFor="postalCode" error={err("postalCode")}>
          <Input id="postalCode" name="postalCode" defaultValue={v("postalCode", profile.postal_code)} autoComplete="postal-code" inputMode="numeric" maxLength={5} {...errorProps(state, "postalCode")} />
        </Field>
      </div>
      <Field label="Titre du profil" htmlFor="headline" hint="Ex. « Étudiante en BTS, disponible le week-end »" error={err("headline")}>
        <Input id="headline" name="headline" defaultValue={v("headline", profile.headline)} maxLength={140} {...errorProps(state, "headline")} />
      </Field>
      <Field label="Présentation" htmlFor="bio" hint="2 000 caractères maximum." error={err("bio")}>
        <Textarea id="bio" name="bio" defaultValue={v("bio", profile.bio)} maxLength={2000} rows={5} {...errorProps(state, "bio")} />
      </Field>
      <FormFooter state={state} />
    </ActionForm>
  );
}

function FormFooter({ state, label = "Enregistrer" }: { state: ActionState; label?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
      <FormMessage state={state} className="mr-auto py-2" />
      <SubmitButton>{label}</SubmitButton>
    </div>
  );
}

/** Téléversement immédiat à la sélection du fichier. Contrôles définitifs côté serveur. */
export function FileUpload({ kind, current }: { kind: CandidateFileKind; current: { name: string | null; url: string | null; updatedAt?: string | null } }) {
  const upload = uploadFileAction.bind(null, kind);
  const [state, action, pending] = useActionState(upload, initialActionState);
  const [deleteState, setDeleteState] = useState<ActionState>({});
  const [deleting, startDelete] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const rules = FILE_RULES[kind];
  const isCv = kind === "cv";
  const shown = state.error || state.message ? state : deleteState;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        {isCv ? (
          <div className="flex size-14 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
            <FileText className="size-6" aria-hidden />
          </div>
        ) : (
          <UserAvatar name={current.name ?? "?"} url={current.url} className="size-16 text-lg" />
        )}
        <div className="min-w-0 flex-1">
          {isCv && current.url ? (
            <>
              <a href="/espace/cv" target="_blank" rel="noopener" className="block truncate font-medium text-navy-950 hover:text-electric-600">
                {current.name}
              </a>
              <p className="text-xs text-ink-subtle">Visible uniquement des recruteurs auxquels vous postulez.</p>
            </>
          ) : (
            <p className="text-sm text-ink-muted">{isCv ? "Aucun CV pour l'instant." : current.url ? "Photo de profil" : "Aucune photo (facultatif)."}</p>
          )}
          <p className="text-xs text-ink-subtle">{rules.label}</p>
        </div>
        <form ref={formRef} action={action}>
          <label className={cn("inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-surface px-4 text-sm font-medium text-navy-900 shadow-xs ring-1 ring-inset ring-line-strong hover:bg-navy-50 focus-within:outline-2 focus-within:outline-electric-500", pending && "pointer-events-none opacity-60")}>
            {isCv ? <Upload className="size-4" aria-hidden /> : <ImageUp className="size-4" aria-hidden />}
            {pending ? "Envoi…" : current.url ? "Remplacer" : isCv ? "Ajouter mon CV" : "Ajouter une photo"}
            <input
              type="file"
              name="file"
              accept={rules.mime.join(",")}
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > rules.maxBytes) {
                  setDeleteState({ error: `Fichier trop lourd (${rules.label}).` });
                  e.target.value = "";
                  return;
                }
                setDeleteState({});
                formRef.current?.requestSubmit();
              }}
            />
          </label>
        </form>
        {current.url && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={isCv ? "Supprimer le CV" : "Supprimer la photo"}
            loading={deleting}
            onClick={() => startDelete(async () => setDeleteState(await deleteFileAction(kind)))}
          >
            {!deleting && <Trash2 aria-hidden />}
          </Button>
        )}
      </div>
      <FormMessage state={shown} />
    </div>
  );
}

export function SkillsForm({ initial }: { initial: string[] }) {
  const [state, action, isPending] = useActionState(updateSkillsAction, initialActionState);
  const [skills, setSkills] = useState(initial);
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim().slice(0, 40);
    if (v && skills.length < 30 && !skills.some((s) => s.toLowerCase() === v.toLowerCase())) setSkills([...skills, v]);
    setDraft("");
  };
  return (
    <ActionForm action={action} pending={isPending} className="space-y-4">
      {skills.map((s) => <input key={s} type="hidden" name="skills" value={s} />)}
      <ul className="flex flex-wrap gap-2" aria-label="Compétences">
        {skills.length === 0 && <li className="text-sm text-ink-subtle">Aucune compétence ajoutée.</li>}
        {skills.map((s) => (
          <li key={s} className="inline-flex items-center gap-1 rounded-full bg-navy-900 py-1 pl-3 pr-1.5 text-sm text-white">
            {s}
            <button type="button" onClick={() => setSkills(skills.filter((x) => x !== s))} className="rounded-full p-0.5 hover:bg-white/15" aria-label={`Retirer ${s}`}>
              <X className="size-3.5" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <label htmlFor="skill-input" className="sr-only">Nouvelle compétence</label>
        <Input
          id="skill-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Ex. Service client, Excel, Anglais…"
          maxLength={40}
        />
        <Button type="button" variant="secondary" onClick={add} disabled={!draft.trim() || skills.length >= 30}>
          <Plus aria-hidden /> Ajouter
        </Button>
      </div>
      <FormFooter state={state} />
    </ActionForm>
  );
}

function ChipCheckbox({ name, value, label, defaultChecked }: { name: string; value: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="cursor-pointer">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="inline-flex rounded-full bg-surface px-3.5 py-1.5 text-sm text-navy-700 ring-1 ring-line-strong transition peer-checked:bg-navy-900 peer-checked:text-white peer-checked:ring-navy-900 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-electric-500 hover:ring-navy-300">
        {label}
      </span>
    </label>
  );
}

export function AvailabilityForm({ profile }: { profile: Profile }) {
  const [state, action, isPending] = useActionState(updateAvailabilityAction, initialActionState);
  return (
    <ActionForm action={action} pending={isPending} className="space-y-5">
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-navy-900">Quand pouvez-vous travailler ?</legend>
        <div className="flex flex-wrap gap-2">
          {SCHEDULES.map((s) => <ChipCheckbox key={s.value} name="availability" value={s.value} label={s.label} defaultChecked={profile.availability.includes(s.value)} />)}
        </div>
      </fieldset>
      <Field label="Précisions (facultatif)" htmlFor="availabilityNote" hint="Ex. « Libre le mercredi après-midi, pas pendant les partiels de janvier »" error={state.fieldErrors?.availabilityNote}>
        <Input id="availabilityNote" name="availabilityNote" defaultValue={profile.availability_note ?? ""} maxLength={300} />
      </Field>
      <FormFooter state={state} />
    </ActionForm>
  );
}

export function PreferencesForm({ profile }: { profile: Profile }) {
  const [state, action, isPending] = useActionState(updatePreferencesAction, initialActionState);
  return (
    <ActionForm action={action} pending={isPending} className="space-y-6">
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-navy-900">Contrats recherchés</legend>
        <div className="flex flex-wrap gap-2">
          {CONTRACT_TYPES.map((c) => <ChipCheckbox key={c.value} name="desiredContracts" value={c.value} label={c.label} defaultChecked={profile.desired_contracts.includes(c.value)} />)}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Temps de travail" htmlFor="desiredWorkTime">
          <Select id="desiredWorkTime" name="desiredWorkTime" defaultValue={profile.desired_work_time ?? ""}>
            <option value="">Indifférent</option>
            {WORK_TIMES.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
          </Select>
        </Field>
        <Field label="Distance maximale" htmlFor="searchRadiusKm">
          <Select id="searchRadiusKm" name="searchRadiusKm" defaultValue={profile.search_radius_km ?? ""}>
            <option value="">Indifférent</option>
            {RADIUS_OPTIONS.map((r) => <option key={r} value={r}>{r} km</option>)}
          </Select>
        </Field>
      </div>
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-navy-900">Secteurs qui vous intéressent</legend>
        <div className="flex flex-wrap gap-2">
          {SECTORS.map((s) => <ChipCheckbox key={s.value} name="desiredSectors" value={s.value} label={s.label} defaultChecked={profile.desired_sectors.includes(s.value)} />)}
        </div>
      </fieldset>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-navy-50/60 p-4">
        <input type="checkbox" name="openToWork" defaultChecked={profile.open_to_work} className="mt-0.5 size-4 accent-electric-500" />
        <span>
          <span className="block text-sm font-medium text-navy-900">Je suis en recherche active</span>
          <span className="block text-xs text-ink-muted">Indique aux recruteurs que vous êtes disponible rapidement.</span>
        </span>
      </label>
      <FormFooter state={state} />
    </ActionForm>
  );
}
