// Tests de bout en bout phase 4 (espace recruteur) sur le vrai projet Supabase.
const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const URL_ = 'https://ntfzctzimthfrcnllalc.supabase.co', KEY = fs.readFileSync(require('path').resolve(__dirname, '../../.env.local'), 'utf8').match(/PUBLISHABLE_KEY=(\S+)/)[1];
const base = 'http://localhost:3100', ts = Date.now(), PW = 'Jobfinder-test-2026', dir = __dirname;
const rec = `e2e.recruteur.${ts}@example.com`, rec2 = `e2e.recruteur2.${ts}@example.com`, cand = `e2e.candidat.${ts}@example.com`;
fs.appendFileSync(require('path').resolve(__dirname, '.accounts.log'), [rec, rec2, cand].join('\n') + '\n');
let failures = 0;
const ok = (c, m) => { console.log((c ? '✅ ' : '❌ ') + m); if (!c) failures++; };
const sb = () => createClient(URL_, KEY, { auth: { persistSession: false } });
const TITLE = `Serveur E2E ${ts}`;
fs.writeFileSync(require('path').resolve(require('os').tmpdir(), 'kairo-logo.png'), Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg==', 'base64'));

(async () => {
  const b = await chromium.launch();
  const r = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const errs = []; r.on('pageerror', e => errs.push(String(e)));
  const see = (page, t, ms = 10000) => page.getByText(t).first().waitFor({ timeout: ms }).then(() => true, () => false);

  // ── Inscription recruteur → création entreprise
  await r.goto(base + '/inscription?role=recruteur');
  await r.fill('#companyName', 'Brasserie Test E2E'); await r.fill('#fullName', 'Rémi Recruteur'); await r.fill('#email', rec); await r.fill('#password', PW); await r.check('input[name=terms]');
  await r.click('button[type=submit]'); await r.waitForURL(/\/recruteur/, { timeout: 15000 });
  await r.goto(base + '/recruteur/offres'); await r.waitForURL(/\/recruteur\/entreprise/);
  ok(true, 'Sans entreprise : toute page recruteur mène à la création de l\'entreprise');
  ok(await r.inputValue('#name') === 'Brasserie Test E2E', 'Nom d\'entreprise pré-rempli depuis l\'inscription');
  await r.fill('#siret', '12345678901234'); await r.click('#informations button[type=submit]');
  ok(await see(r, 'SIRET invalide'), 'SIRET invalide refusé (clé de contrôle)');
  await r.fill('#siret', '732 829 320 00074'); await r.fill('#website', 'www.exemple-brasserie.fr'); await r.fill('#description', 'Brasserie fictive créée par les tests automatisés.');
  await r.click('#informations button[type=submit]'); await r.waitForURL(/\/recruteur\?bienvenue=1/, { timeout: 15000 }).catch(() => {});
  ok(r.url().includes('bienvenue'), 'Entreprise créée → tableau de bord');
  await r.goto(base + '/recruteur/entreprise');
  await r.locator('#logo input[type=file]').setInputFiles(require('path').resolve(require('os').tmpdir(), 'kairo-faux.pdf'));
  ok(await see(r, 'Format non accepté'), 'Logo : fichier non image refusé');
  await r.locator('#logo input[type=file]').setInputFiles(require('path').resolve(require('os').tmpdir(), 'kairo-logo.png'));
  ok(await see(r, 'Logo enregistré'), 'Logo enregistré');
  ok((await r.locator('#logo img').getAttribute('src') || '').includes('/storage/v1/object/public/logos/'), 'Logo servi depuis le stockage public');

  // L'entreprise est vérifiée par l'administration (le parcours « en vérification » est testé en phase 6).
  { const A = await require('./admin-helper.cjs')(); const RR = sb(); await RR.auth.signInWithPassword({ email: rec, password: PW });
    const uid = (await RR.auth.getUser()).data.user.id; const { data: mine } = await RR.from('companies').select('id').eq('owner_id', uid).single(); await A.from('companies').update({ is_verified: true }).eq('id', mine.id);
    await A.from('offer_credits').insert([{ company_id: mine.id, source: 'admin', note: 'tests' }, { company_id: mine.id, source: 'admin', note: 'tests' }]); }

  // ── Création d'offre : erreurs puis brouillon
  await r.goto(base + '/recruteur/offres/nouvelle');
  await r.fill('#title', TITLE); await r.click('button[value=publish]');
  ok(await see(r, 'Certains champs sont à corriger'), 'Offre incomplète : erreurs affichées');
  ok(await r.inputValue('#title') === TITLE, 'Offre : saisie conservée après erreur');
  await r.fill('#shortDescription', 'Service en salle dans une brasserie de quartier, ambiance conviviale.');
  await r.selectOption('#contractType', 'cdd'); await r.fill('#durationMonths', '6'); await r.selectOption('#workTime', 'part_time'); await r.fill('#hoursPerWeek', '20');
  await r.selectOption('#sector', 'hospitality');
  await r.locator('label', { hasText: 'Soirée' }).click(); await r.locator('label', { hasText: 'Week-end' }).click();
  await r.check('input[name=isStudentFriendly]');
  await r.fill('#location', 'Lyon'); await r.fill('#salaryMin', '13'); await r.selectOption('#salaryPeriod', 'hour');
  await r.fill('#missions', 'Accueillir les clients\nServir en salle'); await r.fill('#profile', 'Sens du service');
  await r.click('button[value=draft]');
  ok(await see(r, 'Commune introuvable'), 'Lieu hors Île-de-France refusé');
  ok(await r.locator('input[name=schedules][value=evening]').isChecked(), 'Horaires cochés conservés après erreur');
  await r.fill('#location', '75011'); await r.click('button[value=draft]');
  await r.waitForURL(/\/recruteur\/offres\/[0-9a-f-]{36}\?brouillon=1/, { timeout: 15000 }).catch(() => {});
  ok(r.url().includes('brouillon=1'), 'Brouillon enregistré');
  if (!r.url().includes('brouillon=1')) { console.log('   alertes:', JSON.stringify(await r.locator('main [role=alert]').allInnerTexts())); }
  const offerId = r.url().match(/offres\/([0-9a-f-]{36})/)[1];
  ok(await see(r, 'Paris 11e (75011)'), 'Commune résolue depuis le code postal (Paris 11e)');
  const anon = sb();
  ok((await anon.from('job_offers').select('id').eq('id', offerId)).data.length === 0, 'Brouillon invisible du public');

  // ── Publication
  await r.getByRole('button', { name: 'Publier' }).click();
  ok(await see(r, 'Offre publiée pour 30 jours'), 'Offre publiée');
  await r.reload(); ok(await see(r, 'En ligne jusqu'), 'Date d\'expiration affichée');
  const { data: pub } = await anon.from('public_job_offers').select('slug, company_logo_path, expires_at, lat').eq('id', offerId).single();
  ok(pub && pub.company_logo_path && pub.lat && new Date(pub.expires_at) > new Date(Date.now() + 29 * 864e5), 'En base : publiée, logo, coordonnées, expiration à 30 jours');

  // ── Côté public : recherche + vues
  const v = await (await b.newContext()).newPage();
  await v.goto(base + `/offres?q=${ts}&lieu=Paris%2011&rayon=5`);
  await v.getByRole('link', { name: TITLE }).waitFor({ timeout: 8000 }).catch(() => {});
  ok(await v.getByRole('link', { name: TITLE }).isVisible(), 'Recherche publique : offre trouvée (Paris 11 + 5 km)');
  ok(await v.locator('main ol img[src*="/logos/"]').count() === 1, 'Recherche : logo de l\'entreprise affiché');
  await v.getByRole('link', { name: TITLE }).click(); await v.waitForURL(new RegExp(pub.slug));
  await v.reload(); await v.waitForTimeout(1500);
  await r.goto(base + `/offres/${pub.slug}`); await r.waitForTimeout(1500); // vue du propriétaire : non comptée
  await r.goto(base + `/recruteur/offres/${offerId}`);
  const tile = async (label) => (await r.locator('div', { has: r.getByText(label, { exact: true }) }).last().innerText()).match(/(\d+)/)?.[1];
  ok(await tile('Vues totales') === '2', `Statistiques : 2 vues visiteur, propriétaire non compté (lu : ${await tile('Vues totales')})`);
  ok(await r.locator('svg[role=img]').count() === 0 && await r.getByText('Statistiques avancées').isVisible(), 'Sans formule Pro : graphique remplacé par l\'offre Pro');

  // ── Candidat postule
  const c = await (await b.newContext()).newPage();
  await c.goto(base + '/inscription'); await c.fill('#fullName', 'Lina Candidate'); await c.fill('#email', cand); await c.fill('#password', PW); await c.check('input[name=terms]');
  await c.click('main button[type=submit]'); await c.waitForURL(/\/espace/, { timeout: 15000 });
  await c.goto(base + '/espace/profil');
  await c.fill('#phone', '07 00 00 00 00'); await c.fill('#headline', 'Étudiante en BTS MHR'); await c.locator('#informations button[type=submit]').click(); await see(c, 'Modifications enregistrées');
  await c.locator('#cv input[type=file]').setInputFiles(require('path').resolve(require('os').tmpdir(), 'kairo-cv.pdf')); await see(c, 'CV enregistré', 15000);
  await c.goto(base + `/offres/${pub.slug}`);
  await c.getByRole('button', { name: 'Postuler' }).click(); await c.fill('#coverMessage', 'Disponible les soirs et week-ends.');
  await c.getByRole('button', { name: 'Envoyer ma candidature' }).click();
  ok(await see(c, 'Candidature envoyée'), 'Candidat : candidature envoyée');

  // ── Recruteur traite la candidature
  await r.goto(base + '/recruteur');
  ok(await r.locator('a', { hasText: 'À traiter' }).innerText().then(t => t.includes('1')), 'Tableau de bord : 1 candidature à traiter');
  ok((await r.locator('nav[aria-label="Espace recruteur"]').innerText()).includes('1'), 'Menu : pastille « 1 nouvelle »');
  await r.goto(base + '/recruteur/candidatures');
  await r.getByText('Lina Candidate').click(); await r.waitForURL(/candidatures\/[0-9a-f-]{36}$/);
  ok(await see(r, 'Disponible les soirs et week-ends.') && await see(r, '07 00 00 00 00') && await see(r, 'Étudiante en BTS MHR'), 'Fiche candidat : message, téléphone, titre');
  const appUrl = r.url();
  const cvRes = await r.request.get(appUrl + '/cv', { maxRedirects: 0 });
  const loc = cvRes.headers()['location'] || '';
  const pdf = loc.includes('/object/sign/cvs/') ? await fetch(loc) : null;
  ok(pdf?.ok && (pdf.headers.get('content-type') || '').includes('pdf'), 'CV téléchargé via lien signé');
  await r.getByRole('radio', { name: 'Entretien' }).click();
  ok(await see(r, 'Statut mis à jour'), 'Statut passé à « Entretien »');
  await c.goto(base + '/espace/candidatures'); ok(await see(c, 'Le recruteur souhaite vous rencontrer'), 'Candidat : voit « Entretien »');

  // ── Isolation : un autre recruteur ne voit rien
  const R2 = sb(); const { data: s2 } = await R2.auth.signUp({ email: rec2, password: PW, options: { data: { full_name: 'Autre RH', role: 'recruiter' } } });
  ok(!!s2.session, 'Recruteur B créé');
  const [o2, a2] = await Promise.all([R2.from('job_offers').select('id').eq('id', offerId).eq('status', 'draft'), R2.from('applications').select('id')]);
  ok(o2.data.length === 0 && a2.data.length === 0, 'Recruteur B : aucune candidature ni offre d\'autrui');
  const r2 = await (await b.newContext()).newPage();
  await r2.goto(base + '/connexion'); await r2.fill('#email', rec2); await r2.fill('#password', PW); await r2.click('main button[type=submit]'); await r2.waitForURL(/recruteur/);
  const forbidden = await r2.goto(base + appUrl.replace(base, ''));
  ok(r2.url().includes('/recruteur/entreprise') || forbidden.status() === 404, 'Recruteur B : fiche candidat d\'autrui inaccessible');
  const cvB = await r2.request.get(appUrl + '/cv', { maxRedirects: 0 });
  ok(cvB.status() === 404, 'Recruteur B : CV d\'autrui inaccessible (404)');
  const { error: hackErr } = await R2.from('job_offers').update({ title: 'Piraté' }).eq('id', offerId).select('id');
  const { data: still } = await anon.from('job_offers').select('title').eq('id', offerId).single();
  ok(still.title === TITLE, 'Recruteur B : ne peut pas modifier l\'offre');

  // ── Modification, fermeture, republication, suppression
  await r.goto(base + `/recruteur/offres/${offerId}/modifier`);
  ok(await r.inputValue('#location') === 'Paris 11e', 'Modifier : formulaire pré-rempli');
  await r.fill('#salaryMax', '14'); await r.click('button[value=publish]');
  await r.waitForURL(/enregistree=1/, { timeout: 15000 }).catch(() => {});
  ok(r.url().includes('enregistree=1'), 'Modification enregistrée');
  await v.goto(base + `/offres/${pub.slug}`); ok(await see(v, '13 – 14 € brut/h'), 'Public : salaire mis à jour');
  await r.goto(base + `/recruteur/offres/${offerId}`);
  await r.getByRole('button', { name: "Fermer l'offre" }).click(); ok(await see(r, 'Offre fermée'), 'Offre fermée');
  const closed = await v.goto(base + `/offres/${pub.slug}`); ok(closed.status() === 404, 'Public : offre fermée → 404');
  await c.goto(base + '/espace/candidatures'); ok(await see(c, 'offre fermée'), 'Candidat : candidature toujours visible, « offre fermée »');
  await r.reload(); await r.getByRole('button', { name: 'Publier' }).click(); ok(await see(r, 'Offre publiée'), 'Offre republiée');
  await r.goto(base + '/recruteur/offres'); ok(await see(r, TITLE), 'Liste des offres : offre listée');
  await r.screenshot({ path: (process.env.SHOTS_DIR ?? require('os').tmpdir()) + '/p4-offres.png' });
  await r.goto(base + `/recruteur/offres/${offerId}`); await r.screenshot({ path: (process.env.SHOTS_DIR ?? require('os').tmpdir()) + '/p4-offre.png', fullPage: true });
  await r.goto(appUrl); await r.screenshot({ path: (process.env.SHOTS_DIR ?? require('os').tmpdir()) + '/p4-candidat.png', fullPage: true });
  await r.goto(base + '/recruteur'); await r.screenshot({ path: (process.env.SHOTS_DIR ?? require('os').tmpdir()) + '/p4-dashboard.png' });
  await r.goto(base + `/recruteur/offres/${offerId}`);
  await r.getByRole('button', { name: 'Supprimer' }).click(); await r.getByRole('button', { name: 'Oui, supprimer' }).click();
  await r.waitForURL(/supprimee=1/, { timeout: 15000 }).catch(() => {});
  ok(r.url().includes('supprimee=1'), 'Offre supprimée');
  const { data: gone } = await createClient(URL_, KEY, { auth: { persistSession: false } }).from('public_job_offers').select('id').eq('id', offerId);
  ok(gone.length === 0, 'Base : offre supprimée');

  // ── Nettoyage fichiers : logo (recruteur) et CV (candidat)
  const R = sb(); await R.auth.signInWithPassword({ email: rec, password: PW }); const ru = (await R.auth.getUser()).data.user;
  const C = sb(); await C.auth.signInWithPassword({ email: cand, password: PW }); const cu = (await C.auth.getUser()).data.user;
  let removed = 0;
  for (const [cl, bucket, uid] of [[R, 'logos', ru.id], [C, 'cvs', cu.id]]) {
    const { data: l } = await cl.storage.from(bucket).list(uid); if (l?.length) removed += (await cl.storage.from(bucket).remove(l.map(f => `${uid}/${f.name}`))).data?.length || 0;
  }
  ok(removed === 2, `Nettoyage : ${removed} fichier(s) supprimé(s)`);
  ok(errs.length === 0, 'Aucune erreur JavaScript ' + errs.join(' | '));
  console.log(`\n${failures === 0 ? 'TOUT EST VERT' : failures + ' ÉCHEC(S)'}`);
  await b.close();
})().catch(e => { console.error('ARRÊT :', e.message.split('\n')[0]); process.exit(1); });
