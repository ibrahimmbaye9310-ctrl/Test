"use client";

import { useActionState, useState, type ReactNode } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { ActionForm } from "@/components/forms/action-form";
import { FormMessage, SubmitButton, errorProps } from "@/components/forms/form-feedback";
import { LocationInput } from "@/components/jobs/location-input";
import { saveOfferAction } from "@/lib/recruiter/actions";
import { initialActionState } from "@/lib/validation/common";
import { CONTRACT_TYPES, SCHEDULES, SECTORS, WORK_TIMES } from "@/lib/config/taxonomy";
import type { JobOfferRecord } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-10 w-full rounded-xl bg-surface px-3.5 text-sm text-ink ring-1 ring-inset ring-line-strong shadow-xs placeholder:text-ink-subtle hover:ring-navy-300 focus:outline-none focus:ring-2 focus:ring-electric-500";

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-card bg-surface p-5 shadow-card ring-1 ring-line sm:p-7">
      <legend className="sr-only">{title}</legend>
      <h2 className="text-lg font-semibold" aria-hidden>{title}</h2>
      {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </fieldset>
  );
}

export function OfferForm({ offer }: { offer?: JobOfferRecord }) {
  const save = saveOfferAction.bind(null, offer?.id ?? null);
  const [state, action, isPending] = useActionState(save, initialActionState);
  const v = (k: string, saved: unknown) => state.values?.[k] ?? (saved == null ? "" : String(saved));
  const err = (k: string) => state.fieldErrors?.[k];
  const [contract, setContract] = useState(v("contractType", offer?.contract_type));
  const isPublished = offer?.status === "published";

  // Après une erreur, les cases cochées sont relues depuis la saisie renvoyée par le serveur.
  const checkedSchedules: string[] = state.values ? (state.values.schedules ?? "").split(",").filter(Boolean) : offer?.schedules ?? [];

  return (
    <ActionForm action={action} pending={isPending} className="space-y-6" noValidate>
      <FormMessage state={state} />

      <Section title="Le poste">
        <Field label="Intitulé du poste" htmlFor="title" error={err("title")}>
          <Input id="title" name="title" defaultValue={v("title", offer?.title)} required maxLength={120} placeholder="Ex. Vendeur·se en boutique" {...errorProps(state, "title")} />
        </Field>
        <Field label="Description courte" htmlFor="shortDescription" hint="Affichée dans les résultats de recherche (20 à 400 caractères)." error={err("shortDescription")}>
          <Textarea id="shortDescription" name="shortDescription" defaultValue={v("shortDescription", offer?.short_description)} rows={3} maxLength={400} {...errorProps(state, "shortDescription")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type de contrat" htmlFor="contractType" error={err("contractType")}>
            <Select id="contractType" name="contractType" value={contract} onChange={(e) => setContract(e.target.value)} {...errorProps(state, "contractType")}>
              <option value="">Choisir…</option>
              {CONTRACT_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>
          </Field>
          <Field label="Durée (mois)" htmlFor="durationMonths" hint={contract === "cdi" ? "Sans objet pour un CDI." : undefined} error={err("durationMonths")}>
            <Input id="durationMonths" name="durationMonths" type="number" min={1} max={36} disabled={contract === "cdi"} defaultValue={v("durationMonths", offer?.duration_months)} {...errorProps(state, "durationMonths")} />
          </Field>
          <Field label="Temps de travail" htmlFor="workTime" error={err("workTime")}>
            <Select id="workTime" name="workTime" defaultValue={v("workTime", offer?.work_time)} {...errorProps(state, "workTime")}>
              <option value="">Choisir…</option>
              {WORK_TIMES.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
            </Select>
          </Field>
          <Field label="Heures par semaine" htmlFor="hoursPerWeek" error={err("hoursPerWeek")}>
            <Input id="hoursPerWeek" name="hoursPerWeek" type="number" min={1} max={48} defaultValue={v("hoursPerWeek", offer?.hours_per_week)} {...errorProps(state, "hoursPerWeek")} />
          </Field>
          <Field label="Secteur d'activité" htmlFor="sector" error={err("sector")}>
            <Select id="sector" name="sector" defaultValue={v("sector", offer?.sector)} {...errorProps(state, "sector")}>
              <option value="">Choisir…</option>
              {SECTORS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </Field>
          <Field label="Télétravail" htmlFor="remote">
            <Select id="remote" name="remote" defaultValue={v("remote", offer?.remote ?? "none")}>
              <option value="none">Sur site</option>
              <option value="partial">Télétravail partiel</option>
              <option value="full">Télétravail complet</option>
            </Select>
          </Field>
        </div>
        <fieldset>
          <legend className="mb-2.5 text-sm font-medium text-navy-900">Horaires</legend>
          <div className="flex flex-wrap gap-2">
            {SCHEDULES.map((s) => (
              <label key={s.value} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="schedules"
                  value={s.value}
                  defaultChecked={checkedSchedules.includes(s.value)}
                  className="peer sr-only"
                />
                <span className="inline-flex rounded-full bg-surface px-3.5 py-1.5 text-sm text-navy-700 ring-1 ring-line-strong transition peer-checked:bg-navy-900 peer-checked:text-white peer-checked:ring-navy-900 peer-focus-visible:outline-2 peer-focus-visible:outline-electric-500">
                  {s.label}
                </span>
              </label>
            ))}
          </div>
          {err("schedules") && <p role="alert" className="mt-1.5 text-xs text-danger-600">{err("schedules")}</p>}
        </fieldset>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-navy-800">
          <input type="checkbox" name="isStudentFriendly" defaultChecked={state.values ? state.values.isStudentFriendly === "on" : offer?.is_student_friendly} className="size-4 accent-electric-500" />
          Compatible avec des études (horaires aménageables)
        </label>
      </Section>

      <Section title="Lieu" description="Commune d'Île-de-France où se déroule le poste.">
        <Field label="Ville ou code postal" htmlFor="location" error={err("location")}>
          <LocationInput id="location" name="location" defaultValue={v("location", offer ? offer.city : "")} className={cn(fieldClass, err("location") && "ring-danger-600")} />
        </Field>
      </Section>

      <Section title="Rémunération" description="Facultatif, mais les offres avec salaire reçoivent davantage de candidatures.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Minimum (€ brut)" htmlFor="salaryMin" error={err("salaryMin")}>
            <Input id="salaryMin" name="salaryMin" inputMode="decimal" defaultValue={v("salaryMin", offer?.salary_min)} {...errorProps(state, "salaryMin")} />
          </Field>
          <Field label="Maximum (€ brut)" htmlFor="salaryMax" error={err("salaryMax")}>
            <Input id="salaryMax" name="salaryMax" inputMode="decimal" defaultValue={v("salaryMax", offer?.salary_max)} {...errorProps(state, "salaryMax")} />
          </Field>
          <Field label="Période" htmlFor="salaryPeriod" error={err("salaryPeriod")}>
            <Select id="salaryPeriod" name="salaryPeriod" defaultValue={v("salaryPeriod", offer?.salary_period)} {...errorProps(state, "salaryPeriod")}>
              <option value="">—</option>
              <option value="hour">Par heure</option>
              <option value="month">Par mois</option>
              <option value="year">Par an</option>
            </Select>
          </Field>
        </div>
      </Section>

      <Section title="Détails" description="Une ligne par élément.">
        <Field label="Missions" htmlFor="missions" error={err("missions")}>
          <Textarea id="missions" name="missions" rows={4} defaultValue={v("missions", offer?.missions.join("\n"))} placeholder={"Accueillir les clients\nTenir la caisse"} {...errorProps(state, "missions")} />
        </Field>
        <Field label="Profil recherché" htmlFor="profile" error={err("profile")}>
          <Textarea id="profile" name="profile" rows={3} defaultValue={v("profile", offer?.profile.join("\n"))} {...errorProps(state, "profile")} />
        </Field>
        <Field label="Avantages" htmlFor="benefits" error={err("benefits")}>
          <Textarea id="benefits" name="benefits" rows={3} defaultValue={v("benefits", offer?.benefits.join("\n"))} {...errorProps(state, "benefits")} />
        </Field>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t border-line bg-canvas/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-card sm:border sm:px-5" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        <p className="mr-auto text-xs text-ink-subtle">Une offre publiée est visible 30 jours, puis expire automatiquement.</p>
        {!isPublished && (
          <SubmitButton name="intent" value="draft" variant="secondary">
            Enregistrer le brouillon
          </SubmitButton>
        )}
        <SubmitButton name="intent" value="publish">
          {isPublished ? "Enregistrer les modifications" : "Publier l'offre"}
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
