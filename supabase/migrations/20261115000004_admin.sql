-- ═══════════════════════════════════════════════════════════════════════════
-- JobFinder — Migration 4 : administration et modération
-- Ré-exécutable sans erreur.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Suspension de comptes ─────────────────────────────────────────────────
alter table public.profiles add column if not exists suspended_at timestamptz;
alter table public.profiles add column if not exists suspension_reason text check (suspension_reason is null or char_length(suspension_reason) <= 300);

create or replace function public.is_suspended()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select suspended_at is not null from public.profiles where id = auth.uid()), false)
$$;

-- Les colonnes de suspension ne sont modifiables que par un administrateur.
create or replace function public.protect_profile_role()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') or public.is_admin() then return new; end if;
  if new.role is distinct from old.role then raise exception 'Modification du rôle interdite' using errcode = '42501'; end if;
  if new.suspended_at is distinct from old.suspended_at or new.suspension_reason is distinct from old.suspension_reason then
    raise exception 'Modification réservée à l''administration' using errcode = '42501';
  end if;
  return new;
end $$;

-- Un compte suspendu ne peut plus postuler, publier ni signaler.
drop policy if exists "applications: candidature" on public.applications;
create policy "applications: candidature" on public.applications for insert to authenticated
  with check (
    candidate_id = (select auth.uid()) and status = 'sent' and public.current_user_role() = 'candidate' and not public.is_suspended()
    and exists (select 1 from public.job_offers o where o.id = job_offer_id and o.status = 'published' and (o.expires_at is null or o.expires_at > now()))
  );
drop policy if exists "job_offers: création" on public.job_offers;
create policy "job_offers: création" on public.job_offers for insert to authenticated
  with check (public.owns_company(company_id) and not public.is_suspended());
drop policy if exists "job_offers: modification" on public.job_offers;
create policy "job_offers: modification" on public.job_offers for update to authenticated
  using ((public.owns_company(company_id) and not public.is_suspended()) or public.is_admin())
  with check ((public.owns_company(company_id) and not public.is_suspended()) or public.is_admin());
drop policy if exists "reports: création" on public.reports;
create policy "reports: création" on public.reports for insert to authenticated
  with check (
    reporter_id = (select auth.uid()) and status = 'open' and admin_note is null and not public.is_suspended()
    and exists (select 1 from public.job_offers o where o.id = job_offer_id and o.status = 'published')
    and not public.owns_offer(job_offer_id)
  );

-- ─── Entreprises : vérification réservée à l'administration ─────────────────
create or replace function public.protect_company()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') or public.is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    new.is_verified := false;
  elsif new.is_verified is distinct from old.is_verified or new.owner_id is distinct from old.owner_id or new.slug is distinct from old.slug then
    raise exception 'Champ réservé à l''administration' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists companies_protect on public.companies;
create trigger companies_protect before insert or update on public.companies for each row execute function public.protect_company();

-- ─── Modération des offres ──────────────────────────────────────────────────
alter table public.job_offers add column if not exists moderation_note text check (moderation_note is null or char_length(moderation_note) <= 500);

-- Règles : une entreprise non vérifiée qui publie (ou modifie le contenu d'une offre en ligne) passe par
-- la vérification (« pending ») ; une entreprise vérifiée publie directement.
create or replace function public.guard_job_offer()
returns trigger language plpgsql set search_path = '' as $$
declare
  privileged boolean := current_user in ('postgres', 'service_role', 'supabase_admin') or public.is_admin();
  verified boolean;
  content_changed boolean := false;
begin
  if not privileged then
    if tg_op = 'UPDATE' then
      if new.is_featured is distinct from old.is_featured then raise exception 'Mise en avant non modifiable' using errcode = '42501'; end if;
      if new.views_count is distinct from old.views_count then raise exception 'Compteur non modifiable' using errcode = '42501'; end if;
      if new.company_id is distinct from old.company_id then raise exception 'Entreprise non modifiable' using errcode = '42501'; end if;
      if new.moderation_note is distinct from old.moderation_note then raise exception 'Note de modération non modifiable' using errcode = '42501'; end if;
      if old.status = 'rejected' and new.status <> 'rejected' then raise exception 'Offre refusée par la modération' using errcode = '42501'; end if;
      content_changed := (new.title, new.short_description, new.missions, new.profile, new.benefits, new.salary_min, new.salary_max, new.contract_type)
        is distinct from (old.title, old.short_description, old.missions, old.profile, old.benefits, old.salary_min, old.salary_max, old.contract_type);
    else
      new.is_featured := false;
      new.views_count := 0;
      new.moderation_note := null;
    end if;

    -- Statuts que le recruteur ne peut pas choisir lui-même.
    if new.status in ('rejected', 'expired') and (tg_op = 'INSERT' or new.status is distinct from old.status) then
      raise exception 'Statut réservé à la plateforme' using errcode = '42501';
    end if;
    if new.status = 'pending' and (tg_op = 'INSERT' or old.status <> 'pending') then
      raise exception 'Statut réservé à la plateforme' using errcode = '42501';
    end if;

    -- Demande de publication par une entreprise non vérifiée → vérification.
    if new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published' or content_changed) then
      select is_verified into verified from public.companies where id = new.company_id;
      if not coalesce(verified, false) then
        new.status := 'pending';
      end if;
    end if;
  end if;

  -- Mise en ligne (par le recruteur vérifié ou par validation de l'administration) : dates fixées par la base.
  if new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published' or (old.expires_at is not null and old.expires_at <= now())) then
    new.published_at := now();
    new.expires_at := now() + interval '30 days';
  end if;
  return new;
end $$;

-- Décision de modération → notification au recruteur.
create or replace function public.notify_offer_moderated()
returns trigger language plpgsql security definer set search_path = '' as $$
declare owner uuid;
begin
  if new.status is not distinct from old.status then return new; end if;
  if not (old.status = 'pending' and new.status in ('published', 'rejected')) and not (new.status = 'rejected') then return new; end if;
  select owner_id into owner from public.companies where id = new.company_id;
  insert into public.notifications (user_id, type, title, body, link)
  values (owner, 'offer_moderated',
    case when new.status = 'published' then 'Offre validée et en ligne' else 'Offre refusée par la modération' end,
    left('« ' || new.title || ' »' || case when new.status = 'rejected' and new.moderation_note is not null then ' : ' || new.moderation_note else '' end, 500),
    '/recruteur/offres/' || new.id);
  return new;
end $$;
drop trigger if exists job_offers_notify_moderation on public.job_offers;
create trigger job_offers_notify_moderation after update of status on public.job_offers for each row execute function public.notify_offer_moderated();

-- ─── Avis utilisateurs (authentiques, avec consentement) ────────────────────
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null check (char_length(btrim(author_name)) between 2 and 80),
  author_role text not null check (char_length(btrim(author_role)) between 2 and 120),
  quote text not null check (char_length(btrim(quote)) between 20 and 600),
  consent_at date not null,
  is_published boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.testimonials enable row level security;
drop policy if exists "testimonials: lecture publique" on public.testimonials;
create policy "testimonials: lecture publique" on public.testimonials for select to anon, authenticated using (is_published or public.is_admin());
drop policy if exists "testimonials: gestion admin" on public.testimonials;
create policy "testimonials: gestion admin" on public.testimonials for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ─── Journal des actions d'administration ──────────────────────────────────
create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  admin_id uuid references public.profiles (id) on delete set null,
  action text not null check (char_length(action) between 3 and 60),
  target_type text not null check (target_type in ('user', 'company', 'offer', 'report', 'testimonial', 'subscription')),
  target_id text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_audit_created_idx on public.admin_audit_log (created_at desc);
alter table public.admin_audit_log enable row level security;
drop policy if exists "audit: lecture admin" on public.admin_audit_log;
create policy "audit: lecture admin" on public.admin_audit_log for select to authenticated using (public.is_admin());
drop policy if exists "audit: écriture admin" on public.admin_audit_log;
create policy "audit: écriture admin" on public.admin_audit_log for insert to authenticated with check (public.is_admin() and admin_id = (select auth.uid()));
-- Journal non modifiable : ni UPDATE ni DELETE.

-- ─── Fonctions d'administration (vérifient le rôle elles-mêmes) ─────────────
create or replace function public.admin_stats()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Accès réservé' using errcode = '42501'; end if;
  return jsonb_build_object(
    'candidates', (select count(*) from public.profiles where role = 'candidate'),
    'recruiters', (select count(*) from public.profiles where role = 'recruiter'),
    'suspended', (select count(*) from public.profiles where suspended_at is not null),
    'companies', (select count(*) from public.companies),
    'verified_companies', (select count(*) from public.companies where is_verified),
    'offers_published', (select count(*) from public.job_offers where status = 'published' and (expires_at is null or expires_at > now())),
    'offers_pending', (select count(*) from public.job_offers where status = 'pending'),
    'offers_total', (select count(*) from public.job_offers),
    'applications', (select count(*) from public.applications),
    'applications_30d', (select count(*) from public.applications where created_at > now() - interval '30 days'),
    'signups_30d', (select count(*) from public.profiles where created_at > now() - interval '30 days'),
    'reports_open', (select count(*) from public.reports where status in ('open', 'reviewing')),
    'active_subscriptions', (select count(*) from public.subscriptions where status in ('active', 'trialing')),
    'revenue_cents', (select coalesce(sum(amount_cents), 0) from public.payments where status = 'succeeded'),
    'revenue_30d_cents', (select coalesce(sum(amount_cents), 0) from public.payments where status = 'succeeded' and created_at > now() - interval '30 days')
  );
end $$;

-- Liste des comptes avec l'adresse e-mail (table auth.users, non exposée autrement).
create or replace function public.admin_list_users(search text default null, role_filter text default null, max_rows integer default 50, skip integer default 0)
returns table (id uuid, email text, full_name text, role public.user_role, created_at timestamptz, last_sign_in_at timestamptz, suspended_at timestamptz, suspension_reason text, company_name text, total bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Accès réservé' using errcode = '42501'; end if;
  return query
    select p.id, u.email::text, p.full_name, p.role, p.created_at, u.last_sign_in_at, p.suspended_at, p.suspension_reason, c.name, count(*) over ()
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.companies c on c.owner_id = p.id
    where (search is null or search = '' or p.full_name ilike '%' || search || '%' or u.email ilike '%' || search || '%' or c.name ilike '%' || search || '%')
      and (role_filter is null or role_filter = '' or p.role::text = role_filter)
    order by p.created_at desc
    limit least(greatest(max_rows, 1), 200) offset greatest(skip, 0);
end $$;

-- Suspension : bloque le compte et retire ses offres en ligne.
create or replace function public.admin_set_suspension(target uuid, suspend boolean, reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Accès réservé' using errcode = '42501'; end if;
  if target = auth.uid() then raise exception 'Vous ne pouvez pas vous suspendre vous-même'; end if;
  if (select role from public.profiles where id = target) = 'admin' then raise exception 'Un administrateur ne peut pas être suspendu ici'; end if;
  update public.profiles set suspended_at = case when suspend then now() else null end,
    suspension_reason = case when suspend then left(reason, 300) else null end where id = target;
  if suspend then
    update public.job_offers set status = 'closed'
      where status in ('published', 'pending') and company_id in (select id from public.companies where owner_id = target);
  end if;
end $$;

revoke all on function public.admin_stats() from public, anon;
revoke all on function public.admin_list_users(text, text, integer, integer) from public, anon;
revoke all on function public.admin_set_suspension(uuid, boolean, text) from public, anon;
grant execute on function public.admin_stats() to authenticated;
grant execute on function public.admin_list_users(text, text, integer, integer) to authenticated;
grant execute on function public.admin_set_suspension(uuid, boolean, text) to authenticated;
