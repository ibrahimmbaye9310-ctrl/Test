-- ═══════════════════════════════════════════════════════════════════════════
-- JobFinder — Migration 2 : espace recruteur
-- Logos d'entreprise, règles de publication des offres, statistiques de vues.
-- Ré-exécutable sans erreur (chaque objet est supprimé s'il existe avant d'être recréé).
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Offres : règles appliquées par la base, quel que soit le client ─────────
-- Les identifiants des offres de démonstration contiennent « -demo- » : interdit pour les vraies offres.
alter table public.job_offers drop constraint if exists job_offers_slug_not_demo;
alter table public.job_offers add constraint job_offers_slug_not_demo check (slug not like '%-demo-%');
-- Une offre publiée a toujours une date d'expiration (30 jours par défaut).
-- Les offres déjà publiées sans date en reçoivent une : 30 jours après leur publication.
update public.job_offers set expires_at = coalesce(published_at, created_at) + interval '30 days'
  where status = 'published' and expires_at is null;
alter table public.job_offers drop constraint if exists job_offers_expiry;
alter table public.job_offers add constraint job_offers_expiry check (status <> 'published' or expires_at is not null);

create or replace function public.guard_job_offer()
returns trigger language plpgsql set search_path = '' as $$
declare
  privileged boolean := current_user in ('postgres', 'service_role', 'supabase_admin') or public.is_admin();
begin
  if privileged then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    -- Champs gérés par la plateforme (mise en avant = formule Pro en phase 7 ; vues = compteur).
    if new.is_featured is distinct from old.is_featured then raise exception 'Mise en avant non modifiable' using errcode = '42501'; end if;
    if new.views_count is distinct from old.views_count then raise exception 'Compteur non modifiable' using errcode = '42501'; end if;
    if new.company_id is distinct from old.company_id then raise exception 'Entreprise non modifiable' using errcode = '42501'; end if;
    -- Une offre refusée par la modération ne peut pas être republiée par le recruteur.
    if old.status = 'rejected' and new.status = 'published' then raise exception 'Offre refusée par la modération' using errcode = '42501'; end if;
  else
    new.is_featured := false;
    new.views_count := 0;
  end if;

  -- Statuts autorisés au recruteur : brouillon, publiée, fermée (« pending », « rejected » et « expired » : plateforme).
  if new.status in ('pending', 'rejected', 'expired') and (tg_op = 'INSERT' or new.status is distinct from old.status) then
    raise exception 'Statut réservé à la plateforme' using errcode = '42501';
  end if;

  -- Publication : date de publication et expiration à 30 jours fixées par la base.
  if new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published') then
    new.published_at := now();
    new.expires_at := now() + interval '30 days';
  end if;
  return new;
end $$;
drop trigger if exists job_offers_guard on public.job_offers;
create trigger job_offers_guard before insert or update on public.job_offers for each row execute function public.guard_job_offer();

-- ─── Statistiques de vues par jour ─────────────────────────────────────────
create table if not exists public.offer_daily_views (
  job_offer_id uuid not null references public.job_offers (id) on delete cascade,
  day date not null default current_date,
  views integer not null default 0 check (views >= 0),
  primary key (job_offer_id, day)
);
alter table public.offer_daily_views enable row level security;
drop policy if exists "offer_daily_views: lecture par le propriétaire" on public.offer_daily_views;
create policy "offer_daily_views: lecture par le propriétaire" on public.offer_daily_views for select to authenticated
  using (public.owns_offer(job_offer_id) or public.is_admin());
-- Aucune écriture directe : uniquement via record_offer_view().

-- Compte une vue d'offre publiée (appelée par la page publique ; jamais pour le propriétaire de l'offre).
create or replace function public.record_offer_view(offer uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.job_offers where id = offer and status = 'published') then return; end if;
  if auth.uid() is not null and public.owns_offer(offer) then return; end if;
  insert into public.offer_daily_views (job_offer_id, day, views) values (offer, current_date, 1)
    on conflict (job_offer_id, day) do update set views = public.offer_daily_views.views + 1;
  update public.job_offers set views_count = views_count + 1 where id = offer;
end $$;
revoke all on function public.record_offer_view(uuid) from public;
grant execute on function public.record_offer_view(uuid) to anon, authenticated;

-- ─── Logos d'entreprise (publics : affichés sur les offres) ────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('logos', 'logos', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Rangement : logos/<id du recruteur>/<fichier>. Lecture publique via l'URL du bucket public.
drop policy if exists "logos: le recruteur dépose le sien" on storage.objects;
create policy "logos: le recruteur dépose le sien" on storage.objects for insert to authenticated
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = (select auth.uid())::text and public.current_user_role() = 'recruiter');
drop policy if exists "logos: le recruteur remplace le sien" on storage.objects;
create policy "logos: le recruteur remplace le sien" on storage.objects for update to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "logos: le recruteur supprime le sien" on storage.objects;
create policy "logos: le recruteur supprime le sien" on storage.objects for delete to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "logos: le recruteur liste les siens" on storage.objects;
create policy "logos: le recruteur liste les siens" on storage.objects for select to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = (select auth.uid())::text);

alter table public.companies drop constraint if exists companies_logo_path_owner;
alter table public.companies add constraint companies_logo_path_owner check (logo_path is null or logo_path like owner_id::text || '/%');
