"use client";

import { useRef, type ReactNode } from "react";
import Form from "next/form";
import Link from "next/link";
import { CONTRACT_TYPES, RADIUS_OPTIONS, SCHEDULES, SECTORS, WORK_TIMES } from "@/lib/config/taxonomy";
import { SALARY_OPTIONS, type SearchCriteria } from "@/lib/jobs/search-params";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  criteria: SearchCriteria;
  /** Le lieu saisi a été géolocalisé : le rayon est utilisable. */
  canUseRadius: boolean;
  /** Ordinateur : chaque changement relance la recherche. Mobile : bouton « Voir les résultats ». */
  autoSubmit?: boolean;
  onSubmitted?: () => void;
  idPrefix: string;
};

const num = new Intl.NumberFormat("fr-FR");

export function SearchFilters({ criteria: c, canUseRadius, autoSubmit = true, onSubmitted, idPrefix }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const submit = () => autoSubmit && formRef.current?.requestSubmit();

  return (
    <Form action="/offres" ref={formRef} onChange={submit} onSubmit={() => onSubmitted?.()} className="space-y-7" aria-label="Filtres de recherche">
      {c.q && <input type="hidden" name="q" value={c.q} />}
      {c.lieu && <input type="hidden" name="lieu" value={c.lieu} />}
      {c.tri !== "recent" && <input type="hidden" name="tri" value={c.tri} />}

      <Group title="Distance">
        <label htmlFor={`${idPrefix}-rayon`} className="sr-only">Rayon de recherche</label>
        <Select id={`${idPrefix}-rayon`} name="rayon" defaultValue={c.rayon ?? ""} disabled={!canUseRadius}>
          <option value="">{canUseRadius ? "Commune exacte" : "Saisissez une ville"}</option>
          {RADIUS_OPTIONS.map((r) => (
            <option key={r} value={r}>
              Dans un rayon de {r} km
            </option>
          ))}
        </Select>
        {!canUseRadius && <p className="mt-2 text-xs text-ink-subtle">Indiquez une ville ou un code postal pour chercher autour.</p>}
      </Group>

      <Group title="Type de contrat">
        {CONTRACT_TYPES.map((t) => (
          <Check key={t.value} name="contrat" value={t.value} label={t.label} defaultChecked={c.contrat.includes(t.value)} />
        ))}
      </Group>

      <Group title="Temps de travail">
        <Radio name="temps" value="" label="Indifférent" defaultChecked={!c.temps} />
        {WORK_TIMES.map((t) => (
          <Radio key={t.value} name="temps" value={t.value} label={t.label} defaultChecked={c.temps === t.value} />
        ))}
      </Group>

      <Group title="Profil">
        <Check name="etudiant" value="1" label="Compatible avec les études" defaultChecked={c.etudiant} />
      </Group>

      <Group title="Horaires">
        <div className="flex flex-wrap gap-2">
          {SCHEDULES.map((s) => (
            <Chip key={s.value} name="horaire" value={s.value} label={s.label} defaultChecked={c.horaire.includes(s.value)} />
          ))}
        </div>
      </Group>

      <Group title="Salaire minimum">
        <label htmlFor={`${idPrefix}-salaire`} className="sr-only">Salaire minimum</label>
        <Select id={`${idPrefix}-salaire`} name="salaire" defaultValue={c.salaire ?? ""}>
          <option value="">Indifférent</option>
          {SALARY_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {num.format(s)} € brut/mois et plus
            </option>
          ))}
        </Select>
        <p className="mt-2 text-xs text-ink-subtle">Équivalent temps plein. Les offres sans salaire affiché sont masquées.</p>
      </Group>

      <Group title="Secteur d'activité">
        {SECTORS.map((s) => (
          <Check key={s.value} name="secteur" value={s.value} label={s.label} defaultChecked={c.secteur.includes(s.value)} />
        ))}
      </Group>

      <div className={cn("flex gap-2", autoSubmit && "[@media(scripting:enabled)]:hidden")}>
        <Button type="submit" className="flex-1">
          Voir les résultats
        </Button>
      </div>
      <Link href={c.q || c.lieu ? `/offres?${new URLSearchParams({ ...(c.q && { q: c.q }), ...(c.lieu && { lieu: c.lieu }) })}` : "/offres"} className="block text-center text-sm font-medium text-ink-muted hover:text-navy-950" onClick={() => onSubmitted?.()}>
        Effacer les filtres
      </Link>
    </Form>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-navy-950">{title}</legend>
      <div className="space-y-2.5">{children}</div>
    </fieldset>
  );
}

type InputProps = { name: string; value: string; label: string; defaultChecked?: boolean };

function Check({ name, value, label, defaultChecked }: InputProps) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-navy-800 hover:text-navy-950">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className="size-4 rounded accent-electric-500" />
      {label}
    </label>
  );
}

function Radio({ name, value, label, defaultChecked }: InputProps) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-navy-800 hover:text-navy-950">
      <input type="radio" name={name} value={value} defaultChecked={defaultChecked} className="size-4 accent-electric-500" />
      {label}
    </label>
  );
}

/** Case à cocher présentée comme une pastille. */
function Chip({ name, value, label, defaultChecked }: InputProps) {
  return (
    <label className="cursor-pointer">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="inline-flex rounded-full bg-surface px-3 py-1.5 text-sm text-navy-700 ring-1 ring-line-strong transition peer-checked:bg-navy-900 peer-checked:text-white peer-checked:ring-navy-900 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-electric-500 hover:ring-navy-300">
        {label}
      </span>
    </label>
  );
}
