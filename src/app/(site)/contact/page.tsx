import type { Metadata } from "next";
import { Building2, LifeBuoy, Mail, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = { title: "Contact", alternates: { canonical: "/contact" } };

const channels = [
  { icon: LifeBuoy, title: "Aide candidats", text: "Compte, candidatures, CV.", subject: "Aide candidat" },
  { icon: Building2, title: "Entreprises", text: "Abonnements, facturation, annonces.", subject: "Entreprise" },
  { icon: ShieldCheck, title: "Données personnelles", text: "Exercer vos droits RGPD.", subject: "Données personnelles" },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader title="Contactez-nous" description="Une question, un problème ou une suggestion ? Nous répondons sous 48 h ouvrées." />
      <div className="container-page grid gap-4 py-14 md:grid-cols-3">
        {channels.map(({ icon: Icon, title, text, subject }) => (
          <Card key={title} interactive className="relative p-6">
            <div className="flex size-10 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
              <Icon className="size-5" aria-hidden />
            </div>
            <h2 className="mt-5 font-semibold">
              <a href={`mailto:${siteConfig.contactEmail}?subject=${encodeURIComponent(subject)}`} className="after:absolute after:inset-0">
                {title}
              </a>
            </h2>
            <p className="mt-1.5 text-sm text-ink-muted">{text}</p>
            <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-electric-600">
              <Mail className="size-4" aria-hidden /> {siteConfig.contactEmail}
            </p>
          </Card>
        ))}
      </div>
    </>
  );
}
