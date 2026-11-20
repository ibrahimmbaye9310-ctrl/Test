import Form from "next/form";
import { Briefcase, MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { LocationInput } from "./location-input";

type SearchBarProps = {
  defaultQuery?: string;
  defaultLocation?: string;
  /** Filtres déjà actifs, conservés lors d'une nouvelle recherche (page /offres). */
  hiddenParams?: [string, string][];
  className?: string;
};

const fieldClass = "w-full bg-transparent text-[15px] text-ink placeholder:text-ink-subtle focus:outline-none";

/**
 * Formulaire GET vers /offres (next/form : navigation côté client, fonctionne aussi sans JavaScript).
 * Paramètres : q (métier, mot-clé) et lieu (ville ou code postal).
 */
export function SearchBar({ defaultQuery, defaultLocation, hiddenParams = [], className }: SearchBarProps) {
  return (
    <Form
      action="/offres"
      role="search"
      aria-label="Rechercher une offre d'emploi"
      className={cn(
        "flex flex-col gap-2 rounded-2xl bg-surface p-2 shadow-lift ring-1 ring-line sm:flex-row sm:items-center sm:gap-0",
        className,
      )}
    >
      {hiddenParams.map(([k, v]) => (
        <input key={`${k}=${v}`} type="hidden" name={k} value={v} />
      ))}
      <label className="flex flex-1 items-center gap-3 rounded-xl px-3.5 py-2.5 transition-colors focus-within:bg-navy-50/60">
        <Briefcase className="size-5 shrink-0 text-ink-subtle" aria-hidden />
        <span className="sr-only">Métier ou mot-clé</span>
        <input name="q" defaultValue={defaultQuery} placeholder="Métier, mot-clé" autoComplete="off" maxLength={100} className={fieldClass} />
      </label>
      <div className="hidden h-8 w-px bg-line sm:block" aria-hidden />
      <label className="flex flex-1 items-center gap-3 rounded-xl px-3.5 py-2.5 transition-colors focus-within:bg-navy-50/60">
        <MapPin className="size-5 shrink-0 text-ink-subtle" aria-hidden />
        <span className="sr-only">Ville ou code postal</span>
        <LocationInput defaultValue={defaultLocation} className={fieldClass} />
      </label>
      <button
        type="submit"
        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-electric-500 px-6 text-[15px] font-medium text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18)] transition-all hover:bg-electric-600 hover:shadow-glow"
      >
        <Search className="size-4" aria-hidden />
        Trouver un emploi
      </button>
    </Form>
  );
}
