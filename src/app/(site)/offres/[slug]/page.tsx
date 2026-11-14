import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  Briefcase, Building2, CalendarDays, CalendarRange, Check, Clock, FlaskConical, GraduationCap, Laptop, MapPin, Sparkles, Timer, Wallet,
} from "lucide-react";
import { getOfferBySlug, getSimilarOffers } from "@/lib/jobs/queries";
import { CONTRACT_TYPES, SCHEDULES, SECTORS, WORK_TIMES, labelOf } from "@/lib/config/taxonomy";
import { formatSalary } from "@/components/jobs/format";
import { JobCard } from "@/components/jobs/job-card";
import { ShareButton } from "@/components/jobs/share-button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Callout, CompanyAvatar, DemoBadge } from "@/components/ui/misc";
import { jobPostingJsonLd, safeJsonLd } from "@/lib/seo/job-posting";
import { getCurrentUser } from "@/lib/auth/session";
import { getOfferInteraction } from "@/lib/candidate/queries";
import { ApplyPanel } from "@/components/candidate/apply-panel";
import { SaveJobButton } from "@/components/candidate/action-buttons";
import { ApplicationStatusBadge } from "@/components/candidate/application-status-badge";
import { formatRelativeDate } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const offer = await getOfferBySlug((await params).slug);
  if (!offer) return { title: "Offre introuvable", robots: { index: false } };
  const title = `${offer.title} (${labelOf(CONTRACT_TYPES, offer.contractType)}) — ${offer.city}`;
  return {
    title,
    description: `${offer.companyName} recrute : ${offer.shortDescription}`.slice(0, 160),
    // Les offres fictives ne doivent jamais être indexées par les moteurs de recherche.
    robots: offer.isDemo ? { index: false, follow: false } : undefined,
    alternates: { canonical: `/offres/${offer.slug}` },
    openGraph: { title, description: offer.shortDescription, type: "article" },
  };
}

const REMOTE = { none: "Sur site", partial: "Télétravail partiel", full: "Télétravail complet" } as const;
const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export default async function OfferPage({ params }: Props) {
  const offer = await getOfferBySlug((await params).slug);
  if (!offer) notFound();
  const [similar, salary] = [await getSimilarOffers(offer), formatSalary(offer)];
  const jsonLd = jobPostingJsonLd(offer);
  const user = offer.isDemo ? null : await getCurrentUser();
  const interaction = user?.profile.role === "candidate" ? await getOfferInteraction(user.id, offer.id) : null;
  const loginHref = `/connexion?suite=${encodeURIComponent(`/offres/${offer.slug}`)}`;
  if (!offer.isDemo) {
    // Statistique de vues, enregistrée après l'envoi de la page (n'allonge pas le temps de réponse).
    // La base ignore les vues du recruteur propriétaire et les offres non publiées.
    // Le client est créé avant after() : les cookies ne sont plus lisibles une fois la réponse envoyée.
    const supabase = await createClient();
    await supabase.auth.getSession(); // lit la session maintenant (cookies)
    after(async () => {
      await supabase.rpc("record_offer_view", { offer: offer.id });
    });
  }

  const facts = [
    { icon: Briefcase, label: "Contrat", value: labelOf(CONTRACT_TYPES, offer.contractType) },
    offer.durationMonths && { icon: CalendarRange, label: "Durée", value: `${offer.durationMonths} mois` },
    { icon: Clock, label: "Temps de travail", value: `${labelOf(WORK_TIMES, offer.workTime)}${offer.hoursPerWeek ? ` · ${offer.hoursPerWeek} h/semaine` : ""}` },
    { icon: Timer, label: "Horaires", value: offer.schedules.map((s) => labelOf(SCHEDULES, s)).join(", ") },
    { icon: MapPin, label: "Lieu", value: `${offer.city} (${offer.postalCode})` },
    { icon: Laptop, label: "Télétravail", value: REMOTE[offer.remote] },
    { icon: Wallet, label: "Salaire", value: salary ?? "Non communiqué" },
  ].filter(Boolean) as { icon: typeof Briefcase; label: string; value: string }[];

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />}
      <div className="container-page py-8 sm:py-12">
        <nav aria-label="Fil d'Ariane" className="text-sm text-ink-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:text-navy-950">Accueil</Link></li>
            <li aria-hidden>/</li>
            <li><Link href="/offres" className="hover:text-navy-950">Offres</Link></li>
            <li aria-hidden>/</li>
            <li><Link href={`/offres?secteur=${offer.sector}`} className="hover:text-navy-950">{labelOf(SECTORS, offer.sector)}</Link></li>
          </ol>
        </nav>

        {offer.isDemo && (
          <Callout tone="warning" className="mt-6">
            <strong>Offre fictive de démonstration.</strong> Cette annonce n&apos;existe pas : l&apos;entreprise et le poste ont été
            inventés pour présenter l&apos;interface. Il n&apos;est pas possible d&apos;y postuler.
          </Callout>
        )}

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px]">
          <article className="min-w-0">
            <header className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <CompanyAvatar name={offer.companyName} logoUrl={offer.companyLogoUrl} className="size-14 text-base" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-ink-muted">{offer.companyName}</p>
                  {offer.isDemo && <DemoBadge />}
                </div>
                <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">{offer.title}</h1>
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
                  <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" aria-hidden />{offer.city}</span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-4" aria-hidden />
                    Publiée <time dateTime={offer.publishedAt}>{formatRelativeDate(offer.publishedAt).toLowerCase()}</time>
                  </span>
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Badge tone="dark">{labelOf(CONTRACT_TYPES, offer.contractType)}</Badge>
                  <Badge>{labelOf(WORK_TIMES, offer.workTime)}</Badge>
                  <Badge>{labelOf(SECTORS, offer.sector)}</Badge>
                  {offer.isStudentFriendly && <Badge tone="success"><GraduationCap aria-hidden /> Compatible études</Badge>}
                  {offer.isFeatured && <Badge tone="electric"><Sparkles aria-hidden /> À la une</Badge>}
                </div>
              </div>
            </header>

            <div className="mt-10 space-y-10">
              <Section title="Le poste">
                <p className="leading-relaxed text-navy-800">{offer.shortDescription}</p>
              </Section>
              <Section title="Vos missions"><Bullets items={offer.missions} /></Section>
              <Section title="Profil recherché"><Bullets items={offer.profile} /></Section>
              {offer.benefits.length > 0 && <Section title="Avantages"><Bullets items={offer.benefits} /></Section>}
              <Section title={`À propos de ${offer.companyName}`}>
                <div className="flex gap-4 rounded-card bg-surface p-5 ring-1 ring-line">
                  <Building2 className="mt-0.5 size-5 shrink-0 text-ink-subtle" aria-hidden />
                  <p className="text-sm leading-relaxed text-navy-800">{offer.companyDescription}</p>
                </div>
              </Section>
            </div>
          </article>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card className="p-6">
              {salary && (
                <div className="mb-5 border-b border-line pb-5">
                  <p className="text-xs text-ink-subtle">Rémunération</p>
                  <p className="mt-0.5 text-xl font-semibold text-navy-950">{salary}</p>
                </div>
              )}
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
              <div className="mt-6 space-y-2">
                {offer.isDemo ? (
                  <Button className="w-full" size="lg" disabled>
                    <FlaskConical aria-hidden /> Candidature indisponible
                  </Button>
                ) : !user ? (
                  <>
                    <ButtonLink href={loginHref} className="w-full" size="lg">
                      Postuler
                    </ButtonLink>
                    <ButtonLink href={loginHref} variant="secondary" className="w-full">
                      Enregistrer l&apos;offre
                    </ButtonLink>
                  </>
                ) : interaction ? (
                  <>
                    {interaction.application ? (
                      <div className="rounded-xl bg-success-50 p-4 text-sm ring-1 ring-inset ring-success-600/20" role="status">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 font-medium text-success-600">
                            <Check className="size-4" aria-hidden /> Candidature envoyée
                          </span>
                          <ApplicationStatusBadge status={interaction.application.status} />
                        </div>
                        <p className="mt-1 text-ink-muted">
                          Le {dateFmt.format(new Date(interaction.application.created_at))}.{" "}
                          <Link href="/espace/candidatures" className="font-medium text-electric-600 hover:underline">Suivre ma candidature</Link>
                        </p>
                      </div>
                    ) : (
                      <ApplyPanel offerId={offer.id} cvFilename={user.profile.cv_filename} />
                    )}
                    <SaveJobButton offerId={offer.id} initialSaved={interaction.saved} />
                  </>
                ) : (
                  <p className="rounded-xl bg-navy-50/60 p-4 text-sm text-ink-muted">Connectez-vous avec un compte candidat pour postuler.</p>
                )}
                <ShareButton title={offer.title} path={`/offres/${offer.slug}`} />
              </div>
              <p className="mt-5 text-xs text-ink-subtle">
                Offre valable jusqu&apos;au {dateFmt.format(new Date(offer.validThrough))}.
              </p>
            </Card>
          </aside>
        </div>

        {similar.length > 0 && (
          <section className="mt-20" aria-labelledby="similar-title">
            <h2 id="similar-title" className="text-xl font-semibold">Offres similaires</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {similar.map((o) => <JobCard key={o.id} offer={o} />)}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((m) => (
        <li key={m} className="flex gap-3 text-navy-800">
          <Check className="mt-1 size-4 shrink-0 text-electric-500" aria-hidden />
          {m}
        </li>
      ))}
    </ul>
  );
}
