import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AdminHeader({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-ink-muted">{description}</p>}
      </div>
      {children}
    </header>
  );
}

export function Tabs({ items, current }: { items: { href: string; label: string; value: string; count?: number }[]; current: string }) {
  return (
    <nav aria-label="Filtre" className="-mx-4 overflow-x-auto px-4">
      <ul className="flex gap-2">
        {items.map((t) => (
          <li key={t.value} className="shrink-0">
            <Link href={t.href} aria-current={current === t.value ? "page" : undefined} className={cn("inline-flex gap-1.5 rounded-full px-3 py-1.5 text-sm ring-1 transition", current === t.value ? "bg-navy-900 text-white ring-navy-900" : "bg-surface text-navy-700 ring-line-strong hover:ring-navy-300")}>
              {t.label}{t.count != null && <span className="opacity-60">{t.count}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function StatTile({ label, value, hint, href, tone }: { label: string; value: string | number; hint?: string; href?: string; tone?: "alert" }) {
  const body = (
    <>
      <p className={cn("text-xs", tone ? "text-warning-600" : "text-ink-muted")}>{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums text-navy-950">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-subtle">{hint}</p>}
    </>
  );
  const cls = cn("block rounded-card bg-surface p-4 shadow-card ring-1", tone ? "ring-warning-600/30" : "ring-line", href && "transition hover:-translate-y-0.5 hover:shadow-lift");
  return href ? <Link href={href} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
}
