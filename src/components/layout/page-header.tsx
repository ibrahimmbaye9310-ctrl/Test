import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, children }: { eyebrow?: string; title: ReactNode; description?: ReactNode; children?: ReactNode }) {
  return (
    <div className="relative overflow-hidden border-b border-line">
      <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
      <div className="container-page relative py-12 sm:py-16">
        {eyebrow && <p className="mb-3 text-sm font-semibold text-electric-600">{eyebrow}</p>}
        <h1 className="text-3xl font-semibold sm:text-5xl">{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-muted">{description}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </div>
  );
}
