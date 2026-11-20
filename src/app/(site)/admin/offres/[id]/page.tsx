import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAdminOffer } from "@/lib/admin/queries";
import { ModerateOfferButtons } from "@/components/admin/admin-actions";
import { displayOfferStatus } from "@/lib/config/offer-status";
import { CONTRACT_TYPES, SCHEDULES, SECTORS, WORK_TIMES, labelOf } from "@/lib/config/taxonomy";
import { formatSalary } from "@/components/jobs/format";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Aperçu de l'offre" };

/** Aperçu complet pour la modération, quel que soit le statut de l'offre. */
export default async function AdminOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const o = await getAdminOffer((await params).id);
  if (!o) notFound();
  const company = o.companies as unknown as { id: string; name: string; is_verified: boolean; description: string | null; website: string | null; siret: string | null };
  const st = displayOfferStatus(o.status, o.expires_at);
  const salary = formatSalary({ salaryMin: o.salary_min, salaryMax: o.salary_max, salaryPeriod: o.salary_period });
  const list = (title: string, items: string[]) => items.length > 0 && (
    <div><h3 className="font-semibold">{title}</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-navy-800">{items.map((i) => <li key={i}>{i}</li>)}</ul></div>
  );
  return (
    <div className="space-y-6">
      <Link href="/admin/moderation" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-navy-950"><ArrowLeft className="size-4" aria-hidden /> Modération</Link>
      <header className="space-y-2">
        <Badge tone={st.tone}>{st.label}</Badge>
        <h1 className="text-2xl font-semibold">{o.title}</h1>
        <p className="text-sm text-ink-muted">{labelOf(CONTRACT_TYPES, o.contract_type)} · {labelOf(WORK_TIMES, o.work_time)} · {labelOf(SECTORS, o.sector)} · {o.city} ({o.postal_code}) · {salary ?? "salaire non communiqué"}</p>
        <p className="text-sm text-ink-muted">Horaires : {o.schedules.map((s) => labelOf(SCHEDULES, s)).join(", ") || "—"}</p>
      </header>
      <Card className="p-5"><ModerateOfferButtons offerId={o.id} status={o.status} /></Card>
      <Card className="space-y-5 p-6">
        <p className="text-navy-800">{o.short_description}</p>
        {list("Missions", o.missions)}
        {list("Profil", o.profile)}
        {list("Avantages", o.benefits)}
      </Card>
      <Card className="space-y-1 p-6 text-sm">
        <h2 className="font-semibold">{company.name} {company.is_verified ? <Badge tone="success">Vérifiée</Badge> : <Badge>Non vérifiée</Badge>}</h2>
        <p className="text-ink-muted">SIRET : {company.siret ?? "non renseigné"} · Site : {company.website ?? "—"}</p>
        {company.description && <p className="pt-2 text-navy-800">{company.description}</p>}
        <Link href={`/admin/entreprises?q=${encodeURIComponent(company.name)}`} className="inline-block pt-2 font-medium text-electric-600 hover:underline">Gérer l&apos;entreprise</Link>
      </Card>
    </div>
  );
}
