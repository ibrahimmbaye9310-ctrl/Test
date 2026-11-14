import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { siteConfig } from "@/lib/config/site";

const columns = [
  {
    title: "Candidats",
    links: [
      { href: "/offres", label: "Rechercher une offre" },
      { href: "/offres?etudiant=1", label: "Jobs étudiants" },
      { href: "/offres?temps=part_time", label: "Temps partiel" },
      { href: "/inscription", label: "Créer mon profil" },
    ],
  },
  {
    title: "Entreprises",
    links: [
      { href: "/entreprises", label: "Recruter avec JobFinder" },
      { href: "/tarifs", label: "Tarifs" },
      { href: "/inscription?role=recruteur", label: "Créer un compte entreprise" },
    ],
  },
  {
    title: "JobFinder",
    links: [
      { href: "/contact", label: "Contact" },
      { href: "/#faq", label: "Questions fréquentes" },
    ],
  },
  {
    title: "Légal",
    links: [
      { href: "/mentions-legales", label: "Mentions légales" },
      { href: "/confidentialite", label: "Politique de confidentialité" },
      { href: "/confidentialite#cookies", label: "Cookies" },
      { href: "/cgu", label: "Conditions d'utilisation" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">
              {siteConfig.tagline} La plateforme de recrutement pensée pour les étudiants, les actifs et les entreprises
              d&apos;{siteConfig.launchRegion}.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-navy-950">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-ink-muted transition-colors hover:text-navy-950">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-xs text-ink-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} JobFinder. Tous droits réservés.</p>
          <p>Conçu en Île-de-France · Données hébergées dans l&apos;Union européenne</p>
        </div>
      </div>
    </footer>
  );
}
