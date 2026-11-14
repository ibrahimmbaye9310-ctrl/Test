-- Tests des règles d'accès (RLS). Exécutés sur un PostgreSQL local avec supabase-stubs.sql.
-- Chaque vérification lève une exception en cas d'échec ; le script s'arrête au premier problème.
\set ON_ERROR_STOP 1
set client_min_messages = notice;

create schema t;
grant usage on schema t to anon, authenticated;
-- Vérifie qu'une requête est refusée (erreur ou aucune ligne affectée).
create function t.denied(label text, q text) returns void language plpgsql as $$
declare n int;
begin
  begin
    execute q;
    get diagnostics n = row_count;
  exception when others then
    raise notice 'OK  refusé : % (%)', label, sqlerrm; return;
  end;
  if n = 0 then raise notice 'OK  refusé : % (0 ligne)', label; return; end if;
  raise exception 'ÉCHEC — aurait dû être refusé : %', label;
end $$;
create function t.allowed(label text, q text) returns void language plpgsql as $$
declare n int;
begin
  execute q; get diagnostics n = row_count;
  if n = 0 then raise exception 'ÉCHEC — aucune ligne affectée : %', label; end if;
  raise notice 'OK  autorisé : %', label;
end $$;
create function t.count_is(label text, q text, expected int) returns void language plpgsql as $$
declare n int;
begin
  execute 'select count(*) from (' || q || ') x' into n;
  if n <> expected then raise exception 'ÉCHEC — % : % ligne(s) au lieu de %', label, n, expected; end if;
  raise notice 'OK  % : % ligne(s)', label, n;
end $$;
grant execute on all functions in schema t to anon, authenticated;

-- Utilisateurs : 2 candidats, 2 recruteurs (dont un qui tente de se déclarer admin).
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@test.fr', '{"full_name":"Alice","role":"candidate"}'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@test.fr', '{"full_name":"Bob","role":"admin"}'),
  ('00000000-0000-0000-0000-00000000000c', 'rh@acme.fr', '{"full_name":"Claire RH","role":"recruiter"}'),
  ('00000000-0000-0000-0000-00000000000d', 'rh@autre.fr', '{"full_name":"Denis RH","role":"recruiter"}');

select t.count_is('inscription : rôle admin demandé → candidat', $$select 1 from public.profiles where id = '00000000-0000-0000-0000-00000000000b' and role = 'candidate'$$, 1);
select t.count_is('inscription : rôle recruteur', $$select 1 from public.profiles where role = 'recruiter'$$, 2);

-- ── Alice (candidate)
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select t.count_is('candidat : ne voit que son profil', 'select * from public.profiles', 1);
select t.allowed('candidat : modifie son profil', $$update public.profiles set city = 'Créteil', skills = '{vente}' where id = auth.uid()$$);
select t.denied('candidat : change son rôle', $$update public.profiles set role = 'admin' where id = auth.uid()$$);
select t.denied('candidat : modifie le profil d''un autre', $$update public.profiles set city = 'X' where id = '00000000-0000-0000-0000-00000000000b'$$);
select t.denied('candidat : cv_path hors de son dossier', $$update public.profiles set cv_path = '00000000-0000-0000-0000-00000000000b/cv.pdf' where id = auth.uid()$$);
select t.denied('candidat : crée une entreprise', $$insert into public.companies (owner_id, name, slug) values (auth.uid(), 'Fake', 'fake')$$);
select t.allowed('candidat : dépose son CV', $$insert into storage.objects (bucket_id, name) values ('cvs', auth.uid() || '/cv.pdf')$$);
select t.denied('candidat : dépose dans le dossier d''un autre', $$insert into storage.objects (bucket_id, name) values ('cvs', '00000000-0000-0000-0000-00000000000b/cv.pdf')$$);
reset role;

-- ── Bob dépose aussi un CV (pour les tests d'accès recruteur)
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select t.allowed('candidat B : dépose son CV', $$insert into storage.objects (bucket_id, name) values ('cvs', auth.uid() || '/cv.pdf')$$);
select t.count_is('candidat B : ne voit pas le CV d''Alice', $$select 1 from storage.objects where name like '00000000-0000-0000-0000-00000000000a/%'$$, 0);
reset role;

-- ── Claire (recruteuse ACME)
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select t.allowed('recruteur : crée son entreprise', $$insert into public.companies (id, owner_id, name, slug) values ('10000000-0000-0000-0000-000000000001', auth.uid(), 'ACME', 'acme')$$);
select t.denied('recruteur : 2e entreprise', $$insert into public.companies (owner_id, name, slug) values (auth.uid(), 'ACME 2', 'acme-2')$$);
select t.allowed('recruteur : publie une offre', $$insert into public.job_offers (id, company_id, title, slug, short_description, contract_type, work_time, sector, city, postal_code, status, published_at)
  values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Vendeur', 'vendeur-acme', 'Une description suffisamment longue.', 'cdi', 'full_time', 'retail', 'Créteil', '94000', 'published', now())$$);
select t.allowed('recruteur : crée un brouillon', $$insert into public.job_offers (id, company_id, title, slug, short_description, contract_type, work_time, sector, city, postal_code)
  values ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Brouillon', 'brouillon-acme', 'Une description suffisamment longue.', 'cdd', 'part_time', 'retail', 'Créteil', '94000')$$);
select t.denied('offre : salaire max < min', $$insert into public.job_offers (company_id, title, slug, short_description, contract_type, work_time, sector, city, postal_code, salary_min, salary_max, salary_period)
  values ('10000000-0000-0000-0000-000000000001', 'Test', 'test-sal', 'Une description suffisamment longue.', 'cdi', 'full_time', 'retail', 'Créteil', '94000', 2000, 1500, 'month')$$);
reset role;

-- ── Denis (autre recruteur)
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000d';
select t.denied('recruteur B : publie pour ACME', $$insert into public.job_offers (company_id, title, slug, short_description, contract_type, work_time, sector, city, postal_code)
  values ('10000000-0000-0000-0000-000000000001', 'Pirate', 'pirate', 'Une description suffisamment longue.', 'cdi', 'full_time', 'retail', 'Paris', '75001')$$);
select t.denied('recruteur B : modifie l''offre d''ACME', $$update public.job_offers set title = 'Pirate' where company_id = '10000000-0000-0000-0000-000000000001'$$);
select t.denied('recruteur B : supprime l''offre d''ACME', $$delete from public.job_offers where company_id = '10000000-0000-0000-0000-000000000001'$$);
select t.count_is('recruteur B : ne voit pas le brouillon d''ACME', $$select 1 from public.job_offers where status = 'draft'$$, 0);
reset role;

-- ── Visiteur anonyme
set role anon; set request.jwt.claim.sub = '';
select t.count_is('anonyme : voit uniquement les offres publiées', 'select * from public.job_offers', 1);
select t.count_is('anonyme : vue publique avec nom d''entreprise', $$select 1 from public.public_job_offers where company_name = 'ACME'$$, 1);
select t.count_is('anonyme : aucun profil', 'select * from public.profiles', 0);
select t.denied('anonyme : candidature', $$insert into public.applications (job_offer_id, candidate_id) values ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a')$$);
reset role;

-- ── Alice postule
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select t.allowed('candidat : postule à une offre publiée', $$insert into public.applications (job_offer_id, candidate_id, cover_message) values ('20000000-0000-0000-0000-000000000001', auth.uid(), 'Bonjour')$$);
select t.denied('candidat : postule deux fois', $$insert into public.applications (job_offer_id, candidate_id) values ('20000000-0000-0000-0000-000000000001', auth.uid())$$);
select t.denied('candidat : postule à un brouillon', $$insert into public.applications (job_offer_id, candidate_id) values ('20000000-0000-0000-0000-000000000002', auth.uid())$$);
select t.denied('candidat : postule au nom d''un autre', $$insert into public.applications (job_offer_id, candidate_id) values ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000b')$$);
select t.denied('candidat : change le statut de sa candidature', $$update public.applications set status = 'accepted'$$);
select t.allowed('candidat : ajoute un favori', $$insert into public.saved_jobs (candidate_id, job_offer_id) values (auth.uid(), '20000000-0000-0000-0000-000000000001')$$);
select t.denied('candidat : favori pour un autre', $$insert into public.saved_jobs (candidate_id, job_offer_id) values ('00000000-0000-0000-0000-00000000000b', '20000000-0000-0000-0000-000000000001')$$);
reset role;

-- ── Bob ne voit rien d'Alice
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select t.count_is('candidat B : ne voit pas les candidatures d''Alice', 'select * from public.applications', 0);
select t.count_is('candidat B : ne voit pas les favoris d''Alice', 'select * from public.saved_jobs', 0);
reset role;

-- ── Claire gère la candidature reçue
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select t.count_is('recruteur : voit la candidature reçue', 'select * from public.applications', 1);
select t.count_is('recruteur : voit le profil du candidat', $$select 1 from public.profiles where id = '00000000-0000-0000-0000-00000000000a'$$, 1);
select t.count_is('recruteur : ne voit pas un candidat qui n''a pas postulé', $$select 1 from public.profiles where id = '00000000-0000-0000-0000-00000000000b'$$, 0);
select t.count_is('recruteur : peut lire le CV du candidat', $$select 1 from storage.objects where name = '00000000-0000-0000-0000-00000000000a/cv.pdf'$$, 1);
select t.count_is('recruteur : ne lit pas le CV d''un non-candidat', $$select 1 from storage.objects where name = '00000000-0000-0000-0000-00000000000b/cv.pdf'$$, 0);
select t.allowed('recruteur : passe le statut à « entretien »', $$update public.applications set status = 'interview'$$);
select t.denied('recruteur : modifie le message du candidat', $$update public.applications set cover_message = 'modifié'$$);
reset role;

-- ── Denis ne voit rien d'ACME
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000d';
select t.count_is('recruteur B : ne voit pas les candidatures d''ACME', 'select * from public.applications', 0);
select t.count_is('recruteur B : ne voit pas le profil d''Alice', $$select 1 from public.profiles where id = '00000000-0000-0000-0000-00000000000a'$$, 0);
select t.count_is('recruteur B : ne lit pas le CV d''Alice', $$select 1 from storage.objects where bucket_id = 'cvs'$$, 0);
select t.denied('recruteur B : change le statut', $$update public.applications set status = 'rejected'$$);
reset role;

-- ── Claire ferme l'offre : Alice (qui a postulé) la voit encore, pas Bob
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select t.allowed('recruteur : ferme son offre', $$update public.job_offers set status = 'closed' where id = '20000000-0000-0000-0000-000000000001'$$);
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select t.count_is('candidat B : ne voit pas l''offre fermée', $$select 1 from public.job_offers where id = '20000000-0000-0000-0000-000000000001'$$, 0);
reset role;
set role anon; set request.jwt.claim.sub = '';
select t.count_is('anonyme : ne voit plus l''offre fermée', 'select * from public.job_offers', 0);
reset role;

-- ── Alice voit le nouveau statut ; retrait impossible une fois en entretien
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select t.count_is('candidat : voit le statut « entretien »', $$select 1 from public.applications where status = 'interview'$$, 1);
select t.count_is('candidat : voit encore l''offre fermée à laquelle il a postulé', $$select 1 from public.job_offers where id = '20000000-0000-0000-0000-000000000001'$$, 1);
select t.denied('candidat : retire une candidature en entretien', 'delete from public.applications');
reset role;

-- ═══ Migration 2 : règles de publication, vues, logos ═══
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select t.denied('recruteur : se met « à la une » lui-même', $$update public.job_offers set is_featured = true where id = '20000000-0000-0000-0000-000000000002'$$);
select t.denied('recruteur : gonfle le compteur de vues', $$update public.job_offers set views_count = 999 where id = '20000000-0000-0000-0000-000000000002'$$);
select t.denied('recruteur : statut « pending » réservé', $$update public.job_offers set status = 'pending' where id = '20000000-0000-0000-0000-000000000002'$$);
select t.denied('recruteur : identifiant « -demo- »', $$insert into public.job_offers (company_id, title, slug, short_description, contract_type, work_time, sector, city, postal_code)
  values ('10000000-0000-0000-0000-000000000001', 'Faux', 'faux-demo-1', 'Une description suffisamment longue.', 'cdi', 'full_time', 'retail', 'Paris', '75001')$$);
select t.allowed('recruteur : publie son brouillon', $$update public.job_offers set status = 'published', published_at = '2000-01-01', expires_at = '2000-02-01' where id = '20000000-0000-0000-0000-000000000002'$$);
select t.count_is('publication : dates fixées par la base (pas par le client)', $$select 1 from public.job_offers where id = '20000000-0000-0000-0000-000000000002' and published_at > now() - interval '1 minute' and expires_at > now() + interval '29 days'$$, 1);
select t.count_is('insertion publiée : jamais « à la une »', $$select 1 from public.job_offers where is_featured$$, 0);
select t.allowed('recruteur : dépose son logo', $$insert into storage.objects (bucket_id, name) values ('logos', auth.uid() || '/logo.png')$$);
select t.denied('recruteur : logo dans le dossier d''un autre', $$insert into storage.objects (bucket_id, name) values ('logos', '00000000-0000-0000-0000-00000000000d/logo.png')$$);
select t.allowed('recruteur : enregistre le chemin de son logo', $$update public.companies set logo_path = auth.uid() || '/logo.png' where owner_id = auth.uid()$$);
select t.denied('recruteur : chemin de logo d''un autre', $$update public.companies set logo_path = '00000000-0000-0000-0000-00000000000d/logo.png' where owner_id = auth.uid()$$);
select public.record_offer_view('20000000-0000-0000-0000-000000000002');
select t.count_is('vue par le propriétaire : non comptée', $$select 1 from public.job_offers where id = '20000000-0000-0000-0000-000000000002' and views_count = 0$$, 1);
reset role;

set role anon; set request.jwt.claim.sub = '';
select public.record_offer_view('20000000-0000-0000-0000-000000000002');
select public.record_offer_view('20000000-0000-0000-0000-000000000002');
select public.record_offer_view('20000000-0000-0000-0000-000000000001'); -- offre fermée : ignorée
select t.denied('anonyme : écrit directement les statistiques', $$insert into public.offer_daily_views (job_offer_id, views) values ('20000000-0000-0000-0000-000000000002', 100)$$);
select t.count_is('anonyme : ne lit pas les statistiques', 'select * from public.offer_daily_views', 0);
select t.denied('anonyme : dépose un logo', $$insert into storage.objects (bucket_id, name) values ('logos', 'x/logo.png')$$);
reset role;

set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select t.count_is('statistiques : 2 vues visiteurs comptées', $$select 1 from public.offer_daily_views where job_offer_id = '20000000-0000-0000-0000-000000000002' and views = 2$$, 1);
select t.count_is('compteur global à jour', $$select 1 from public.job_offers where id = '20000000-0000-0000-0000-000000000002' and views_count = 2$$, 1);
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000d';
select t.count_is('recruteur B : ne lit pas les statistiques d''ACME', 'select * from public.offer_daily_views', 0);
reset role;

-- ═══ Migration 3 : notifications, signalements, abonnements, limitation ═══
select t.count_is('notification : recruteur prévenu de la candidature', $$select 1 from public.notifications where user_id = '00000000-0000-0000-0000-00000000000c' and type = 'application_received'$$, 1);
select t.count_is('notification : candidat prévenu du passage en entretien', $$select 1 from public.notifications where user_id = '00000000-0000-0000-0000-00000000000a' and type = 'application_status' and title like '%Entretien'$$, 1);

set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select t.count_is('candidat : ne voit que ses notifications', 'select * from public.notifications', 1);
select t.allowed('candidat : marque sa notification comme lue', 'update public.notifications set read_at = now()');
select t.denied('candidat : modifie le texte d''une notification', $$update public.notifications set title = 'Faux'$$);
select t.denied('candidat : crée une notification', $$insert into public.notifications (user_id, type, title) values (auth.uid(), 'system', 'Spam')$$);
select t.allowed('candidat : signale une offre publiée', $$insert into public.reports (job_offer_id, reporter_id, reason, details) values ('20000000-0000-0000-0000-000000000002', auth.uid(), 'fraud', 'Demande de paiement')$$);
select t.denied('candidat : signale deux fois la même offre', $$insert into public.reports (job_offer_id, reporter_id, reason) values ('20000000-0000-0000-0000-000000000002', auth.uid(), 'other')$$);
select t.denied('candidat : signale au nom d''un autre', $$insert into public.reports (job_offer_id, reporter_id, reason) values ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000b', 'other')$$);
select t.denied('candidat : clôt lui-même son signalement', $$update public.reports set status = 'resolved'$$);
select t.denied('candidat : crée un abonnement', $$insert into public.subscriptions (company_id, stripe_customer_id) values ('10000000-0000-0000-0000-000000000001', 'cus_x')$$);
select t.count_is('limitation : 3 premières tentatives acceptées', $$select 1 from generate_series(1,3) where public.check_rate_limit('test:cle-de-test', 3, 60)$$, 3);
select t.count_is('limitation : 4e tentative refusée', $$select 1 where not public.check_rate_limit('test:cle-de-test', 3, 60)$$, 1);
select t.denied('limitation : table illisible directement', 'delete from public.rate_limits');
select t.denied('purge : réservée au serveur', 'select public.run_data_retention()');
reset role;

set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select t.denied('recruteur : signale sa propre offre', $$insert into public.reports (job_offer_id, reporter_id, reason) values ('20000000-0000-0000-0000-000000000002', auth.uid(), 'other')$$);
select t.count_is('recruteur : ne voit pas qui l''a signalé', 'select * from public.reports', 0);
select t.denied('recruteur : s''attribue un abonnement', $$insert into public.subscriptions (company_id, stripe_customer_id, plan, status) values ('10000000-0000-0000-0000-000000000001', 'cus_x', 'pro', 'active')$$);
select t.denied('recruteur : enregistre un faux paiement', $$insert into public.payments (company_id, kind, stripe_reference, amount_cents, status) values ('10000000-0000-0000-0000-000000000001', 'subscription', 'in_x', 5900, 'succeeded')$$);
reset role;
insert into public.subscriptions (company_id, stripe_customer_id, plan, status) values ('10000000-0000-0000-0000-000000000001', 'cus_test', 'pro', 'active');
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select t.count_is('recruteur : lit son abonnement', 'select * from public.subscriptions', 1);
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000d';
select t.count_is('recruteur B : ne lit pas l''abonnement d''ACME', 'select * from public.subscriptions', 0);
reset role;

update public.job_offers set expires_at = now() - interval '1 day' where id = '20000000-0000-0000-0000-000000000002';
select public.run_data_retention();
select t.count_is('purge : offre échue passée en « expirée »', $$select 1 from public.job_offers where id = '20000000-0000-0000-0000-000000000002' and status = 'expired'$$, 1);

-- ── Suppression de compte : tout part en cascade
delete from auth.users where id = '00000000-0000-0000-0000-00000000000a';
select t.count_is('suppression : profil, candidatures et favoris effacés',
  $$select 1 from public.profiles where id = '00000000-0000-0000-0000-00000000000a' union all select 1 from public.applications union all select 1 from public.saved_jobs$$, 0);

\echo '✅ Tous les tests RLS sont passés'
