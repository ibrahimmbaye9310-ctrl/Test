"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bell, Bookmark, Flag, MessageSquareQuote, ScrollText, ShieldCheck, Building2, CreditCard, FileText, LayoutDashboard, Send, Settings, UserRound, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = { dashboard: LayoutDashboard, profile: UserRound, send: Send, bookmark: Bookmark, settings: Settings, building: Building2, offers: FileText, users: Users, card: CreditCard, stats: BarChart3, bell: Bell, flag: Flag, shield: ShieldCheck, quote: MessageSquareQuote, log: ScrollText };
export type SpaceNavItem = { href: string; label: string; icon: keyof typeof ICONS; badge?: number };

/** Menu d'un espace connecté : vertical sur ordinateur, onglets défilants sur mobile. */
export function SpaceNav({ items, label, root }: { items: SpaceNavItem[]; label: string; root: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
      <ul className="flex gap-1 lg:flex-col">
        {items.map(({ href, label: text, icon, badge }) => {
          const Icon = ICONS[icon];
          const active = href === root ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition",
                  active ? "bg-surface text-navy-950 shadow-card ring-1 ring-line" : "text-ink-muted hover:bg-surface/70 hover:text-navy-950",
                )}
              >
                <Icon className={cn("size-4", active ? "text-electric-600" : "text-ink-subtle")} aria-hidden />
                {text}
                {badge ? (
                  <span className="ml-auto rounded-full bg-electric-500 px-1.5 text-[11px] font-semibold text-white" aria-label={`${badge} nouvelle(s)`}>
                    {badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
