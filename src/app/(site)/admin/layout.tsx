import type { Metadata } from "next";
import { SpaceNav } from "@/components/layout/space-nav";
import { requireUser } from "@/lib/auth/session";
import { getAdminStats } from "@/lib/admin/queries";

export const metadata: Metadata = { title: { default: "Administration", template: "%s · Administration" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["admin"], "/admin");
  const stats = await getAdminStats();
  return (
    <div className="container-page grid gap-6 py-8 lg:grid-cols-[220px_1fr] lg:gap-10 lg:py-12">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="mb-5 hidden px-1 lg:block">
          <p className="text-xs font-semibold uppercase tracking-wider text-electric-600">Administration</p>
          <p className="mt-1 truncate text-sm text-ink-muted">{user.profile.full_name}</p>
        </div>
        <SpaceNav
          label="Administration"
          root="/admin"
          items={[
            { href: "/admin", label: "Vue d'ensemble", icon: "stats" },
            { href: "/admin/moderation", label: "Modération", icon: "shield", badge: stats.offers_pending },
            { href: "/admin/signalements", label: "Signalements", icon: "flag", badge: stats.reports_open },
            { href: "/admin/utilisateurs", label: "Utilisateurs", icon: "users" },
            { href: "/admin/entreprises", label: "Entreprises", icon: "building" },
            { href: "/admin/abonnements", label: "Abonnements", icon: "card" },
            { href: "/admin/avis", label: "Avis", icon: "quote" },
            { href: "/admin/journal", label: "Journal", icon: "log" },
          ]}
        />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
