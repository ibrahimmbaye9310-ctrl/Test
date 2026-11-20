-- ═══════════════════════════════════════════════════════════════════════════
-- JobFinder — Migration 5 : facturation Stripe et limites d'annonces
-- Ré-exécutable sans erreur.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Qui peut écrire la facturation ? ──────────────────────────────────────
-- En production : le webhook Stripe du serveur, avec la clé secrète Supabase (rôle service_role).
-- En environnement de test (facultatif) : une clé de facturation envoyée dans l'en-tête x-billing-key ;
-- la base n'en conserve que l'empreinte SHA-256 (private.settings, clé « billing_key_sha256 »).
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.settings (key text primary key, value text not null);
delete from private.settings where key = 'billing_key'; -- ancienne version (clé en clair) : supprimée

-- Rôle RÉEL de la requête. Attention : dans une fonction SECURITY DEFINER, current_user vaut le propriétaire de la
-- fonction ; on lit donc le réglage « role » (posé par PostgREST via SET ROLE) et la session.
create or replace function public.request_is_privileged()
returns boolean language sql stable set search_path = '' as $$
  select coalesce(current_setting('role', true), 'none') = 'service_role'
      or (coalesce(nullif(current_setting('role', true), ''), 'none') = 'none' and session_user in ('postgres', 'supabase_admin'))
$$;

create or replace function public.billing_caller_ok()
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare
  header text;
begin
  if public.request_is_privileged() then return true; end if;
  begin
    header := current_setting('request.headers', true)::json ->> 'x-billing-key';
  exception when others then header := null;
  end;
  -- coalesce : sans empreinte enregistrée, la comparaison vaut NULL ; il faut alors refuser explicitement.
  return coalesce(
    header is not null and length(header) >= 32
      and encode(extensions.digest(header, 'sha256'), 'hex') = (select value from private.settings where key = 'billing_key_sha256'),
    false);
end $$;

-- ─── Crédits d'annonce à l'unité ───────────────────────────────────────────
create table if not exists public.offer_credits (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  source text not null check (source in ('stripe', 'admin')),
  stripe_reference text unique,
  used_offer_id uuid references public.job_offers (id) on delete set null,
  used_at timestamptz,
  -- Une publication dure 30 jours : le crédit couvre l'offre jusqu'à cette date.
  valid_until timestamptz,
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now()
);
create index if not exists offer_credits_company_idx on public.offer_credits (company_id, used_offer_id);
alter table public.offer_credits enable row level security;
drop policy if exists "offer_credits: lecture" on public.offer_credits;
create policy "offer_credits: lecture" on public.offer_credits for select to authenticated using (public.owns_company(company_id) or public.is_admin());
drop policy if exists "offer_credits: offerts par l'admin" on public.offer_credits;
create policy "offer_credits: offerts par l'admin" on public.offer_credits for insert to authenticated
  with check (public.is_admin() and source = 'admin' and used_offer_id is null and stripe_reference is null);

-- Événements Stripe déjà traités (idempotence : Stripe peut renvoyer un même événement).
create table if not exists public.stripe_events (
  id text primary key check (id like 'evt_%'),
  type text not null,
  processed_at timestamptz not null default now()
);
alter table public.stripe_events enable row level security;

-- ─── Formule active d'une entreprise ───────────────────────────────────────
create or replace function public.company_plan(company uuid)
returns text language sql stable security definer set search_path = '' as $$
  select plan::text from public.subscriptions
  where company_id = company and plan is not null
    and status in ('active', 'trialing', 'past_due')   -- past_due : délai de grâce pendant les relances de paiement
    and (current_period_end is null or current_period_end > now() - interval '3 days')
$$;

create or replace function public.plan_offer_limit(plan text)
returns integer language sql immutable set search_path = '' as $$
  select case plan when 'pro' then 10 when 'starter' then 3 else 0 end
$$;

-- ─── Contrôle des limites à la publication ─────────────────────────────────
-- Annonce « active » = en ligne (non expirée) ou en vérification.
-- Capacité = limite de la formule + crédits encore valides rattachés aux annonces actives (ou à celle-ci).
create or replace function public.enforce_offer_quota()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  becomes_active boolean;
  was_active boolean;
  active_others integer;
  capacity integer;
  credit uuid;
  plan text;
begin
  becomes_active := new.status in ('published', 'pending') and (new.expires_at is null or new.expires_at > now() or new.status = 'pending');
  was_active := tg_op = 'UPDATE' and old.status in ('published', 'pending') and (old.expires_at is null or old.expires_at > now() or old.status = 'pending');
  -- Une republication après expiration est une nouvelle publication.
  if tg_op = 'UPDATE' and old.status = 'published' and old.expires_at is not null and old.expires_at <= now() then was_active := false; end if;

  -- Mise en avant automatique des offres Pro.
  plan := public.company_plan(new.company_id);
  if new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published') then
    new.is_featured := coalesce(plan = 'pro', false);
  end if;

  if not becomes_active or was_active then return new; end if;
  -- L'administration n'est pas soumise aux limites (validation d'une offre déjà comptée, gestes commerciaux).
  if public.request_is_privileged() or public.is_admin() then return new; end if;

  select count(*) into active_others from public.job_offers o
  where o.company_id = new.company_id and o.id <> new.id
    and (o.status = 'pending' or (o.status = 'published' and (o.expires_at is null or o.expires_at > now())));

  select public.plan_offer_limit(plan) + count(*) into capacity from public.offer_credits c
  where c.company_id = new.company_id and c.used_offer_id is not null and c.valid_until > now()
    and (c.used_offer_id = new.id or exists (
      select 1 from public.job_offers o where o.id = c.used_offer_id
        and (o.status = 'pending' or (o.status = 'published' and (o.expires_at is null or o.expires_at > now())))));

  if active_others < capacity then return new; end if;

  -- Formule pleine (ou pas de formule) : on consomme un crédit d'annonce à l'unité.
  select id into credit from public.offer_credits
  where company_id = new.company_id and used_offer_id is null
  order by created_at limit 1 for update skip locked;
  if credit is null then
    raise exception 'QUOTA_ATTEINT: % annonce(s) active(s) sur % autorisée(s)', active_others, capacity using errcode = 'P0001';
  end if;
  update public.offer_credits set used_offer_id = new.id, used_at = now(), valid_until = now() + interval '30 days' where id = credit;
  return new;
end $$;
drop trigger if exists job_offers_quota on public.job_offers;
-- Après guard_job_offer (ordre alphabétique des triggers BEFORE) : le statut final est connu.
create trigger job_offers_quota before insert or update on public.job_offers for each row execute function public.enforce_offer_quota();

-- Une offre insérée doit exister avant qu'un crédit la référence : on rattache le crédit après l'insertion.
alter table public.offer_credits drop constraint if exists offer_credits_used_offer_id_fkey;
alter table public.offer_credits add constraint offer_credits_used_offer_id_fkey
  foreign key (used_offer_id) references public.job_offers (id) on delete set null deferrable initially deferred;

-- Résumé pour l'espace recruteur.
create or replace function public.my_billing_summary()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  company uuid;
  plan text;
begin
  select id into company from public.companies where owner_id = auth.uid();
  if company is null then return null; end if;
  plan := public.company_plan(company);
  return jsonb_build_object(
    'plan', plan,
    'limit', public.plan_offer_limit(plan),
    'active_offers', (select count(*) from public.job_offers o where o.company_id = company
        and (o.status = 'pending' or (o.status = 'published' and (o.expires_at is null or o.expires_at > now())))),
    'credits_available', (select count(*) from public.offer_credits where company_id = company and used_offer_id is null),
    'credits_in_use', (select count(*) from public.offer_credits where company_id = company and used_offer_id is not null and valid_until > now())
  );
end $$;
grant execute on function public.my_billing_summary() to authenticated;

-- ─── Écritures de facturation (webhook Stripe uniquement) ───────────────────
create or replace function public.billing_event_first_seen(event_id text, event_type text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if not public.billing_caller_ok() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  insert into public.stripe_events (id, type) values (event_id, event_type) on conflict (id) do nothing;
  return found;
end $$;

-- Traitement échoué : l'événement redevient « nouveau » pour que le renvoi automatique de Stripe soit traité.
create or replace function public.billing_event_forget(event_id text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.billing_caller_ok() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  delete from public.stripe_events where id = event_id;
end $$;

create or replace function public.billing_link_customer(company uuid, customer text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.billing_caller_ok() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  insert into public.subscriptions (company_id, stripe_customer_id) values (company, customer)
    on conflict (company_id) do update set stripe_customer_id = excluded.stripe_customer_id;
end $$;

create or replace function public.billing_sync_subscription(customer text, subscription text, new_plan text, new_status text, period_end timestamptz, cancel_at_end boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  company uuid;
  previous text;
begin
  if not public.billing_caller_ok() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  select company_id, plan::text into company, previous from public.subscriptions where stripe_customer_id = customer;
  if company is null then raise exception 'Client Stripe inconnu : %', customer; end if;
  update public.subscriptions set
    stripe_subscription_id = subscription,
    plan = nullif(new_plan, '')::public.plan_id,
    status = new_status::public.subscription_status,
    current_period_end = period_end,
    cancel_at_period_end = cancel_at_end
  where company_id = company;
  -- Passage en Pro : les offres en ligne sont mises en avant ; sortie de Pro : la mise en avant est retirée.
  update public.job_offers set is_featured = coalesce(public.company_plan(company) = 'pro', false)
    where company_id = company and status = 'published';
  return company;
end $$;

create or replace function public.billing_record_payment(company uuid, payment_kind text, reference text, amount integer, cur text, payment_status text, label text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.billing_caller_ok() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  insert into public.payments (company_id, kind, stripe_reference, amount_cents, currency, status, description)
  values (company, payment_kind::public.payment_kind, reference, amount, lower(cur), payment_status::public.payment_status, left(label, 200))
  on conflict (stripe_reference) do update set status = excluded.status, amount_cents = excluded.amount_cents;
end $$;

create or replace function public.billing_grant_credit(company uuid, reference text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.billing_caller_ok() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  insert into public.offer_credits (company_id, source, stripe_reference) values (company, 'stripe', reference)
    on conflict (stripe_reference) do nothing;
end $$;

create or replace function public.billing_notify(company uuid, kind text, title text, body text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.billing_caller_ok() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  insert into public.notifications (user_id, type, title, body, link)
  select owner_id, 'subscription', left(title, 160), left(body, 500), '/recruteur/abonnement' from public.companies where id = company;
end $$;

-- Retrouver l'entreprise d'un client Stripe (webhook).
create or replace function public.billing_company_of(customer text)
returns uuid language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.billing_caller_ok() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  return (select company_id from public.subscriptions where stripe_customer_id = customer);
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'billing_event_first_seen(text, text)', 'billing_event_forget(text)', 'billing_link_customer(uuid, text)',
    'billing_sync_subscription(text, text, text, text, timestamptz, boolean)',
    'billing_record_payment(uuid, text, text, integer, text, text, text)', 'billing_grant_credit(uuid, text)',
    'billing_notify(uuid, text, text, text)', 'billing_company_of(text)'
  ] loop
    execute format('revoke all on function public.%s from public', f);
    execute format('grant execute on function public.%s to anon, authenticated, service_role', f);
  end loop;
end $$;
