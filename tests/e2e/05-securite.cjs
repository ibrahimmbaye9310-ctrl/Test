// Tests de bout en bout phase 5 : notifications, signalements, limitation, CSP, tables protégées.
const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const URL_ = 'https://ntfzctzimthfrcnllalc.supabase.co', KEY = fs.readFileSync(require('path').resolve(__dirname, '../../.env.local'), 'utf8').match(/PUBLISHABLE_KEY=(\S+)/)[1];
const base = 'http://localhost:3100', ts = Date.now(), PW = 'Jobfinder-test-2026', dir = __dirname;
const rec = `e2e.recruteur.${ts}@example.com`, cand = `e2e.candidat.${ts}@example.com`, cand2 = `e2e.candidat2.${ts}@example.com`;
fs.appendFileSync(require('path').resolve(__dirname, '.accounts.log'), [rec, cand, cand2].join('\n') + '\n');
let failures = 0;
const ok = (c, m) => { console.log((c ? '✅ ' : '❌ ') + m); if (!c) failures++; };
const sb = () => createClient(URL_, KEY, { auth: { persistSession: false } });
const TITLE = `Caissier E2E ${ts}`;

(async () => {
  // Comptes et offre créés via l'API (le parcours UI est couvert par les phases 3 et 4)
  const R = sb(); const { data: rs, error: re } = await R.auth.signUp({ email: rec, password: PW, options: { data: { full_name: 'Rita RH', role: 'recruiter' } } });
  if (re || !rs.session) { console.log('ARRÊT : inscription impossible (confirmation e-mail activée ?)', re?.message); process.exit(1); }
  const ru = rs.user.id;
  const { data: co } = await R.from('companies').insert({ owner_id: ru, name: 'Commerce Test E2E', slug: `e2e-co-${ts}` }).select().single();
  await (await require('./admin-helper.cjs')()).from('companies').update({ is_verified: true }).eq('id', co.id);
  await (await require('./admin-helper.cjs')()).from('offer_credits').insert([{ company_id: co.id, source: 'admin', note: 'tests' }, { company_id: co.id, source: 'admin', note: 'tests' }]);
  const { data: offer } = await R.from('job_offers').insert({ company_id: co.id, title: TITLE, slug: `e2e-caissier-${ts}`, short_description: 'Offre de test automatisé, supprimée après les tests.', missions: ['Encaisser'], contract_type: 'cdi', work_time: 'part_time', schedules: ['weekend'], sector: 'retail', city: 'Créteil', postal_code: '94000', commune_code: '94028', status: 'published' }).select().single();
  ok(!!offer, 'Offre de test publiée');

  const b = await chromium.launch();
  const csp = [];
  const page = async () => { const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); p.on('console', m => /Content Security Policy|Refused to/.test(m.text()) && csp.push(m.text())); return p; };
  const see = (p, t, ms = 10000) => p.getByText(t).first().waitFor({ timeout: ms }).then(() => true, () => false);
  const login = async (p, email) => { await p.goto(base + '/connexion'); await p.fill('#email', email); await p.fill('#password', PW); await p.click('main button[type=submit]'); await p.waitForURL(u => !u.toString().includes('/connexion'), { timeout: 15000 }); };

  // ── CSP
  const c = await page();
  const resp = await c.goto(base + '/');
  const policy = resp.headers()['content-security-policy'] || '';
  ok(policy.includes("default-src 'self'") && policy.includes('ntfzctzimthfrcnllalc.supabase.co') && policy.includes("frame-ancestors 'none'"), 'En-tête CSP présent (site + Supabase uniquement)');

  // ── Candidat : inscription UI, postule
  await c.goto(base + '/inscription'); await c.fill('#fullName', 'Noa Candidat'); await c.fill('#email', cand); await c.fill('#password', PW); await c.check('input[name=terms]');
  await c.click('main button[type=submit]'); await c.waitForURL(/\/espace/, { timeout: 15000 });
  await c.goto(base + `/offres/${offer.slug}`);
  await c.getByRole('button', { name: 'Postuler' }).click(); await c.getByRole('button', { name: 'Envoyer ma candidature' }).click();
  ok(await see(c, 'Candidature envoyée'), 'Candidature envoyée');

  // ── Signalement
  await c.getByRole('button', { name: 'Signaler cette annonce' }).click();
  await c.getByRole('button', { name: 'Envoyer le signalement' }).click();
  ok(await see(c, 'Choisissez un motif'), 'Signalement : motif obligatoire');
  await c.selectOption('#report-reason', 'misleading'); await c.fill('#report-details', 'Salaire différent en entretien (test).');
  await c.getByRole('button', { name: 'Envoyer le signalement' }).click();
  ok(await see(c, 'Notre équipe de modération va examiner'), 'Signalement enregistré');
  await c.reload(); await c.getByRole('button', { name: 'Signaler cette annonce' }).click(); await c.selectOption('#report-reason', 'other'); await c.getByRole('button', { name: 'Envoyer le signalement' }).click();
  ok(await see(c, 'déjà signalé'), 'Double signalement : message adapté, pas de doublon');
  const anon = await page(); await anon.goto(base + `/offres/${offer.slug}`);
  ok((await anon.getByRole('link', { name: 'Signaler cette annonce' }).getAttribute('href') || '').includes('/connexion'), 'Visiteur : signaler → connexion requise');
  const { data: repSeen } = await R.from('reports').select('id');
  ok(repSeen.length === 0, 'Recruteur : ne voit pas les signalements de son offre');

  // ── Notifications
  const r = await page(); await login(r, rec);
  await r.goto(base + '/recruteur');
  ok((await r.locator('nav[aria-label="Espace recruteur"] a', { hasText: 'Notifications' }).innerText()).includes('1'), 'Recruteur : pastille « 1 notification »');
  await r.goto(base + '/recruteur/notifications');
  ok(await see(r, 'Nouvelle candidature') && await see(r, `Noa Candidat a postulé à « ${TITLE} »`), 'Recruteur : notification « Nouvelle candidature »');
  await r.getByText('Nouvelle candidature').click(); await r.waitForURL(/\/recruteur\/candidatures\/[0-9a-f-]{36}/);
  ok(true, 'Clic sur la notification → fiche de la candidature');
  await r.getByRole('radio', { name: 'Acceptée' }).click(); await see(r, 'Statut mis à jour');
  await r.goto(base + '/recruteur/notifications');
  ok(await see(r, 'Tout est lu'), 'Notification marquée lue après clic');

  await c.goto(base + '/espace/notifications');
  ok(await see(c, 'Candidature : Acceptée'), 'Candidat : notification « Candidature : Acceptée »');
  ok((await c.locator('nav[aria-label="Espace candidat"] a', { hasText: 'Notifications' }).innerText()).includes('1'), 'Candidat : pastille non lue');
  await c.getByRole('button', { name: 'Tout marquer comme lu' }).click();
  ok(await see(c, 'Tout est lu'), 'Tout marquer comme lu');

  // ── Tables protégées (API directe)
  const C = sb(); await C.auth.signInWithPassword({ email: cand, password: PW });
  const fake = await C.from('notifications').insert({ user_id: (await C.auth.getUser()).data.user.id, type: 'system', title: 'Spam' });
  ok(!!fake.error, 'API : impossible de créer une fausse notification');
  const sub = await R.from('subscriptions').insert({ company_id: co.id, stripe_customer_id: 'cus_fake', plan: 'pro', status: 'active' });
  ok(!!sub.error, 'API : un recruteur ne peut pas s\'offrir un abonnement');
  const pay = await R.from('payments').insert({ company_id: co.id, kind: 'subscription', stripe_reference: 'in_fake', amount_cents: 5900, status: 'succeeded' });
  ok(!!pay.error, 'API : impossible d\'enregistrer un faux paiement');
  const purge = await sb().rpc('run_data_retention');
  ok(!!purge.error, 'API : la purge des données n\'est pas déclenchable par un visiteur');
  const raw = await sb().from('rate_limits').select('*');
  ok((raw.data ?? []).length === 0, 'API : compteurs de limitation illisibles');

  // ── Limitation des tentatives de connexion (adresse inexistante dédiée)
  const victim = `e2e.bruteforce.${ts}@example.com`;
  const bf = await page(); let blocked = -1;
  for (let i = 1; i <= 12; i++) {
    await bf.goto(base + '/connexion'); await bf.fill('#email', victim); await bf.fill('#password', 'mauvais-mdp-' + i); await bf.click('main button[type=submit]');
    await bf.locator('main [role=alert]').first().waitFor({ timeout: 10000 });
    if ((await bf.locator('main [role=alert]').first().innerText()).includes('Trop de tentatives')) { blocked = i; break; }
  }
  ok(blocked === 11, `Force brute : bloquée à la 11e tentative sur une même adresse (bloquée à ${blocked})`);
  await bf.fill('#email', `autre.${ts}@example.com`); await bf.fill('#password', 'x'); await bf.click('main button[type=submit]');
  await bf.waitForTimeout(1500);
  ok((await bf.locator('main [role=alert]').first().innerText()).includes('incorrect'), 'Une autre adresse reste utilisable');

  // ── Nettoyage
  await R.from('job_offers').delete().eq('id', offer.id);
  ok((await sb().from('public_job_offers').select('id').eq('id', offer.id)).data.length === 0, 'Nettoyage : offre de test supprimée');
  ok(csp.length === 0, `Aucune violation CSP dans le navigateur ${csp.slice(0, 2).join(' | ')}`);
  console.log(`\n${failures === 0 ? 'TOUT EST VERT' : failures + ' ÉCHEC(S)'}`);
  await b.close();
})().catch(e => { console.error('ARRÊT :', e.message.split('\n')[0]); process.exit(1); });
