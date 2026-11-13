import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { siteConfig } from "@/lib/config/site";

const points = ["Gratuit pour les candidats", "Filtrez par horaires et disponibilités", "Suivez vos candidatures en temps réel"];

/** Layout écran partagé pour connexion / inscription / mot de passe oublié. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <main id="contenu" className="flex flex-col px-4 py-6 sm:px-8">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">{children}</div>
      </main>
      <aside className="relative hidden overflow-hidden bg-navy-950 lg:flex lg:flex-col lg:justify-end lg:p-14">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-25 invert [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" aria-hidden />
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-electric-500/30 blur-3xl" aria-hidden />
        <div className="relative">
          <p className="text-4xl font-semibold leading-tight text-white">{siteConfig.tagline}</p>
          <ul className="mt-8 space-y-3">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-3 text-navy-200">
                <CheckCircle2 className="size-5 text-electric-400" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
