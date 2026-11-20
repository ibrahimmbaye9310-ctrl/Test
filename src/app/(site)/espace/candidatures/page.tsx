import type { Metadata } from "next";
import Link from "next/link";
import { Check, Search } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getMyApplications } from "@/lib/candidate/queries";
import { APPLICATION_STATUSES, applicationStatus } from "@/lib/config/applications";
import { CONTRACT_TYPES, labelOf } from "@/lib/config/taxonomy";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { ApplicationStatusBadge } from "@/components/candidate/application-status-badge";
import { WithdrawButton } from "@/components/candidate/action-buttons";
import { cn, formatRelativeDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Mes candidatures" };

const FLOW = ["sent", "reviewing", "interview"] as const;

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const { statut } = await searchParams;
  const user = await requireUser(["candidate"]);
  const all = await getMyApplications(user.id);
  const filter = APPLICATION_STATUSES.some((s) => s.value === statut) ? statut : undefined;
  const list = filter ? all.filter((a) => a.status === filter) : all;
  const tabs = [{ value: undefined, label: "Toutes", count: all.length }, ...APPLICATION_STATUSES.map((s) => ({ value: s.value, label: s.label, count: all.filter((a) => a.status === s.value).length }))];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">Mes candidatures</h1>
        <p className="mt-1.5 text-ink-muted">Suivez chaque étape : le statut change dès que le recruteur fait avancer votre candidature.</p>
      </header>

      <nav aria-label="Filtrer par statut" className="-mx-4 overflow-x-auto px-4">
        <ul className="flex gap-2">
          {tabs.map((t) => (
            <li key={t.label} className="shrink-0">
              <Link
                href={t.value ? `/espace/candidatures?statut=${t.value}` : "/espace/candidatures"}
                aria-current={filter === t.value ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm ring-1 transition",
                  filter === t.value ? "bg-navy-900 text-white ring-navy-900" : "bg-surface text-navy-700 ring-line-strong hover:ring-navy-300",
                )}
              >
                {t.label} <span className="opacity-60">{t.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {list.length === 0 ? (
        <EmptyState
          icon={<Search />}
          title={filter ? "Aucune candidature avec ce statut" : "Aucune candidature pour l'instant"}
          description="Les offres auxquelles vous postulez apparaîtront ici avec leur statut."
          action={<ButtonLink href="/offres">Rechercher une offre</ButtonLink>}
        />
      ) : (
        <ul className="space-y-3">
          {list.map((a) => {
            const s = applicationStatus(a.status);
            const step = FLOW.indexOf(a.status as (typeof FLOW)[number]);
            const final = a.status === "accepted" || a.status === "rejected";
            return (
              <li key={a.id}>
                <Card className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      {a.offer ? (
                        <Link href={`/offres/${a.offer.slug}`} className="text-base font-semibold text-navy-950 hover:text-electric-600">{a.offer.title}</Link>
                      ) : (
                        <p className="font-semibold text-ink-muted">Offre supprimée par le recruteur</p>
                      )}
                      {a.offer && (
                        <p className="mt-0.5 text-sm text-ink-muted">
                          {a.offer.companyName} · {a.offer.city} · {labelOf(CONTRACT_TYPES, a.offer.contractType)}
                          {a.offer.status !== "published" && " · offre fermée"}
                        </p>
                      )}
                    </div>
                    <ApplicationStatusBadge status={a.status} />
                  </div>

                  <ol className="mt-5 flex items-center gap-2" aria-label="Avancement">
                    {[...FLOW, "final" as const].map((f, i) => {
                      const reached = final || i <= step;
                      const label = f === "final" ? (final ? s.label : "Réponse") : applicationStatus(f).label;
                      return (
                        <li key={f} className="flex flex-1 flex-col gap-1.5">
                          <span className={cn("h-1.5 rounded-full", reached ? (a.status === "rejected" && f === "final" ? "bg-danger-600" : "bg-electric-500") : "bg-navy-100")} />
                          <span className={cn("hidden text-xs sm:flex sm:items-center sm:gap-1", reached ? "text-navy-800" : "text-ink-subtle")}>
                            {reached && <Check className="size-3" aria-hidden />}
                            {label}
                          </span>
                        </li>
                      );
                    })}
                  </ol>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                    <p className="text-xs text-ink-subtle">
                      {s.description} Envoyée {formatRelativeDate(a.createdAt).toLowerCase()}
                      {a.statusUpdatedAt !== a.createdAt && ` · mise à jour ${formatRelativeDate(a.statusUpdatedAt).toLowerCase()}`}.
                    </p>
                    {(a.status === "sent" || a.status === "reviewing") && <WithdrawButton applicationId={a.id} />}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
