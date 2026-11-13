import { BellRing, FileUser, Send } from "lucide-react";
import { SectionHeading } from "@/components/ui/misc";

const steps = [
  {
    icon: FileUser,
    title: "Créez votre profil",
    text: "Ajoutez votre CV, vos compétences et surtout vos disponibilités : matin, soir, week-end… Gratuit, en 3 minutes.",
  },
  {
    icon: Send,
    title: "Postulez en un clic",
    text: "Filtrez par contrat, horaires, distance et salaire, puis envoyez votre candidature avec votre profil déjà rempli.",
  },
  {
    icon: BellRing,
    title: "Suivez chaque étape",
    text: "Envoyée, en cours d'examen, entretien, réponse : vous savez toujours où en est votre candidature.",
  },
];

export function HowItWorks() {
  return (
    <section id="fonctionnement" className="container-page py-20 sm:py-24" aria-labelledby="how-title">
      <SectionHeading
        align="center"
        eyebrow="Comment ça marche"
        title={<span id="how-title">Trois étapes, zéro friction</span>}
        description="JobFinder est gratuit pour les candidats. Pas de lettre de motivation obligatoire, pas de formulaire interminable."
      />
      <ol className="relative mt-14 grid gap-6 md:grid-cols-3">
        <div className="absolute left-[16%] right-[16%] top-7 hidden h-px bg-gradient-to-r from-transparent via-line-strong to-transparent md:block" aria-hidden />
        {steps.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="relative flex flex-col items-center text-center">
            <div className="relative flex size-14 items-center justify-center rounded-2xl bg-surface text-navy-900 shadow-card ring-1 ring-line">
              <Icon className="size-6" aria-hidden />
              <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-electric-500 text-xs font-semibold text-white">
                {i + 1}
              </span>
            </div>
            <h3 className="mt-6 text-lg font-semibold">{title}</h3>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-muted">{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
