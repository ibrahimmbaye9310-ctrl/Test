import type { ReactNode } from "react";
import { FlaskConical, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/** Signale explicitement une donnée fictive de démonstration. */
export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-warning-50 px-1.5 py-0.5 text-[11px] font-medium text-warning-600 ring-1 ring-inset ring-warning-600/20",
        className,
      )}
      title="Offre fictive créée pour la démonstration — ce n'est pas une véritable offre d'emploi."
    >
      <FlaskConical className="size-3" aria-hidden />
      Exemple fictif
    </span>
  );
}

export function Callout({ children, tone = "info", className }: { children: ReactNode; tone?: "info" | "warning"; className?: string }) {
  return (
    <div
      role="note"
      className={cn(
        "flex gap-3 rounded-xl px-4 py-3 text-sm ring-1 ring-inset",
        tone === "info" ? "bg-electric-50 text-navy-800 ring-electric-100" : "bg-warning-50 text-navy-800 ring-warning-600/20",
        className,
      )}
    >
      <Info className={cn("mt-0.5 size-4 shrink-0", tone === "info" ? "text-electric-600" : "text-warning-600")} aria-hidden />
      <div>{children}</div>
    </div>
  );
}

type SectionHeadingProps = { eyebrow?: string; title: ReactNode; description?: ReactNode; align?: "left" | "center"; className?: string };

export function SectionHeading({ eyebrow, title, description, align = "left", className }: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <p className="mb-3 text-sm font-semibold text-electric-600">{eyebrow}</p>}
      <h2 className="text-3xl font-semibold sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">{description}</p>}
    </div>
  );
}

/** Logo de l'entreprise s'il existe, sinon ses initiales. */
export function CompanyAvatar({ name, logoUrl, className }: { name: string; logoUrl?: string | null; className?: string }) {
  if (logoUrl)
    return (
      // eslint-disable-next-line @next/next/no-img-element -- logo déjà optimisé côté stockage, taille fixe
      <img src={logoUrl} alt="" width={44} height={44} loading="lazy" className={cn("size-11 shrink-0 rounded-xl bg-surface object-contain ring-1 ring-line", className)} />
    );
  const initials = name
    .replace(/\(.*?\)/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <div
      aria-hidden
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-navy-800 to-navy-950 text-sm font-semibold text-white",
        className,
      )}
    >
      {initials}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-navy-50 text-navy-600 [&_svg]:size-5">{icon}</div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink-muted">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
