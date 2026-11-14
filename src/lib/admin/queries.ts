import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AdminStats, AdminUserRow } from "@/lib/supabase/database.types";

/** Toutes ces lectures passent par la session de l'administrateur : la RLS (is_admin) autorise l'accès global. */
export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_stats");
  if (error) throw new Error(error.message);
  return data;
}

export async function getModerationOffers(status: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_offers")
    .select("id, title, slug, status, city, postal_code, contract_type, short_description, moderation_note, created_at, updated_at, published_at, companies(id, name, is_verified, owner_id), reports(status)")
    .eq("status", status as "pending")
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return data.map((o) => {
    const reports = (o.reports as unknown as { status: string }[]) ?? [];
    return { ...o, company: o.companies as unknown as { id: string; name: string; is_verified: boolean; owner_id: string }, openReports: reports.filter((r) => r.status === "open" || r.status === "reviewing").length };
  });
}

export async function getAdminOffer(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("job_offers").select("*, companies(id, name, is_verified, description, website, siret)").eq("id", id).maybeSingle();
  return data;
}

export async function getReports(status: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select("id, reason, details, status, admin_note, created_at, resolved_at, reporter_id, job_offers(id, title, slug, status, companies(name))")
    .eq("status", status as "open")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return data.map((r) => ({ ...r, offer: r.job_offers as unknown as { id: string; title: string; slug: string; status: string; companies: { name: string } | null } | null }));
}

export async function listUsers(search: string, role: string, page: number, perPage = 30): Promise<{ rows: AdminUserRow[]; total: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_users", { search: search || null, role_filter: role || null, max_rows: perPage, skip: (page - 1) * perPage });
  if (error) throw new Error(error.message);
  return { rows: data, total: Number(data[0]?.total ?? 0) };
}

export async function getCompanies(search: string) {
  const supabase = await createClient();
  let q = supabase.from("companies").select("id, name, slug, siret, website, city, is_verified, created_at, owner_id, job_offers(status)").order("created_at", { ascending: false }).limit(200);
  if (search) q = q.ilike("name", `%${search.replace(/[%_]/g, "")}%`);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const owners = await supabase.from("profiles").select("id, full_name, suspended_at").in("id", data.map((c) => c.owner_id));
  const byId = new Map((owners.data ?? []).map((p) => [p.id, p]));
  return data.map((c) => {
    const offers = (c.job_offers as unknown as { status: string }[]) ?? [];
    return { ...c, owner: byId.get(c.owner_id) ?? null, offersTotal: offers.length, offersOnline: offers.filter((o) => o.status === "published").length };
  });
}

export async function getBilling() {
  const supabase = await createClient();
  const [subs, payments] = await Promise.all([
    supabase.from("subscriptions").select("*, companies(name)").order("updated_at", { ascending: false }).limit(200),
    supabase.from("payments").select("*, companies(name)").order("created_at", { ascending: false }).limit(200),
  ]);
  return { subscriptions: subs.data ?? [], payments: payments.data ?? [] };
}

export async function getTestimonials() {
  const supabase = await createClient();
  const { data } = await supabase.from("testimonials").select("*").order("created_at", { ascending: false });
  return data ?? [];
}

export async function getAuditLog(limit = 100) {
  const supabase = await createClient();
  const { data } = await supabase.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(limit);
  const ids = [...new Set((data ?? []).map((a) => a.admin_id).filter((x): x is string => !!x))];
  const admins = ids.length ? (await supabase.from("profiles").select("id, full_name").in("id", ids)).data ?? [] : [];
  const names = new Map(admins.map((a) => [a.id, a.full_name]));
  return (data ?? []).map((a) => ({ ...a, adminName: a.admin_id ? names.get(a.admin_id) ?? "—" : "—" }));
}
