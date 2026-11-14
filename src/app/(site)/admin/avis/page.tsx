import type { Metadata } from "next";
import { getTestimonials } from "@/lib/admin/queries";
import { AdminHeader } from "@/components/admin/admin-ui";
import { TestimonialButtons } from "@/components/admin/admin-actions";
import { TestimonialForm } from "@/components/admin/testimonial-form";
import { ProfileSection } from "@/components/candidate/profile-forms";
import { Badge } from "@/components/ui/badge";
import { Callout } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Avis" };
const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export default async function TestimonialsAdminPage() {
  const items = await getTestimonials();
  return (
    <div className="space-y-6">
      <AdminHeader title="Avis utilisateurs" description="Seuls les avis publiés apparaissent sur la page d'accueil." />
      <Callout tone="warning">
        Publier un avis inventé ou modifié est une pratique commerciale trompeuse (article L121-4 du Code de la consommation).
        Conservez la preuve du consentement de chaque auteur.
      </Callout>
      <ProfileSection id="nouvel-avis" title="Ajouter un avis">
        <TestimonialForm />
      </ProfileSection>
      <ul className="space-y-3">
        {items.map((t) => (
          <li key={t.id} className="rounded-card bg-surface p-5 shadow-card ring-1 ring-line">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 max-w-2xl">
                <p className="text-sm text-navy-800">« {t.quote} »</p>
                <p className="mt-2 text-sm font-medium">{t.author_name} <span className="font-normal text-ink-muted">· {t.author_role}</span></p>
                <p className="text-xs text-ink-subtle">Consentement du {dateFmt.format(new Date(t.consent_at))}</p>
              </div>
              <Badge tone={t.is_published ? "success" : "neutral"}>{t.is_published ? "Publié" : "Non publié"}</Badge>
            </div>
            <div className="mt-3"><TestimonialButtons id={t.id} published={t.is_published} /></div>
          </li>
        ))}
        {items.length === 0 && <li className="text-sm text-ink-muted">Aucun avis enregistré.</li>}
      </ul>
    </div>
  );
}
