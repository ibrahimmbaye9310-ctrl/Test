import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { signedFileUrl } from "@/lib/candidate/queries";
import { AvailabilityForm, FileUpload, InfoForm, PreferencesForm, ProfileSection, SkillsForm } from "@/components/candidate/profile-forms";

export const metadata: Metadata = { title: "Mon profil" };

export default async function ProfilePage() {
  const { profile } = await requireUser(["candidate"]);
  const avatarUrl = await signedFileUrl("avatars", profile.avatar_path);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">Mon profil</h1>
        <p className="mt-1.5 text-ink-muted">Ces informations sont transmises aux recruteurs uniquement lorsque vous postulez.</p>
      </header>
      <ProfileSection id="informations" title="Informations personnelles">
        <InfoForm profile={profile} />
      </ProfileSection>
      <ProfileSection id="photo" title="Photo" description="Facultative. Elle n'est jamais publique.">
        <FileUpload kind="avatar" current={{ name: profile.full_name, url: avatarUrl }} />
      </ProfileSection>
      <ProfileSection id="cv" title="CV" description="Au format PDF. Il sera joint à vos candidatures.">
        <FileUpload kind="cv" current={{ name: profile.cv_filename, url: profile.cv_path ? "/espace/cv" : null, updatedAt: profile.cv_updated_at }} />
      </ProfileSection>
      <ProfileSection id="competences" title="Compétences" description="Appuyez sur Entrée pour ajouter une compétence (30 maximum).">
        <SkillsForm initial={profile.skills} />
      </ProfileSection>
      <ProfileSection id="disponibilites" title="Disponibilités">
        <AvailabilityForm profile={profile} />
      </ProfileSection>
      <ProfileSection id="preferences" title="Préférences professionnelles">
        <PreferencesForm profile={profile} />
      </ProfileSection>
    </div>
  );
}
