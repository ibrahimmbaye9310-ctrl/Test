import Link from "next/link";
import { ArrowRight, Bookmark, CircleCheck, Search, Send } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getMyApplications, getMySavedJobs, profileCompletion } from "@/lib/candidate/queries";
import { APPLICATION_STATUSES } from "@/lib/config/applications";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { ApplicationStatusBadge } from "@/components/candidate/application-status-badge";
import { formatRelativeDate } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser(["candidate"]);
  const [applications, saved] = await Promise.all([getMyApplications(user.id), getMySavedJobs(user.id)]);
  const completion = profileCompletion(user.profile);
  const firstName = user.profile.full_name.split(" ")[0];
  const active = applications.filter((a) => !["accepted", "rejected"].includes(a.status)).length;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">Bonjour {firstName}</h1>
        <p className="mt-1.5 text-ink-muted">Voici où en est votre recherche.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={<Send />} label="Candidatures en cours" value={active} href="/espace/candidatures" />
        <Stat icon={<CircleCheck />} label="Entretiens" value={applications.filter((a) => a.status === "interview").length} href="/espace/candidatures?statut=interview" />
        <Stat icon={<Bookmark />} label="Offres enregistrées" value={saved.length} href="/espace/favoris" />
      </div>

      {completion.percent < 100 && (
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold">Profil complété à {completion.percent} %</h2>
              <p className="mt-1 text-sm text-ink-muted">Un profil complet est mieux compris par les recruteurs.</p>
            </div>
            <ButtonLink href="/espace/profil" variant="secondary">Compléter mon profil</ButtonLink>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-navy-50" role="progressbar" aria-valuenow={completion.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Complétion du profil">
            <div className="h-full rounded-full bg-electric-500 transition-all" style={{ width: `${completion.percent}%` }} />
          </div>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {completion.missing.map((m) => (
              <li key={m.label}>
                <Link href={m.href} className="group flex items-center gap-2 text-sm text-navy-800 hover:text-electric-600">
                  <span className="size-1.5 rounded-full bg-warning-600" aria-hidden />
                  {m.label}
                  <ArrowRight className="size-3.5 opacity-0 transition group-hover:opacity-100" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <section aria-labelledby="recent-title">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="recent-title" className="text-lg font-semibold">Candidatures récentes</h2>
          {applications.length > 0 && <Link href="/espace/candidatures" className="text-sm font-medium text-electric-600 hover:underline">Tout voir</Link>}
        </div>
        {applications.length === 0 ? (
          <EmptyState
            icon={<Search />}
            title="Aucune candidature pour l'instant"
            description="Trouvez une offre qui correspond à vos disponibilités et postulez en quelques clics."
            action={<ButtonLink href="/offres">Rechercher une offre</ButtonLink>}
          />
        ) : (
          <Card className="divide-y divide-line">
            {applications.slice(0, 5).map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-5">
                <div className="min-w-0">
                  {a.offer ? (
                    <Link href={`/offres/${a.offer.slug}`} className="font-medium text-navy-950 hover:text-electric-600">{a.offer.title}</Link>
                  ) : (
                    <span className="font-medium text-ink-muted">Offre supprimée</span>
                  )}
                  <p className="text-sm text-ink-muted">
                    {a.offer?.companyName} · envoyée {formatRelativeDate(a.createdAt).toLowerCase()}
                  </p>
                </div>
                <ApplicationStatusBadge status={a.status} />
              </div>
            ))}
          </Card>
        )}
      </section>

      <p className="text-xs text-ink-subtle">
        Statuts possibles : {APPLICATION_STATUSES.map((s) => s.label).join(" → ")}.
      </p>
    </div>
  );
}

function Stat({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: number; href: string }) {
  return (
    <Link href={href} className="group rounded-card bg-surface p-5 shadow-card ring-1 ring-line transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-center justify-between text-ink-subtle [&_svg]:size-4">
        <span className="text-sm text-ink-muted">{label}</span>
        {icon}
      </div>
      <p className="mt-3 text-3xl font-semibold text-navy-950">{value}</p>
    </Link>
  );
}
