-- ═══════════════════════════════════════════════════════════════════════════
-- JobFinder — Migration 6 : e-mails transactionnels
-- Ré-exécutable sans erreur.
-- ═══════════════════════════════════════════════════════════════════════════

-- Adresse e-mail et nom d'un compte, pour l'envoi d'un e-mail par le serveur.
-- Réservé au serveur (clé secrète Supabase, ou clé de facturation en test) : jamais exposé au navigateur.
create or replace function public.server_user_contact(target uuid)
returns table (email text, full_name text, role public.user_role)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.billing_caller_ok() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  return query select u.email::text, p.full_name, p.role from auth.users u join public.profiles p on p.id = u.id where u.id = target;
end $$;

-- Contact du recruteur propriétaire d'une entreprise (e-mails de facturation et de candidatures).
create or replace function public.server_company_contact(company uuid)
returns table (email text, full_name text, company_name text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.billing_caller_ok() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  return query select u.email::text, p.full_name, c.name from public.companies c
    join public.profiles p on p.id = c.owner_id join auth.users u on u.id = c.owner_id where c.id = company;
end $$;

revoke all on function public.server_user_contact(uuid) from public;
revoke all on function public.server_company_contact(uuid) from public;
grant execute on function public.server_user_contact(uuid) to anon, authenticated, service_role;
grant execute on function public.server_company_contact(uuid) to anon, authenticated, service_role;
