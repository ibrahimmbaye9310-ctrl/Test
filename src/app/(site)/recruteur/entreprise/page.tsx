import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { getMyCompany } from "@/lib/recruiter/queries";
import { logoUrl } from "@/lib/storage";
import { ProfileSection } from "@/components/candidate/profile-forms";
import { CompanyForm, LogoUpload } from "@/components/recruiter/company-form";
import { Callout } from "@/components/ui/misc";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Entreprise" };

export default async function CompanyPage() {
  const user = await requireUser(["recruiter"], "/recruteur/entreprise");
  const company = await getMyCompany(user.id);
  let suggested: string | undefined;
  if (!company) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    suggested = (data.user?.user_metadata?.company_name as string | undefined)?.slice(0, 120);
  }
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">{company ? "Profil de l'entreprise" : "Créez votre entreprise"}</h1>
        <p className="mt-1.5 text-ink-muted">Ces informations sont publiques : elles accompagnent chacune de vos offres.</p>
      </header>
      {!company && <Callout>Dernière étape avant de publier : présentez votre entreprise aux candidats.</Callout>}
      <ProfileSection id="informations" title="Informations">
        <CompanyForm company={company} suggestedName={suggested} />
      </ProfileSection>
      {company && (
        <ProfileSection id="logo" title="Logo">
          <LogoUpload name={company.name} url={logoUrl(company.logo_path)} />
        </ProfileSection>
      )}
    </div>
  );
}
