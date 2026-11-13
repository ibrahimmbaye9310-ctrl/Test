-- ═══════════════════════════════════════════════════════════════════════════
-- JobFinder — Migration 1 : profils, entreprises, offres, candidatures, favoris
-- À exécuter dans Supabase > SQL Editor (ou `supabase db push`).
-- Principe : chaque table est protégée par Row Level Security (RLS). Le serveur Next.js
-- valide aussi chaque entrée, mais la base reste la dernière barrière.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Types ──────────────────────────────────────────────────────────────────
create type public.user_role as enum ('candidate', 'recruiter', 'admin');
create type public.contract_type as enum ('cdi', 'cdd', 'interim', 'alternance', 'stage');
create type public.work_time as enum ('full_time', 'part_time');
create type public.schedule as enum ('morning', 'day', 'evening', 'night', 'weekend');
create type public.sector as enum ('retail', 'hospitality', 'logistics', 'tech', 'health', 'admin', 'education', 'construction', 'finance', 'marketing');
create type public.salary_period as enum ('hour', 'month', 'year');
create type public.remote_mode as enum ('none', 'partial', 'full');
create type public.offer_status as enum ('draft', 'pending', 'published', 'rejected', 'closed', 'expired');
create type public.application_status as enum ('sent', 'reviewing', 'interview', 'accepted', 'rejected');

-- ─── Utilitaires ────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ─── Profils (1 par compte auth) ───────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'candidate',
  full_name text not null check (char_length(btrim(full_name)) between 1 and 120),
  phone text check (phone is null or phone ~ '^\+?[0-9 .\-]{6,20}$'),
  city text check (city is null or char_length(city) <= 80),
  postal_code text check (postal_code is null or postal_code ~ '^\d{5}$'),
  headline text check (headline is null or char_length(headline) <= 140),
  bio text check (bio is null or char_length(bio) <= 2000),
  avatar_path text,
  cv_path text,
  cv_filename text check (cv_filename is null or char_length(cv_filename) <= 200),
  cv_updated_at timestamptz,
  skills text[] not null default '{}' check (cardinality(skills) <= 30),
  availability public.schedule[] not null default '{}',
  availability_note text check (availability_note is null or char_length(availability_note) <= 300),
  desired_contracts public.contract_type[] not null default '{}',
  desired_work_time public.work_time,
  desired_sectors public.sector[] not null default '{}',
  search_radius_km smallint check (search_radius_km is null or search_radius_km in (5, 10, 20, 30, 50)),
  open_to_work boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Les fichiers d'un utilisateur sont toujours rangés dans un dossier à son identifiant.
  constraint profiles_avatar_path_owner check (avatar_path is null or avatar_path like id::text || '/%'),
  constraint profiles_cv_path_owner check (cv_path is null or cv_path like id::text || '/%')
);
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create index profiles_role_idx on public.profiles (role);

-- Fonctions d'autorisation : SECURITY DEFINER pour lire le rôle sans boucle RLS.
create or replace function public.current_user_role()
returns public.user_role language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;

-- Création automatique du profil à l'inscription. Le rôle « admin » ne peut jamais venir du client.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  requested text := new.raw_user_meta_data ->> 'role';
  name text := btrim(coalesce(new.raw_user_meta_data ->> 'full_name', ''));
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    case when requested = 'recruiter' then 'recruiter'::public.user_role else 'candidate'::public.user_role end,
    left(case when name = '' then split_part(new.email, '@', 1) else name end, 120)
  );
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Un utilisateur ne peut pas changer son propre rôle (seuls un admin ou le serveur le peuvent).
create or replace function public.protect_profile_role()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.role is distinct from old.role
     and current_user not in ('postgres', 'service_role', 'supabase_admin')
     and not public.is_admin() then
    raise exception 'Modification du rôle interdite' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger profiles_protect_role before update on public.profiles for each row execute function public.protect_profile_role();

-- ─── Entreprises (1 par compte recruteur) ──────────────────────────────────
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text check (description is null or char_length(description) <= 3000),
  website text check (website is null or website ~ '^https?://'),
  siret text check (siret is null or siret ~ '^\d{14}$'),
  logo_path text,
  city text check (city is null or char_length(city) <= 80),
  postal_code text check (postal_code is null or postal_code ~ '^\d{5}$'),
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger companies_updated_at before update on public.companies for each row execute function public.set_updated_at();

create or replace function public.owns_company(company uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.companies where id = company and owner_id = auth.uid())
$$;

-- ─── Offres d'emploi ───────────────────────────────────────────────────────
create table public.job_offers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 3 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  short_description text not null check (char_length(short_description) between 20 and 400),
  missions text[] not null default '{}' check (cardinality(missions) <= 15),
  profile text[] not null default '{}' check (cardinality(profile) <= 15),
  benefits text[] not null default '{}' check (cardinality(benefits) <= 15),
  contract_type public.contract_type not null,
  work_time public.work_time not null,
  schedules public.schedule[] not null default '{}',
  sector public.sector not null,
  is_student_friendly boolean not null default false,
  salary_min numeric(10, 2) check (salary_min is null or salary_min > 0),
  salary_max numeric(10, 2) check (salary_max is null or salary_max > 0),
  salary_period public.salary_period,
  hours_per_week smallint check (hours_per_week is null or hours_per_week between 1 and 48),
  duration_months smallint check (duration_months is null or duration_months between 1 and 36),
  remote public.remote_mode not null default 'none',
  city text not null check (char_length(city) between 1 and 80),
  postal_code text not null check (postal_code ~ '^\d{5}$'),
  commune_code text check (commune_code is null or commune_code ~ '^[0-9AB]{5}$'),
  lat double precision check (lat is null or lat between -90 and 90),
  lng double precision check (lng is null or lng between -180 and 180),
  status public.offer_status not null default 'draft',
  is_featured boolean not null default false,
  published_at timestamptz,
  expires_at timestamptz,
  views_count integer not null default 0 check (views_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_offers_salary_range check (salary_max is null or salary_min is null or salary_max >= salary_min),
  constraint job_offers_salary_period check ((salary_min is null) = (salary_period is null)),
  constraint job_offers_published_at check (status <> 'published' or published_at is not null)
);
create trigger job_offers_updated_at before update on public.job_offers for each row execute function public.set_updated_at();
create index job_offers_public_idx on public.job_offers (status, published_at desc);
create index job_offers_company_idx on public.job_offers (company_id);
create index job_offers_postal_code_idx on public.job_offers (postal_code);
create index job_offers_search_idx on public.job_offers
  using gin (to_tsvector('french', title || ' ' || short_description));

-- Vue publique : offres publiées + nom de l'entreprise. security_invoker = la RLS des tables s'applique.
create view public.public_job_offers with (security_invoker = true) as
  select o.*, c.name as company_name, c.description as company_description, c.logo_path as company_logo_path
  from public.job_offers o
  join public.companies c on c.id = o.company_id
  where o.status = 'published' and (o.expires_at is null or o.expires_at > now());

-- ─── Favoris ───────────────────────────────────────────────────────────────
create table public.saved_jobs (
  candidate_id uuid not null references public.profiles (id) on delete cascade,
  job_offer_id uuid not null references public.job_offers (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (candidate_id, job_offer_id)
);
create index saved_jobs_offer_idx on public.saved_jobs (job_offer_id);

-- ─── Candidatures ──────────────────────────────────────────────────────────
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_offer_id uuid not null references public.job_offers (id) on delete cascade,
  candidate_id uuid not null references public.profiles (id) on delete cascade,
  cover_message text check (cover_message is null or char_length(cover_message) <= 3000),
  status public.application_status not null default 'sent',
  status_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_offer_id, candidate_id)
);
create trigger applications_updated_at before update on public.applications for each row execute function public.set_updated_at();
create index applications_candidate_idx on public.applications (candidate_id, created_at desc);
create index applications_offer_idx on public.applications (job_offer_id, created_at desc);

create or replace function public.touch_application_status()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    new.status_updated_at := now();
  end if;
  return new;
end $$;
create trigger applications_status_touch before update on public.applications for each row execute function public.touch_application_status();

-- Fonctions SECURITY DEFINER : elles évitent une récursion entre les politiques de job_offers et d'applications.
create or replace function public.owns_offer(offer uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.job_offers o join public.companies c on c.id = o.company_id
    where o.id = offer and c.owner_id = auth.uid()
  )
$$;

-- Un candidat garde l'accès aux offres auxquelles il a postulé ou qu'il a enregistrées, même fermées.
create or replace function public.candidate_follows_offer(offer uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.applications where job_offer_id = offer and candidate_id = auth.uid())
      or exists (select 1 from public.saved_jobs where job_offer_id = offer and candidate_id = auth.uid())
$$;

-- Le recruteur propriétaire de l'offre peut-il voir ce candidat ?
create or replace function public.recruiter_can_see_candidate(candidate uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.applications a
    join public.job_offers o on o.id = a.job_offer_id
    join public.companies c on c.id = o.company_id
    where a.candidate_id = candidate and c.owner_id = auth.uid()
  )
$$;

-- Variante pour le stockage : le dossier est du texte (évite une erreur de conversion sur un nom invalide).
create or replace function public.recruiter_can_see_candidate_folder(folder text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.applications a
    join public.job_offers o on o.id = a.job_offer_id
    join public.companies c on c.id = o.company_id
    where a.candidate_id::text = folder and c.owner_id = auth.uid()
  )
$$;

-- ═══ Row Level Security ════════════════════════════════════════════════════
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.job_offers enable row level security;
alter table public.applications enable row level security;
alter table public.saved_jobs enable row level security;

-- Profils : chacun voit et modifie le sien ; un recruteur voit les candidats ayant postulé chez lui ; l'admin voit tout.
create policy "profiles: lecture de son profil" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin() or public.recruiter_can_see_candidate(id));
create policy "profiles: mise à jour de son profil" on public.profiles for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());
-- Pas d'INSERT (trigger) ni de DELETE (suppression du compte via l'API admin, en cascade).

-- Entreprises : informations publiques ; seul le recruteur propriétaire écrit.
create policy "companies: lecture publique" on public.companies for select to anon, authenticated using (true);
create policy "companies: création par un recruteur" on public.companies for insert to authenticated
  with check (owner_id = (select auth.uid()) and public.current_user_role() = 'recruiter');
create policy "companies: modification par le propriétaire" on public.companies for update to authenticated
  using (owner_id = (select auth.uid()) or public.is_admin())
  with check (owner_id = (select auth.uid()) or public.is_admin());
create policy "companies: suppression par l'admin" on public.companies for delete to authenticated using (public.is_admin());

-- Offres : publiques si publiées et non expirées ; le propriétaire voit et gère les siennes ; l'admin modère.
create policy "job_offers: lecture" on public.job_offers for select to anon, authenticated
  using (
    (status = 'published' and (expires_at is null or expires_at > now()))
    or public.owns_company(company_id)
    or public.is_admin()
    or ((select auth.uid()) is not null and public.candidate_follows_offer(id))
  );
create policy "job_offers: création" on public.job_offers for insert to authenticated
  with check (public.owns_company(company_id));
create policy "job_offers: modification" on public.job_offers for update to authenticated
  using (public.owns_company(company_id) or public.is_admin())
  with check (public.owns_company(company_id) or public.is_admin());
create policy "job_offers: suppression" on public.job_offers for delete to authenticated
  using (public.owns_company(company_id) or public.is_admin());

-- Candidatures : le candidat crée et lit les siennes ; le recruteur lit et change le statut pour ses offres.
create policy "applications: lecture" on public.applications for select to authenticated
  using (
    candidate_id = (select auth.uid())
    or public.is_admin()
    or public.owns_offer(job_offer_id)
  );
create policy "applications: candidature" on public.applications for insert to authenticated
  with check (
    candidate_id = (select auth.uid())
    and status = 'sent'
    and public.current_user_role() = 'candidate'
    and exists (select 1 from public.job_offers o where o.id = job_offer_id and o.status = 'published' and (o.expires_at is null or o.expires_at > now()))
  );
create policy "applications: statut par le recruteur" on public.applications for update to authenticated
  using (public.owns_offer(job_offer_id) or public.is_admin())
  with check (public.owns_offer(job_offer_id) or public.is_admin());
create policy "applications: retrait par le candidat" on public.applications for delete to authenticated
  using (candidate_id = (select auth.uid()) and status in ('sent', 'reviewing'));
-- Seul le statut est modifiable après coup (pas le message ni l'offre).
revoke update on public.applications from authenticated, anon;
grant update (status) on public.applications to authenticated;

-- Favoris : strictement personnels.
create policy "saved_jobs: lecture" on public.saved_jobs for select to authenticated using (candidate_id = (select auth.uid()));
create policy "saved_jobs: ajout" on public.saved_jobs for insert to authenticated with check (candidate_id = (select auth.uid()));
create policy "saved_jobs: suppression" on public.saved_jobs for delete to authenticated using (candidate_id = (select auth.uid()));

-- ═══ Stockage des fichiers (privé) ═════════════════════════════════════════
-- Rangement : <bucket>/<id utilisateur>/<fichier>. Accès par URL signées de courte durée.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('avatars', 'avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('cvs', 'cvs', false, 4194304, array['application/pdf'])
on conflict (id) do nothing;

create policy "fichiers: le propriétaire lit les siens" on storage.objects for select to authenticated
  using (bucket_id in ('avatars', 'cvs') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "fichiers: le propriétaire dépose les siens" on storage.objects for insert to authenticated
  with check (bucket_id in ('avatars', 'cvs') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "fichiers: le propriétaire remplace les siens" on storage.objects for update to authenticated
  using (bucket_id in ('avatars', 'cvs') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "fichiers: le propriétaire supprime les siens" on storage.objects for delete to authenticated
  using (bucket_id in ('avatars', 'cvs') and (storage.foldername(name))[1] = (select auth.uid())::text);
-- CV et photo visibles uniquement par les recruteurs auprès desquels le candidat a postulé, et par l'admin.
create policy "fichiers: recruteurs des candidatures reçues" on storage.objects for select to authenticated
  using (
    bucket_id in ('avatars', 'cvs')
    and (public.is_admin() or public.recruiter_can_see_candidate_folder((storage.foldername(name))[1]))
  );
