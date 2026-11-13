import { BarChart3, Building2, Check, FileDown, Filter } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

const benefits = [
  "Publiez une annonce en quelques minutes",
  "Ciblez par horaires, contrat et zone géographique",
  "Recevez des profils avec disponibilités déjà renseignées",
  "Gérez toutes vos candidatures au même endroit",
];

export function ForCompanies() {
  return (
    <section className="container-page py-20 sm:py-24" aria-labelledby="companies-title">
      <div className="relative overflow-hidden rounded-[2rem] bg-navy-950 px-6 py-14 sm:px-12 lg:px-16">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.25] invert [mask-image:linear-gradient(to_left,black,transparent_70%)]" aria-hidden />
        <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-electric-500/30 blur-3xl" aria-hidden />

        <div className="relative grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-electric-300">
              <Building2 className="size-4" aria-hidden /> Pour les entreprises
            </p>
            <h2 id="companies-title" className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Recrutez les bons profils, sans perdre de temps.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-navy-200">
              Commerces, restaurants, entrepôts, startups : JobFinder vous connecte aux candidats disponibles quand vous en
              avez besoin.
            </p>
            <ul className="mt-8 space-y-3">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-3 text-navy-100">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-electric-500/20 text-electric-300">
                    <Check className="size-3.5" aria-hidden />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/inscription?role=recruteur" size="lg">
                Publier une offre
              </ButtonLink>
              <ButtonLink href="/tarifs" size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
                Voir les tarifs
              </ButtonLink>
            </div>
          </div>

          <RecruiterPreview />
        </div>
      </div>
    </section>
  );
}

/** Illustration de l'espace recruteur : pas de chiffres réels, uniquement des éléments d'interface. */
function RecruiterPreview() {
  const rows = [
    { name: "Candidat·e A", status: "Nouvelle", tone: "bg-electric-500/20 text-electric-200" },
    { name: "Candidat·e B", status: "Entretien", tone: "bg-warning-600/25 text-orange-200" },
    { name: "Candidat·e C", status: "Examinée", tone: "bg-white/10 text-navy-100" },
  ];
  return (
    <div className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10 backdrop-blur" aria-hidden>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white">Candidatures reçues</p>
        <div className="flex gap-1.5 text-navy-300">
          <Filter className="size-4" />
          <BarChart3 className="size-4" />
        </div>
      </div>
      <ul className="mt-4 divide-y divide-white/10">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center gap-3 py-3">
            <div className="size-9 rounded-full bg-gradient-to-br from-navy-500 to-navy-700" />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{r.name}</p>
              <p className="text-xs text-navy-300">Disponible soirs & week-ends</p>
            </div>
            <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${r.tone}`}>{r.status}</span>
            <FileDown className="size-4 text-navy-300" />
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-navy-400">Aperçu de l&apos;interface — profils fictifs</p>
    </div>
  );
}
