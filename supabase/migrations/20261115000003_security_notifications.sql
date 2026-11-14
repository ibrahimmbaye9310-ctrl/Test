-- ═══════════════════════════════════════════════════════════════════════════
-- JobFinder — Migration 3 : sécurité, notifications, signalements, abonnements
-- Ré-exécutable sans erreur.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Limitation des tentatives abusives ─────────────────────────────────────
-- Clé = empreinte (SHA-256 salé, calculée par le serveur) : aucune adresse IP n'est stockée en clair.
create table if not exists public.rate_limits (
  key text not null check (char_length(key) between 8 and 200),
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (key, window_start)
);
alter table public.rate_limits enable row level security;
-- Aucune politique : table inaccessible directement, uniquement via la fonction ci-dessous.

-- Enregistre une tentative et indique si elle est autorisée (fenêtre fixe).
create or replace function public.check_rate_limit(bucket_key text, max_hits integer, window_seconds integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  win timestamptz := to_timestamp(floor(extract(epoch from now()) / window_seconds) * window_seconds);
  n integer;
begin
  if max_hits < 1 or window_seconds < 1 or window_seconds > 86400 then raise exception 'Paramètres invalides'; end if;
  insert into public.rate_limits (key, window_start, hits) values (bucket_key, win, 1)
    on conflict (key, window_start) do update set hits = public.rate_limits.hits + 1
    returning hits into n;
  return n <= max_hits;
end $$;
revoke all on function public.check_rate_limit(text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, integer, integer) to anon, authenticated;

-- ─── Notifications dans l'application ──────────────────────────────────────
do $$ begin
  create type public.notification_type as enum ('application_received', 'application_status', 'offer_moderated', 'offer_expiring', 'subscription', 'system');
exception when duplicate_object then null; end $$;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  title text not null check (char_length(title) between 1 and 160),
  body text check (body is null or char_length(body) <= 500),
  link text check (link is null or link ~ '^/[^/]'),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications (user_id) where read_at is null;
alter table public.notifications enable row level security;
drop policy if exists "notifications: lecture" on public.notifications;
create policy "notifications: lecture" on public.notifications for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "notifications: marquer comme lue" on public.notifications;
create policy "notifications: marquer comme lue" on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "notifications: suppression" on public.notifications;
create policy "notifications: suppression" on public.notifications for delete to authenticated using (user_id = (select auth.uid()));
-- Création uniquement par les triggers (SECURITY DEFINER). Seule la date de lecture est modifiable.
revoke update on public.notifications from authenticated, anon;
grant update (read_at) on public.notifications to authenticated;

-- Nouvelle candidature → notification au recruteur.
create or replace function public.notify_application_received()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  owner uuid; offer_title text; candidate_name text;
begin
  select c.owner_id, o.title into owner, offer_title
    from public.job_offers o join public.companies c on c.id = o.company_id where o.id = new.job_offer_id;
  select full_name into candidate_name from public.profiles where id = new.candidate_id;
  insert into public.notifications (user_id, type, title, body, link)
  values (owner, 'application_received', 'Nouvelle candidature', left(coalesce(candidate_name, 'Un candidat') || ' a postulé à « ' || offer_title || ' ».', 500),
          '/recruteur/candidatures/' || new.id);
  return new;
end $$;
drop trigger if exists applications_notify_received on public.applications;
create trigger applications_notify_received after insert on public.applications for each row execute function public.notify_application_received();

-- Changement de statut → notification au candidat.
create or replace function public.notify_application_status()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  offer_title text;
  label text := case new.status
    when 'sent' then 'Envoyée' when 'reviewing' then 'En cours d''examen' when 'interview' then 'Entretien'
    when 'accepted' then 'Acceptée' when 'rejected' then 'Refusée' end;
begin
  if new.status is not distinct from old.status then return new; end if;
  select title into offer_title from public.job_offers where id = new.job_offer_id;
  insert into public.notifications (user_id, type, title, body, link)
  values (new.candidate_id, 'application_status', 'Candidature : ' || label, left('Votre candidature à « ' || offer_title || ' » est passée au statut « ' || label || ' ».', 500),
          '/espace/candidatures');
  return new;
end $$;
drop trigger if exists applications_notify_status on public.applications;
create trigger applications_notify_status after update of status on public.applications for each row execute function public.notify_application_status();

-- ─── Signalements d'annonces ───────────────────────────────────────────────
do $$ begin
  create type public.report_reason as enum ('fraud', 'discriminatory', 'misleading', 'filled', 'inappropriate', 'other');
  create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
exception when duplicate_object then null; end $$;

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  job_offer_id uuid not null references public.job_offers (id) on delete cascade,
  reporter_id uuid references public.profiles (id) on delete set null,
  reason public.report_reason not null,
  details text check (details is null or char_length(details) <= 1000),
  status public.report_status not null default 'open',
  admin_note text check (admin_note is null or char_length(admin_note) <= 1000),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists reports_one_open_per_user on public.reports (job_offer_id, reporter_id) where status in ('open', 'reviewing');
create index if not exists reports_status_idx on public.reports (status, created_at desc);
drop trigger if exists reports_updated_at on public.reports;
create trigger reports_updated_at before update on public.reports for each row execute function public.set_updated_at();
alter table public.reports enable row level security;
drop policy if exists "reports: création" on public.reports;
create policy "reports: création" on public.reports for insert to authenticated
  with check (
    reporter_id = (select auth.uid()) and status = 'open' and admin_note is null
    and exists (select 1 from public.job_offers o where o.id = job_offer_id and o.status = 'published')
    and not public.owns_offer(job_offer_id)
  );
drop policy if exists "reports: lecture" on public.reports;
create policy "reports: lecture" on public.reports for select to authenticated using (reporter_id = (select auth.uid()) or public.is_admin());
drop policy if exists "reports: traitement admin" on public.reports;
create policy "reports: traitement admin" on public.reports for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ─── Abonnements et paiements (renseignés uniquement par les webhooks Stripe) ──
do $$ begin
  create type public.plan_id as enum ('starter', 'pro');
  create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid', 'paused');
  create type public.payment_status as enum ('pending', 'succeeded', 'failed', 'refunded');
  create type public.payment_kind as enum ('subscription', 'single_offer');
exception when duplicate_object then null; end $$;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies (id) on delete cascade,
  stripe_customer_id text not null unique check (stripe_customer_id like 'cus_%'),
  stripe_subscription_id text unique check (stripe_subscription_id is null or stripe_subscription_id like 'sub_%'),
  plan public.plan_id,
  status public.subscription_status,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();

-- Aucune donnée bancaire : uniquement les références Stripe et les montants.
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  kind public.payment_kind not null,
  stripe_reference text not null unique check (stripe_reference ~ '^(in|pi|cs)_'),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'eur' check (currency ~ '^[a-z]{3}$'),
  status public.payment_status not null,
  description text check (description is null or char_length(description) <= 200),
  created_at timestamptz not null default now()
);
create index if not exists payments_company_idx on public.payments (company_id, created_at desc);

alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
drop policy if exists "subscriptions: lecture" on public.subscriptions;
create policy "subscriptions: lecture" on public.subscriptions for select to authenticated using (public.owns_company(company_id) or public.is_admin());
drop policy if exists "payments: lecture" on public.payments;
create policy "payments: lecture" on public.payments for select to authenticated using (public.owns_company(company_id) or public.is_admin());
-- Pas d'écriture côté client : seuls les webhooks Stripe (clé secrète, serveur) écrivent ici.

-- ─── Conservation des données (RGPD) ───────────────────────────────────────
-- Durées alignées sur la politique de confidentialité. Exécutée chaque nuit (pg_cron ci-dessous).
create or replace function public.run_data_retention()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  expired int; apps int; views int; notifs int; limits int;
begin
  update public.job_offers set status = 'expired' where status = 'published' and expires_at <= now();
  get diagnostics expired = row_count;
  delete from public.applications where updated_at < now() - interval '24 months';
  get diagnostics apps = row_count;
  delete from public.offer_daily_views where day < current_date - 400;
  get diagnostics views = row_count;
  delete from public.notifications where created_at < now() - interval '12 months';
  get diagnostics notifs = row_count;
  delete from public.rate_limits where window_start < now() - interval '2 days';
  get diagnostics limits = row_count;
  return jsonb_build_object('offres_expirees', expired, 'candidatures_purgees', apps, 'stats_purgees', views, 'notifications_purgees', notifs, 'compteurs_purges', limits);
end $$;
revoke all on function public.run_data_retention() from public, anon, authenticated;

-- Planification quotidienne (3 h 17) si l'extension pg_cron est disponible (activée par défaut sur Supabase).
do $$
begin
  create extension if not exists pg_cron;
  perform cron.unschedule(jobid) from cron.job where jobname = 'jobfinder-data-retention';
  perform cron.schedule('jobfinder-data-retention', '17 3 * * *', 'select public.run_data_retention()');
exception when others then
  raise notice 'pg_cron indisponible : planifiez public.run_data_retention() manuellement (%).', sqlerrm;
end $$;
