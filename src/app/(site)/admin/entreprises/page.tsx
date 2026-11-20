import type { Metadata } from "next";
import { getCompanies } from "@/lib/admin/queries";
import { AdminHeader } from "@/components/admin/admin-ui";
import { CompanyVerifyButton } from "@/components/admin/admin-actions";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatRelativeDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Entreprises" };

export default async function CompaniesAdminPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").slice(0, 80);
  const companies = await getCompanies(q);
  return (
    <div className="space-y-6">
      <AdminHeader title="Entreprises" description="Une entreprise vérifiée publie ses offres sans attendre la modération." />
      <form className="flex gap-2" role="search">
        <label htmlFor="q" className="sr-only">Rechercher</label>
        <Input id="q" name="q" defaultValue={q} placeholder="Nom de l'entreprise" className="max-w-sm" />
        <Button type="submit" variant="secondary">Rechercher</Button>
      </form>
      <div className="overflow-x-auto rounded-card bg-surface shadow-card ring-1 ring-line">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-subtle">
            <tr><th className="px-4 py-3 font-medium">Entreprise</th><th className="px-3 py-3 font-medium">SIRET</th><th className="px-3 py-3 text-right font-medium">Offres</th><th className="px-3 py-3 font-medium">Créée</th><th className="px-4 py-3 text-right font-medium">Vérification</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {companies.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-navy-950">{c.name} {c.is_verified && <Badge tone="success">Vérifiée</Badge>}</p>
                  <p className="text-xs text-ink-muted">{c.owner?.full_name ?? "—"}{c.city ? ` · ${c.city}` : ""}{c.website ? ` · ${c.website}` : ""}</p>
                  {c.owner?.suspended_at && <p className="text-xs text-danger-600">Responsable suspendu</p>}
                </td>
                <td className="px-3 py-3 tabular-nums text-ink-muted">{c.siret ?? "—"}</td>
                <td className="px-3 py-3 text-right tabular-nums">{c.offersOnline} / {c.offersTotal}</td>
                <td className="px-3 py-3 text-ink-muted">{formatRelativeDate(c.created_at)}</td>
                <td className="px-4 py-3 text-right"><CompanyVerifyButton companyId={c.id} verified={c.is_verified} /></td>
              </tr>
            ))}
            {companies.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-muted">Aucune entreprise.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink-subtle">Avant de vérifier une entreprise, contrôlez son SIRET sur annuaire-entreprises.data.gouv.fr.</p>
    </div>
  );
}
