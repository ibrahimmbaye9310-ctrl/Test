import type { Metadata } from "next";
import Link from "next/link";
import { FilePlus2, FileText } from "lucide-react";
import { getMyOffers, getReceivedApplications, requireCompany } from "@/lib/recruiter/queries";
import { displayOfferStatus } from "@/lib/config/offer-status";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Callout, EmptyState } from "@/components/ui/misc";
import { ApplicationList } from "@/components/recruiter/application-list";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function RecruiterDashboard({ searchParams }: { searchParams: Promise<{ bienvenue?: string }> }) {
  const { bienvenue } = await searchParams;
  const { company, profile } = await requireCompany("/recruteur");
  const [offers, applications] = await Promise.all([getMyOffers(company.id), getReceivedApplications(company.id)]);
  const online = offers.filter((o) => o.status === "published" && !o.isExpired);
  const views = offers.reduce((s, o) => s + o.views_count, 0);
  const fresh = applications.filter((a) => a.status === "sent");

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Bonjour {profile.full_name.split(" ")[0]}</h1>
          <p className="mt-1.5 text-ink-muted">{company.name}</p>
        </div>
        <ButtonLink href="/recruteur/offres/nouvelle"><FilePlus2 aria-hidden /> Publier une offre</ButtonLink>
      </header>
      {bienvenue && <Callout>Entreprise créée. Ajoutez votre logo depuis l&apos;onglet Entreprise, puis publiez votre première offre.</Callout>}

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Offres en ligne" value={online.length} href="/recruteur/offres" />
        <Stat label="Vues des offres" value={views} href="/recruteur/offres" />
        <Stat label="Candidatures" value={applications.length} href="/recruteur/candidatures" />
        <Stat label="À traiter" value={fresh.length} href="/recruteur/candidatures?statut=sent" highlight={fresh.length > 0} />
      </div>

      <section aria-labelledby="todo-title" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="todo-title" className="text-lg font-semibold">Nouvelles candidatures</h2>
          {applications.length > 0 && <Link href="/recruteur/candidatures" className="text-sm font-medium text-electric-600 hover:underline">Tout voir</Link>}
        </div>
        {fresh.length === 0 ? (
          <p className="rounded-card bg-surface p-5 text-sm text-ink-muted ring-1 ring-line">Aucune candidature en attente. Vous êtes à jour.</p>
        ) : (
          <ApplicationList items={fresh.slice(0, 5)} />
        )}
      </section>

      <section aria-labelledby="offers-title" className="space-y-4">
        <h2 id="offers-title" className="text-lg font-semibold">Vos offres</h2>
        {offers.length === 0 ? (
          <EmptyState icon={<FileText />} title="Aucune offre" description="Créez votre première offre en quelques minutes." action={<ButtonLink href="/recruteur/offres/nouvelle">Créer une offre</ButtonLink>} />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {offers.slice(0, 4).map((o) => {
              const st = displayOfferStatus(o.status, o.expires_at);
              return (
                <li key={o.id}>
                  <Link href={`/recruteur/offres/${o.id}`} className="block rounded-card bg-surface p-4 shadow-card ring-1 ring-line transition hover:shadow-lift">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-navy-950">{o.title}</p>
                      <Badge tone={st.tone}>{st.label}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-ink-muted tabular-nums">{o.views_count} vues · {o.applicationsCount} candidature{o.applicationsCount > 1 ? "s" : ""}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, href, highlight }: { label: string; value: number; href: string; highlight?: boolean }) {
  return (
    <Link href={href} className={`rounded-card p-4 shadow-card ring-1 transition hover:-translate-y-0.5 hover:shadow-lift ${highlight ? "bg-electric-500 text-white ring-electric-500" : "bg-surface ring-line"}`}>
      <p className={`text-xs ${highlight ? "text-electric-100" : "text-ink-muted"}`}>{label}</p>
      <p className={`mt-1.5 text-2xl font-semibold tabular-nums ${highlight ? "text-white" : "text-navy-950"}`}>{value}</p>
    </Link>
  );
}
