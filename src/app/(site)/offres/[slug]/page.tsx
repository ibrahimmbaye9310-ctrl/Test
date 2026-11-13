import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Briefcase, CalendarDays, Clock, FlaskConical, GraduationCap, MapPin, Wallet } from "lucide-react";
import { getOfferBySlug } from "@/lib/jobs/queries";
import { CONTRACT_TYPES, SCHEDULES, SECTORS, WORK_TIMES, labelOf } from "@/lib/config/taxonomy";
import { formatSalary } from "@/components/jobs/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout, CompanyAvatar, DemoBadge } from "@/components/ui/misc";
import { formatRelativeDate } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const offer = await getOfferBySlug((await params).slug);
  if (!offer) return { title: "Offre introuvable" };
  return {
    title: `${offer.title} — ${offer.city}`,
    description: offer.shortDescription,
    // Les offres fictives ne doivent jamais être indexées par les moteurs de recherche.
    robots: offer.isDemo ? { index: false, follow: false } : undefined,
    alternates: { canonical: `/offres/${offer.slug}` },
  };
}

export default async function OfferPage({ params }: Props) {
  const offer = await getOfferBySlug((await params).slug);
  if (!offer) notFound();
  const salary = formatSalary(offer);

  const facts = [
    { icon: Briefcase, label: "Contrat", value: labelOf(CONTRACT_TYPES, offer.contractType) },
    { icon: Clock, label: "Temps de travail", value: labelOf(WORK_TIMES, offer.workTime) },
    { icon: CalendarDays, label: "Horaires", value: offer.schedules.map((s) => labelOf(SCHEDULES, s)).join(", ") },
    { icon: MapPin, label: "Lieu", value: `${offer.city} (${offer.postalCode})` },
    { icon: Wallet, label: "Salaire", value: salary ?? "Non communiqué" },
  ];

  return (
    <div className="container-page py-10 sm:py-14">
      <Link href="/offres" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-navy-950">
        <ArrowLeft className="size-4" aria-hidden /> Retour aux offres
      </Link>

      {offer.isDemo && (
        <Callout tone="warning" className="mt-6">
          <strong>Offre fictive de démonstration.</strong> Cette annonce n&apos;existe pas : l&apos;entreprise et le poste ont été
          inventés pour présenter l&apos;interface. Il n&apos;est pas possible d&apos;y postuler.
        </Callout>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <article>
          <div className="flex items-start gap-4">
            <CompanyAvatar name={offer.companyName} className="size-14 text-base" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-ink-muted">{offer.companyName}</p>
                {offer.isDemo && <DemoBadge />}
              </div>
              <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">{offer.title}</h1>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Badge tone="dark">{labelOf(CONTRACT_TYPES, offer.contractType)}</Badge>
                <Badge>{labelOf(WORK_TIMES, offer.workTime)}</Badge>
                <Badge>{labelOf(SECTORS, offer.sector)}</Badge>
                {offer.isStudentFriendly && (
                  <Badge tone="success">
                    <GraduationCap aria-hidden /> Compatible études
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <section className="mt-10">
            <h2 className="text-xl font-semibold">Description du poste</h2>
            <p className="mt-3 leading-relaxed text-navy-800">{offer.shortDescription}</p>
            <p className="mt-4 text-sm text-ink-subtle">
              La description complète (missions, profil recherché, avantages) sera saisie par le recruteur depuis son espace
              (phase 4).
            </p>
          </section>
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="p-6">
            <dl className="space-y-4">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-3">
                  <Icon className="mt-0.5 size-4 shrink-0 text-ink-subtle" aria-hidden />
                  <div>
                    <dt className="text-xs text-ink-subtle">{label}</dt>
                    <dd className="text-sm font-medium text-navy-900">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
            <p className="mt-5 border-t border-line pt-4 text-xs text-ink-subtle">
              Publiée <time dateTime={offer.publishedAt}>{formatRelativeDate(offer.publishedAt).toLowerCase()}</time>
            </p>
            {offer.isDemo ? (
              <Button className="mt-5 w-full" size="lg" disabled>
                <FlaskConical aria-hidden /> Candidature indisponible (offre fictive)
              </Button>
            ) : null}
          </Card>
        </aside>
      </div>
    </div>
  );
}
