import Link from "next/link";
import { ArrowRight, CalendarClock, CheckCircle2, Circle, GraduationCap } from "lucide-react";
import { SearchBar } from "@/components/jobs/search-bar";
import { siteConfig } from "@/lib/config/site";

const quickFilters = [
  { href: "/offres?etudiant=1", label: "Job étudiant" },
  { href: "/offres?temps=part_time", label: "Temps partiel" },
  { href: "/offres?contrat=cdi", label: "CDI" },
  { href: "/offres?contrat=alternance", label: "Alternance" },
  { href: "/offres?horaire=weekend", label: "Week-end" },
];

export function Hero() {
  return (
    <section className="relative -mt-16 overflow-hidden pt-16">
      {/* Fond : quadrillage + halo, masqués en dégradé */}
      <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" aria-hidden />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-electric-400/15 blur-3xl" aria-hidden />

      <div className="container-page relative grid items-center gap-14 pb-20 pt-14 sm:pt-20 lg:grid-cols-[1.15fr_1fr] lg:pb-28">
        {/* Pas d'animation d'entrée sur le bloc titre : il s'affiche dès le premier rendu (LCP). */}
        <div>
          <Link
            href="/offres"
            className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs font-medium text-navy-700 shadow-xs ring-1 ring-line transition hover:ring-line-strong"
          >
            <span className="size-1.5 rounded-full bg-electric-500" aria-hidden />
            Lancement en {siteConfig.launchRegion}
            <ArrowRight className="size-3" aria-hidden />
          </Link>
          <h1 className="mt-6 text-[2.6rem] font-semibold leading-[1.05] sm:text-6xl">
            Le bon job,
            <br />
            <span className="bg-gradient-to-r from-electric-600 to-electric-400 bg-clip-text text-transparent">au bon moment.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-muted">
            CDI, CDD, alternance, temps partiel ou job étudiant : trouvez un poste qui s&apos;adapte à votre emploi du temps,
            près de chez vous.
          </p>

          <SearchBar className="mt-9 max-w-2xl" />

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-sm text-ink-subtle">Populaire :</span>
            {quickFilters.map((f) => (
              <Link
                key={f.href}
                href={f.href}
                className="rounded-full bg-surface px-3 py-1 text-sm text-navy-700 ring-1 ring-line transition hover:bg-navy-50 hover:ring-line-strong"
              >
                {f.label}
              </Link>
            ))}
          </div>
        </div>

        <HeroPreview />
      </div>
    </section>
  );
}

const steps = [
  { label: "Candidature envoyée", date: "Lun. 9:12", done: true },
  { label: "En cours d'examen", date: "Mar. 14:30", done: true },
  { label: "Entretien", date: "Jeu. 10:00", done: false, current: true },
  { label: "Réponse", date: "—", done: false },
];

/** Aperçu illustratif de l'interface (suivi de candidature). Contenu fictif, aucune statistique inventée. */
function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md animate-fade-up [animation-delay:150ms] lg:mx-0" aria-hidden>
      <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-electric-100/70 to-transparent blur-2xl" />
      <div className="relative rounded-3xl bg-surface p-6 shadow-lift ring-1 ring-line">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-subtle">Suivi de candidature</p>
          <span className="rounded-md bg-warning-50 px-1.5 py-0.5 text-[10px] font-medium text-warning-600">Aperçu</span>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-navy-900 text-sm font-semibold text-white">SF</div>
          <div>
            <p className="font-semibold text-navy-950">Développeur·se front-end</p>
            <p className="text-sm text-ink-muted">Studio Fictif · Paris 2e · Alternance</p>
          </div>
        </div>
        <ol className="mt-6 space-y-4">
          {steps.map((s) => (
            <li key={s.label} className="flex items-center gap-3">
              {s.done ? (
                <CheckCircle2 className="size-5 text-electric-500" />
              ) : s.current ? (
                <span className="relative flex size-5 items-center justify-center">
                  <span className="absolute size-5 animate-ping rounded-full bg-electric-400/40" />
                  <span className="size-3 rounded-full bg-electric-500" />
                </span>
              ) : (
                <Circle className="size-5 text-line-strong" />
              )}
              <span className={s.done || s.current ? "flex-1 text-sm font-medium text-navy-900" : "flex-1 text-sm text-ink-subtle"}>
                {s.label}
              </span>
              <span className="text-xs text-ink-subtle">{s.date}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="absolute -bottom-6 -left-4 flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-lift ring-1 ring-line sm:-left-10">
        <div className="flex size-9 items-center justify-center rounded-lg bg-success-50 text-success-600">
          <CalendarClock className="size-4" />
        </div>
        <div>
          <p className="text-xs text-ink-subtle">Disponibilités</p>
          <p className="text-sm font-medium text-navy-900">Soirs & week-ends</p>
        </div>
      </div>
      <div className="absolute -right-3 -top-5 flex items-center gap-2 rounded-xl bg-navy-900 px-3 py-2 text-white shadow-lift sm:-right-6">
        <GraduationCap className="size-4 text-electric-300" />
        <span className="text-xs font-medium">Compatible études</span>
      </div>
    </div>
  );
}
