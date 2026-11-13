import Link from "next/link";
import { ArrowUpRight, Briefcase, Code2, GraduationCap, HeartPulse, ShoppingBag, Truck, UtensilsCrossed, Wrench } from "lucide-react";
import { SectionHeading } from "@/components/ui/misc";

const categories = [
  { href: "/offres?secteur=retail", label: "Commerce & vente", icon: ShoppingBag },
  { href: "/offres?secteur=hospitality", label: "Restauration & hôtellerie", icon: UtensilsCrossed },
  { href: "/offres?secteur=logistics", label: "Logistique & transport", icon: Truck },
  { href: "/offres?secteur=tech", label: "Tech & numérique", icon: Code2 },
  { href: "/offres?secteur=health", label: "Santé & social", icon: HeartPulse },
  { href: "/offres?secteur=admin", label: "Administratif & support", icon: Briefcase },
  { href: "/offres?secteur=construction", label: "BTP & artisanat", icon: Wrench },
  { href: "/offres?etudiant=1", label: "Jobs étudiants", icon: GraduationCap },
];

export function Categories() {
  return (
    <section className="container-page py-20 sm:py-24" aria-labelledby="categories-title">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <SectionHeading eyebrow="Catégories populaires" title={<span id="categories-title">Explorez par secteur</span>} />
        <Link href="/offres" className="text-sm font-medium text-electric-600 hover:underline">
          Toutes les offres →
        </Link>
      </div>
      <ul className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {categories.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex h-full items-center gap-3 rounded-2xl bg-surface p-4 ring-1 ring-line transition-all hover:-translate-y-0.5 hover:shadow-lift hover:ring-line-strong sm:p-5"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700 transition-colors group-hover:bg-electric-500 group-hover:text-white">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="flex-1 text-sm font-medium leading-snug text-navy-900">{label}</span>
              <ArrowUpRight className="hidden size-4 text-ink-subtle transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-electric-600 sm:block" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
