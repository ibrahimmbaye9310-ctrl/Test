import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, MapPin, Phone } from "lucide-react";
import { candidateFileUrl, getReceivedApplication, requireCompany } from "@/lib/recruiter/queries";
import { CONTRACT_TYPES, SCHEDULES, WORK_TIMES, labelOf } from "@/lib/config/taxonomy";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { UserAvatar } from "@/components/candidate/user-avatar";
import { ApplicationStatusSelect } from "@/components/recruiter/application-status-select";
import { formatRelativeDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Candidature" };

export default async function ReceivedApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { company } = await requireCompany(`/recruteur/candidatures/${id}`);
  const app = await getReceivedApplication(company.id, id);
  if (!app) notFound();
  const c = app.candidate;
  const avatar = await candidateFileUrl("avatars", c.avatar_path, 600);

  return (
    <div className="space-y-6">
      <Link href="/recruteur/candidatures" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-navy-950">
        <ArrowLeft className="size-4" aria-hidden /> Candidatures
      </Link>

      <header className="flex flex-wrap items-start gap-4">
        <UserAvatar name={c.full_name} url={avatar} className="size-16 text-lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold">{c.full_name}</h1>
          {c.headline && <p className="text-ink-muted">{c.headline}</p>}
          <p className="mt-1 text-sm text-ink-subtle">
            A postulé {formatRelativeDate(app.createdAt).toLowerCase()} à{" "}
            <Link href={`/recruteur/offres/${app.offer.id}`} className="font-medium text-electric-600 hover:underline">{app.offer.title}</Link>
          </p>
        </div>
        {c.cv_path ? (
          <ButtonLink href={`/recruteur/candidatures/${app.id}/cv`} target="_blank" rel="noopener"><Download aria-hidden /> Télécharger le CV</ButtonLink>
        ) : (
          <Badge>Pas de CV</Badge>
        )}
      </header>

      <Card className="p-5 sm:p-6">
        <h2 className="mb-3 font-semibold">Statut de la candidature</h2>
        <ApplicationStatusSelect applicationId={app.id} status={app.status} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          {app.coverMessage && (
            <Card className="p-5 sm:p-6">
              <h2 className="mb-2 font-semibold">Message du candidat</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-navy-800">{app.coverMessage}</p>
            </Card>
          )}
          {c.bio && (
            <Card className="p-5 sm:p-6">
              <h2 className="mb-2 font-semibold">Présentation</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-navy-800">{c.bio}</p>
            </Card>
          )}
          <Card className="p-5 sm:p-6">
            <h2 className="mb-3 font-semibold">Compétences</h2>
            {c.skills.length ? (
              <ul className="flex flex-wrap gap-2">{c.skills.map((s) => <li key={s}><Badge>{s}</Badge></li>)}</ul>
            ) : (
              <p className="text-sm text-ink-subtle">Non renseignées.</p>
            )}
          </Card>
        </div>
        <aside className="space-y-4">
          <Card className="space-y-4 p-5 text-sm">
            <h2 className="font-semibold">Coordonnées</h2>
            {c.phone ? (
              <p className="flex items-center gap-2"><Phone className="size-4 text-ink-subtle" aria-hidden /><span className="select-all">{c.phone}</span></p>
            ) : (
              <p className="text-ink-subtle">Téléphone non renseigné.</p>
            )}
            {c.city && <p className="flex items-center gap-2"><MapPin className="size-4 text-ink-subtle" aria-hidden />{c.city}{c.postal_code ? ` (${c.postal_code})` : ""}</p>}
            <p className="text-xs text-ink-subtle">Utilisez ces informations uniquement pour ce recrutement (RGPD).</p>
          </Card>
          <Card className="space-y-3 p-5 text-sm">
            <h2 className="font-semibold">Disponibilités</h2>
            <p>{c.availability.length ? c.availability.map((s) => labelOf(SCHEDULES, s)).join(", ") : "Non renseignées"}</p>
            {c.availability_note && <p className="text-ink-muted">{c.availability_note}</p>}
            <h2 className="pt-2 font-semibold">Recherche</h2>
            <p>
              {[c.desired_contracts.map((x) => labelOf(CONTRACT_TYPES, x)).join(", "), c.desired_work_time && labelOf(WORK_TIMES, c.desired_work_time)].filter(Boolean).join(" · ") || "Non précisé"}
            </p>
            {c.open_to_work && <Badge tone="success">En recherche active</Badge>}
          </Card>
        </aside>
      </div>
    </div>
  );
}
