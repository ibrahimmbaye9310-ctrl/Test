import Link from "next/link";
import { X } from "lucide-react";
import { CONTRACT_TYPES, SCHEDULES, SECTORS, WORK_TIMES, labelOf } from "@/lib/config/taxonomy";
import { buildSearchHref, type SearchCriteria } from "@/lib/jobs/search-params";

const num = new Intl.NumberFormat("fr-FR");

/** Pastilles des filtres actifs ; chacune est un lien qui retire ce filtre. */
export function ActiveFilters({ criteria: c }: { criteria: SearchCriteria }) {
  const reset = { page: 1 };
  const chips: { label: string; href: string }[] = [
    ...(c.lieu && c.rayon ? [{ label: `${c.rayon} km`, href: buildSearchHref(c, { ...reset, rayon: undefined, tri: c.tri === "distance" ? "recent" : c.tri }) }] : []),
    ...c.contrat.map((v) => ({ label: labelOf(CONTRACT_TYPES, v), href: buildSearchHref(c, { ...reset, contrat: c.contrat.filter((x) => x !== v) }) })),
    ...(c.temps ? [{ label: labelOf(WORK_TIMES, c.temps), href: buildSearchHref(c, { ...reset, temps: undefined }) }] : []),
    ...(c.etudiant ? [{ label: "Compatible études", href: buildSearchHref(c, { ...reset, etudiant: false }) }] : []),
    ...c.horaire.map((v) => ({ label: labelOf(SCHEDULES, v), href: buildSearchHref(c, { ...reset, horaire: c.horaire.filter((x) => x !== v) }) })),
    ...(c.salaire ? [{ label: `≥ ${num.format(c.salaire)} €/mois`, href: buildSearchHref(c, { ...reset, salaire: undefined }) }] : []),
    ...c.secteur.map((v) => ({ label: labelOf(SECTORS, v), href: buildSearchHref(c, { ...reset, secteur: c.secteur.filter((x) => x !== v) }) })),
  ];
  if (chips.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2" aria-label="Filtres actifs">
      {chips.map((chip) => (
        <li key={chip.label}>
          <Link
            href={chip.href}
            scroll={false}
            className="group inline-flex items-center gap-1.5 rounded-full bg-navy-900 py-1 pl-3 pr-2 text-xs font-medium text-white transition hover:bg-navy-700"
          >
            {chip.label}
            <X className="size-3.5 opacity-70 group-hover:opacity-100" aria-hidden />
            <span className="sr-only">(retirer ce filtre)</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
