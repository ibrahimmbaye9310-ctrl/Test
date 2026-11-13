"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, LayoutDashboard, Send, Settings, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/espace", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/espace/profil", label: "Mon profil", icon: UserRound },
  { href: "/espace/candidatures", label: "Candidatures", icon: Send },
  { href: "/espace/favoris", label: "Favoris", icon: Bookmark },
  { href: "/espace/compte", label: "Compte", icon: Settings },
];

/** Menu de l'espace : vertical sur ordinateur, onglets défilants sur mobile. */
export function EspaceNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Espace candidat" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
      <ul className="flex gap-1 lg:flex-col">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/espace" ? pathname === href : pathname.startsWith(href);
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
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
