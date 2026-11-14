import type { Metadata } from "next";
import Link from "next/link";
import { listUsers } from "@/lib/admin/queries";
import { AdminHeader, Tabs } from "@/components/admin/admin-ui";
import { UserAdminButtons } from "@/components/admin/admin-actions";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatRelativeDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Utilisateurs" };
const ROLES = [{ value: "", label: "Tous" }, { value: "candidate", label: "Candidats" }, { value: "recruiter", label: "Recruteurs" }, { value: "admin", label: "Admins" }];
const ROLE_LABEL = { candidate: "Candidat", recruiter: "Recruteur", admin: "Admin" } as const;

type Props = { searchParams: Promise<{ q?: string; role?: string; page?: string }> };

export default async function UsersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (sp.q ?? "").slice(0, 80);
  const role = ROLES.some((r) => r.value === sp.role) ? sp.role! : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const { rows, total } = await listUsers(q, role, page);
  const pages = Math.max(1, Math.ceil(total / 30));
  const href = (o: { role?: string; page?: number }) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (o.role ?? role) p.set("role", o.role ?? role);
    if ((o.page ?? 1) > 1) p.set("page", String(o.page));
    return `/admin/utilisateurs${p.size ? `?${p}` : ""}`;
  };
  return (
    <div className="space-y-6">
      <AdminHeader title="Utilisateurs" description={`${total} compte${total > 1 ? "s" : ""}`} />
      <form className="flex gap-2" role="search">
        {role && <input type="hidden" name="role" value={role} />}
        <label htmlFor="q" className="sr-only">Rechercher</label>
        <Input id="q" name="q" defaultValue={q} placeholder="Nom, e-mail ou entreprise" className="max-w-sm" />
        <Button type="submit" variant="secondary">Rechercher</Button>
      </form>
      <Tabs current={role} items={ROLES.map((r) => ({ ...r, href: href({ role: r.value, page: 1 }) }))} />
      <div className="overflow-x-auto rounded-card bg-surface shadow-card ring-1 ring-line">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-subtle">
            <tr><th className="px-4 py-3 font-medium">Compte</th><th className="px-3 py-3 font-medium">Rôle</th><th className="px-3 py-3 font-medium">Inscription</th><th className="px-3 py-3 font-medium">Dernière connexion</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((u) => (
              <tr key={u.id} className={u.suspended_at ? "bg-danger-50/40" : undefined}>
                <td className="px-4 py-3">
                  <p className="font-medium text-navy-950">{u.full_name}</p>
                  <p className="select-all text-xs text-ink-muted">{u.email}</p>
                  {u.company_name && <p className="text-xs text-ink-subtle">{u.company_name}</p>}
                  {u.suspended_at && <p className="text-xs text-danger-600">Suspendu{u.suspension_reason ? ` : ${u.suspension_reason}` : ""}</p>}
                </td>
                <td className="px-3 py-3"><Badge tone={u.role === "admin" ? "electric" : u.role === "recruiter" ? "dark" : "neutral"}>{ROLE_LABEL[u.role]}</Badge></td>
                <td className="px-3 py-3 text-ink-muted">{formatRelativeDate(u.created_at)}</td>
                <td className="px-3 py-3 text-ink-muted">{u.last_sign_in_at ? formatRelativeDate(u.last_sign_in_at) : "—"}</td>
                <td className="px-4 py-3 text-right"><UserAdminButtons userId={u.id} suspended={!!u.suspended_at} isAdmin={u.role === "admin"} /></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-muted">Aucun compte trouvé.</td></tr>}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <nav aria-label="Pagination" className="flex justify-center gap-3 text-sm">
          {page > 1 && <Link href={href({ page: page - 1 })} className="font-medium text-electric-600">← Précédent</Link>}
          <span className="text-ink-muted">Page {page} / {pages}</span>
          {page < pages && <Link href={href({ page: page + 1 })} className="font-medium text-electric-600">Suivant →</Link>}
        </nav>
      )}
    </div>
  );
}
