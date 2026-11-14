import type { Metadata } from "next";
import { SpaceNav } from "@/components/layout/space-nav";
import { CompanyAvatar } from "@/components/ui/misc";
import { requireUser } from "@/lib/auth/session";
import { getMyCompany } from "@/lib/recruiter/queries";
import { createClient } from "@/lib/supabase/server";
import { logoUrl } from "@/lib/storage";

export const metadata: Metadata = { title: { default: "Espace recruteur", template: "%s · Espace recruteur" }, robots: { index: false } };

export default async function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["recruiter"], "/recruteur");
  const company = await getMyCompany(user.id);
  let newCount = 0;
  if (company) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("applications")
      .select("id, job_offers!inner(company_id)", { count: "exact", head: true })
      .eq("job_offers.company_id", company.id)
      .eq("status", "sent");
    newCount = count ?? 0;
  }
  return (
    <div className="container-page grid gap-6 py-8 lg:grid-cols-[220px_1fr] lg:gap-10 lg:py-12">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="mb-5 hidden items-center gap-3 px-1 lg:flex">
          <CompanyAvatar name={company?.name ?? user.profile.full_name} logoUrl={logoUrl(company?.logo_path)} className="size-10" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-navy-950">{company?.name ?? "Mon entreprise"}</p>
            <p className="truncate text-xs text-ink-subtle">{user.profile.full_name}</p>
          </div>
        </div>
        {company && (
          <SpaceNav
            label="Espace recruteur"
            root="/recruteur"
            items={[
              { href: "/recruteur", label: "Tableau de bord", icon: "dashboard" },
              { href: "/recruteur/offres", label: "Mes offres", icon: "offers" },
              { href: "/recruteur/candidatures", label: "Candidatures", icon: "users", badge: newCount },
              { href: "/recruteur/entreprise", label: "Entreprise", icon: "building" },
              { href: "/recruteur/abonnement", label: "Abonnement", icon: "card" },
              { href: "/recruteur/compte", label: "Compte", icon: "settings" },
            ]}
          />
        )}
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
