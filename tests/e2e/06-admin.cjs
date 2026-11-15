// Tests de bout en bout phase 6 : espace administrateur, modération, signalements, suspension, avis, journal.
const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const URL_ = 'https://ntfzctzimthfrcnllalc.supabase.co', KEY = fs.readFileSync(require('path').resolve(__dirname, '../../.env.local'), 'utf8').match(/PUBLISHABLE_KEY=(\S+)/)[1];
const base = 'http://localhost:3100', ts = Date.now(), PW = 'Jobfinder-test-2026', dir = __dirname;
const admin = JSON.parse(fs.readFileSync((process.env.ADMIN_JSON ?? require('path').resolve(__dirname, '.admin.json')), 'utf8'));
const rec = `e2e.recruteur.${ts}@example.com`, cand = `e2e.candidat.${ts}@example.com`;
fs.appendFileSync(require('path').resolve(__dirname, '.accounts.log'), [rec, cand].join('\n') + '\n');
let failures = 0;
const ok = (c, m) => { console.log((c ? '✅ ' : '❌ ') + m); if (!c) failures++; };
const sb = () => createClient(URL_, KEY, { auth: { persistSession: false } });
const TITLE = `Vendeur E2E ${ts}`, COMPANY = `Boutique E2E ${ts}`;

(async () => {
  const b = await chromium.launch();
  const errs = [];
  const page = async () => { const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); p.on('pageerror', e => errs.push(String(e))); return p; };
  const see = (p, t, ms = 10000) => p.getByText(t).first().waitFor({ timeout: ms }).then(() => true, () => false);
  const login = async (p, email, pw = PW) => { await p.goto(base + '/connexion'); await p.fill('#email', email); await p.fill('#password', pw); await p.click('main button[type=submit]'); await p.waitForURL(u => !u.toString().includes('/connexion'), { timeout: 15000 }).catch(() => {}); };

  // ── Accès réservé
  const anon = await page(); await anon.goto(base + '/admin'); ok(anon.url().includes('/connexion'), 'Visiteur sur /admin → connexion');
  const c = await page();
  await c.goto(base + '/inscription'); await c.fill('#fullName', 'Zoé Candidate'); await c.fill('#email', cand); await c.fill('#password', PW); await c.check('input[name=terms]');
  await c.click('main button[type=submit]'); await c.waitForURL(/\/espace/, { timeout: 15000 });
  await c.goto(base + '/admin'); ok(c.url().endsWith('/espace'), 'Candidat sur /admin → renvoyé vers son espace');
  const C = sb(); await C.auth.signInWithPassword({ email: cand, password: PW });
  ok(!!(await C.rpc('admin_stats')).error && !!(await C.rpc('admin_list_users', {})).error, 'API : statistiques et liste des comptes refusées à un candidat');

  // ── Recruteur non vérifié : son offre part en vérification
  const r = await page();
  await r.goto(base + '/inscription?role=recruteur'); await r.fill('#companyName', COMPANY); await r.fill('#fullName', 'Hugo Gérant'); await r.fill('#email', rec); await r.fill('#password', PW); await r.check('input[name=terms]');
  await r.click('main button[type=submit]'); await r.waitForURL(/\/recruteur/, { timeout: 15000 });
  await r.goto(base + '/recruteur/entreprise'); await r.click('#informations button[type=submit]'); await r.waitForURL(/bienvenue/, { timeout: 15000 });
  const R = sb(); await R.auth.signInWithPassword({ email: rec, password: PW });
  const { data: co } = await R.from('companies').select('id').eq('owner_id', (await R.auth.getUser()).data.user.id).single();
  await (await require('./admin-helper.cjs')()).from('offer_credits').insert([{ company_id: co.id, source: 'admin', note: 'tests' }, { company_id: co.id, source: 'admin', note: 'tests' }]);
  const hack = await R.from('companies').update({ is_verified: true }).eq('id', co.id).select('id');
  ok(!!hack.error, 'Faille corrigée : un recruteur ne peut pas se déclarer « vérifié »');
  await r.goto(base + '/recruteur/offres/nouvelle');
  ok(await see(r, "n'est pas encore vérifiée"), 'Formulaire : avertissement « entreprise non vérifiée »');
  await r.fill('#title', TITLE); await r.fill('#shortDescription', 'Conseil client en boutique de prêt-à-porter, offre de test.');
  await r.selectOption('#contractType', 'cdi'); await r.selectOption('#workTime', 'full_time'); await r.selectOption('#sector', 'retail');
  await r.locator('label', { hasText: 'Journée' }).click(); await r.fill('#location', 'Créteil'); await r.fill('#missions', 'Conseiller les clients');
  await r.click('button[value=publish]'); await r.waitForURL(/verification=1/, { timeout: 15000 }).catch(() => {});
  ok(r.url().includes('verification=1') && await see(r, 'Offre envoyée en vérification'), 'Publication → « envoyée en vérification »');
  const offerId = r.url().match(/offres\/([0-9a-f-]{36})/)[1];
  const { data: st0 } = await R.from('job_offers').select('status, slug').eq('id', offerId).single();
  ok(st0.status === 'pending', 'En base : statut « pending »');
  const pub = await anon.goto(base + `/offres/${st0.slug}`); ok(pub.status() === 404, 'Public : offre en attente invisible (404)');

  // ── Administrateur
  const a = await page(); await login(a, admin.email, admin.password);
  ok(a.url().endsWith('/admin'), 'Admin : connexion → /admin');
  ok(await see(a, 'À traiter') && await see(a, 'Offres en attente de validation'), 'Vue d\'ensemble : encadré « À traiter »');
  for (const label of ['Candidats', 'Recruteurs', 'Offres en ligne', 'Revenus encaissés (total)', 'Abonnements actifs']) ok(await see(a, label), `Vue d'ensemble : indicateur « ${label} »`);
  await a.goto(base + '/admin/moderation');
  const card = a.locator('li', { hasText: TITLE });
  ok(await card.isVisible() && await card.getByText('Non vérifiée').isVisible(), 'Modération : offre listée, entreprise « non vérifiée »');
  await card.getByRole('link', { name: TITLE }).click(); await a.waitForURL(/\/admin\/offres\//);
  ok(await see(a, 'Conseiller les clients'), 'Aperçu complet de l\'offre en attente');
  await a.goto(base + '/admin/moderation');
  await a.locator('li', { hasText: TITLE }).getByRole('button', { name: 'Refuser' }).click();
  await a.locator('li', { hasText: TITLE }).getByRole('button', { name: 'Confirmer le refus' }).click();
  ok(await see(a, 'Indiquez le motif du refus'), 'Refus : motif obligatoire');
  await a.locator('li', { hasText: TITLE }).getByRole('button', { name: 'Valider' }).click();
  ok(await see(a, 'Offre validée'), 'Admin : offre validée');
  const { data: st1 } = await R.from('job_offers').select('status, expires_at').eq('id', offerId).single();
  ok(st1.status === 'published' && new Date(st1.expires_at) > new Date(Date.now() + 29 * 864e5), 'En base : publiée, expiration à 30 jours');
  await r.goto(base + '/recruteur/notifications'); ok(await see(r, 'Offre validée et en ligne'), 'Recruteur notifié de la validation');
  ok((await anon.goto(base + `/offres/${st0.slug}`)).status() === 200, 'Public : offre visible après validation');

  // ── Modification du contenu par un non vérifié → nouvelle vérification
  await R.from('job_offers').update({ title: TITLE + ' (modifié)' }).eq('id', offerId);
  ok((await R.from('job_offers').select('status').eq('id', offerId).single()).data.status === 'pending', 'Non vérifié : modification du contenu → nouvelle vérification');

  // ── Entreprises : vérification
  await a.goto(base + `/admin/entreprises?q=${encodeURIComponent(COMPANY)}`);
  await a.locator('tr', { hasText: COMPANY }).getByRole('button', { name: 'Vérifier' }).click();
  ok(await a.locator('tr', { hasText: COMPANY }).getByText('Vérifiée').waitFor({ timeout: 10000 }).then(() => true, () => false), 'Admin : entreprise vérifiée');
  await R.from('job_offers').update({ status: 'published' }).eq('id', offerId);
  ok((await R.from('job_offers').select('status').eq('id', offerId).single()).data.status === 'published', 'Entreprise vérifiée : publication directe');

  // ── Signalement → traitement
  await c.goto(base + `/offres/${st0.slug}`);
  await c.getByRole('button', { name: 'Signaler cette annonce' }).click(); await c.selectOption('#report-reason', 'fraud'); await c.fill('#report-details', `Demande de frais d'inscription ${ts}`);
  await c.getByRole('button', { name: 'Envoyer le signalement' }).click(); await see(c, 'Notre équipe de modération');
  await a.goto(base + '/admin/signalements');
  const rep = a.locator('li', { hasText: `frais d'inscription ${ts}` });
  ok(await rep.isVisible() && await rep.getByText('Arnaque ou demande d\'argent').isVisible(), 'Signalement visible avec son motif');
  await rep.getByRole('button', { name: 'Retirer du site' }).click(); await rep.getByRole('button', { name: 'Retirer', exact: true }).click();
  ok(await see(a, 'Offre retirée du site'), 'Admin : annonce frauduleuse retirée depuis le signalement');
  await rep.getByPlaceholder('Note interne').fill('Arnaque confirmée'); await rep.getByRole('button', { name: 'Marquer traité' }).click();
  ok(await see(a, 'Signalement traité'), 'Signalement marqué traité');
  ok((await anon.goto(base + `/offres/${st0.slug}`)).status() === 404, 'Public : annonce retirée (404)');

  // ── Suspension
  await a.goto(base + `/admin/utilisateurs?q=${encodeURIComponent(rec)}`);
  const row = a.locator('tr', { hasText: rec });
  ok(await row.isVisible(), 'Utilisateurs : recherche par e-mail');
  await row.getByRole('button', { name: 'Suspendre' }).click(); await row.getByPlaceholder('Motif').fill('Fraude avérée (test)');
  await row.getByRole('button', { name: 'Suspendre' }).last().click();
  ok(await see(a, 'Compte suspendu'), 'Admin : compte suspendu');
  await r.goto(base + '/recruteur'); ok(r.url().includes('/compte-suspendu'), 'Recruteur suspendu : redirigé vers « Compte suspendu »');
  const r2 = await page(); await login(r2, rec);
  ok(await see(r2, 'Ce compte a été suspendu'), 'Recruteur suspendu : connexion refusée');
  ok(!!(await R.from('job_offers').insert({ company_id: co.id, title: 'Encore', slug: `encore-${ts}`, short_description: 'Une description suffisamment longue.', contract_type: 'cdi', work_time: 'full_time', sector: 'retail', city: 'Paris', postal_code: '75001' })).error, 'API : un compte suspendu ne peut plus publier');
  await a.reload(); await a.locator('tr', { hasText: rec }).getByRole('button', { name: 'Réactiver' }).click();
  ok(await see(a, 'Compte réactivé'), 'Admin : compte réactivé');
  await a.goto(base + `/admin/utilisateurs?q=${encodeURIComponent(admin.email)}`); await a.locator('tr', { hasText: admin.email }).waitFor();
  ok(await a.locator('tr', { hasText: admin.email }).getByText('Administrateur').isVisible(), 'Un administrateur ne peut pas être suspendu depuis la liste');

  // ── Avis authentiques
  await a.goto(base + '/admin/avis');
  await a.fill('#authorName', 'Test E2E'); await a.fill('#authorRole', 'Compte de test automatisé'); await a.fill('#quote', `Avis de test ${ts}, supprimé automatiquement.`);
  await a.fill('#consentAt', new Date().toISOString().slice(0, 10)); await a.getByRole('button', { name: "Enregistrer l'avis" }).click();
  ok(await see(a, 'Confirmez que l\'avis est authentique'), 'Avis : certification d\'authenticité obligatoire');
  await a.check('input[name=confirm]'); await a.getByRole('button', { name: "Enregistrer l'avis" }).click();
  ok(await see(a, 'Avis enregistré (non publié)'), 'Avis enregistré, non publié par défaut');
  await a.reload(); const t = a.locator('li', { hasText: `Avis de test ${ts}` });
  await t.getByRole('button', { name: 'Publier' }).click(); await t.getByText('Publié', { exact: true }).waitFor({ timeout: 10000 }).catch(() => {});
  await anon.goto(base + '/'); ok(await see(anon, `Avis de test ${ts}`), 'Accueil : l\'avis publié apparaît');
  await t.getByRole('button', { name: 'Supprimer' }).click(); await t.getByRole('button', { name: 'Supprimer' }).last().click();
  await a.waitForTimeout(1500); await anon.goto(base + '/'); ok(!(await see(anon, `Avis de test ${ts}`, 2000)), 'Accueil : avis supprimé disparu (section masquée)');

  // ── Journal
  await a.goto(base + '/admin/journal');
  for (const l of ['Offre validée', 'Entreprise vérifiée', 'Offre retirée', 'Signalement traité', 'Compte suspendu', 'Compte réactivé', 'Avis publié']) ok(await see(a, l), `Journal : « ${l} »`);
  const A = await require('./admin-helper.cjs')();
  ok(!!(await A.from('admin_audit_log').delete().gt('id', 0).select('id')).data?.length === false, 'Journal non effaçable, même par un admin');
  await a.goto(base + '/admin'); await a.screenshot({ path: (process.env.SHOTS_DIR ?? require('os').tmpdir()) + '/p6-overview.png', fullPage: true });
  await a.goto(base + '/admin/moderation?statut=closed'); await a.screenshot({ path: (process.env.SHOTS_DIR ?? require('os').tmpdir()) + '/p6-moderation.png' });
  await a.goto(base + '/admin/utilisateurs'); await a.screenshot({ path: (process.env.SHOTS_DIR ?? require('os').tmpdir()) + '/p6-users.png' });

  // ── Nettoyage
  await A.from('job_offers').delete().eq('id', offerId);
  ok((await A.from('job_offers').select('id').eq('id', offerId)).data.length === 0, 'Nettoyage : offre de test supprimée');
  ok(errs.length === 0, 'Aucune erreur JavaScript ' + errs.join(' | '));
  console.log(`\n${failures === 0 ? 'TOUT EST VERT' : failures + ' ÉCHEC(S)'}`);
  await b.close();
})().catch(e => { console.error('ARRÊT :', e.message.split('\n')[0]); process.exit(1); });
