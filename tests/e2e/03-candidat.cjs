// Tests de bout en bout phase 3 sur le vrai projet Supabase. Comptes @example.com supprimables ensuite.
const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const URL_ = 'https://ntfzctzimthfrcnllalc.supabase.co', KEY = 'sb_publishable_YAhJB5hOTP4VUfgq5CNHLw_vP1l26Qc';
const base = 'http://localhost:3100';
const ts = Date.now(), PW = 'Jobfinder-test-2026';
const cand = `e2e.candidat.${ts}@example.com`, cand2 = `e2e.candidat2.${ts}@example.com`, rec = `e2e.recruteur.${ts}@example.com`;
let failures = 0;
const ok = (c, m) => { console.log((c ? '✅ ' : '❌ ') + m); if (!c) failures++; };
const sb = () => createClient(URL_, KEY, { auth: { persistSession: false } });
const dir = __dirname;
fs.writeFileSync(require('path').resolve(require('os').tmpdir(), 'kairo-cv.pdf'), '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n');
fs.writeFileSync(require('path').resolve(require('os').tmpdir(), 'kairo-faux.pdf'), Buffer.from([0x4d, 0x5a, 0x90, 0, 3, 0, 0, 0, 4, 0, 0, 0, 0xff, 0xff, 0, 0]));
fs.writeFileSync(require('path').resolve(require('os').tmpdir(), 'kairo-photo.png'), Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'));
fs.writeFileSync(require('path').resolve(require('os').tmpdir(), 'kairo-accounts.json'), JSON.stringify({ cand, cand2, rec }));
fs.appendFileSync(require('path').resolve(__dirname, '.accounts.log'), [cand, cand2, rec].join('\n') + '\n');
const TITLE = `Vendeur E2E ${ts}`;

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const jsErrors = []; p.on('pageerror', e => jsErrors.push(String(e)));
  const waitText = (t, ms = 8000) => p.getByText(t).first().waitFor({ timeout: ms }).then(() => true, () => false);

  // ── A. Inscription candidat
  await p.goto(base + '/inscription');
  await p.fill('#fullName', 'Camille Test'); await p.fill('#email', cand); await p.fill('#password', PW); await p.check('input[name=terms]');
  await p.click('button[type=submit]'); await p.waitForURL(/\/espace/, { timeout: 15000 }).catch(() => {});
  ok(p.url().endsWith('/espace'), `Inscription candidat → ${p.url().replace(base, '')}`);
  ok(await waitText('Bonjour Camille'), 'Tableau de bord : « Bonjour Camille »');
  ok(await p.getByRole('link', { name: /Mon espace/ }).isVisible(), 'En-tête : « Mon espace » affiché une fois connecté');

  // ── B. Déconnexion / protection / connexion
  await p.getByRole('button', { name: 'Se déconnecter' }).first().click(); await p.waitForURL(base + '/');
  await p.goto(base + '/espace/profil'); ok(p.url().includes('/connexion?suite=%2Fespace%2Fprofil'), 'Après déconnexion, /espace/profil → connexion');
  await p.fill('#email', cand); await p.fill('#password', 'mauvais-mdp-123'); await p.click('button[type=submit]');
  ok(await waitText('Adresse e-mail ou mot de passe incorrect'), 'Mauvais mot de passe : message générique');
  await p.fill('#password', PW); await p.click('button[type=submit]'); await p.waitForURL(/\/espace\/profil/, { timeout: 10000 }).catch(() => {});
  ok(p.url().endsWith('/espace/profil'), 'Connexion → retour à la page demandée (/espace/profil)');
  await p.goto(base + '/recruteur'); ok(p.url().endsWith('/espace'), 'Candidat sur /recruteur → renvoyé vers /espace');
  await p.goto(base + '/admin'); ok(p.url().endsWith('/espace'), 'Candidat sur /admin → renvoyé vers /espace');

  // ── C. Profil
  await p.goto(base + '/espace/profil');
  await p.fill('#postalCode', '940'); await p.locator('#informations button[type=submit]').click();
  ok(await waitText('Code postal à 5 chiffres'), 'Profil : code postal invalide refusé');
  ok(await p.inputValue('#postalCode') === '940', 'Profil : saisie conservée après erreur');
  await p.fill('#phone', '06 12 34 56 78'); await p.fill('#city', 'Créteil'); await p.fill('#postalCode', '94000'); await p.fill('#headline', 'Étudiante, disponible le week-end');
  await p.locator('#informations button[type=submit]').click(); ok(await waitText('Modifications enregistrées'), 'Profil : informations enregistrées');
  for (const s of ['Vente', 'Anglais', 'Excel']) { await p.fill('#skill-input', s); await p.keyboard.press('Enter'); }
  await p.locator('#competences button[type=submit]').click();
  await p.locator('#competences').getByText('Modifications enregistrées').waitFor({ timeout: 8000 }).catch(() => {});
  ok(await p.locator('#competences').getByText('Modifications enregistrées').isVisible(), 'Compétences enregistrées');
  await p.locator('#disponibilites').getByText('Week-end', { exact: true }).click(); await p.locator('#disponibilites').getByText('Soirée', { exact: true }).click();
  await p.locator('#disponibilites button[type=submit]').click();
  await p.locator('#disponibilites').getByText('Modifications enregistrées').waitFor({ timeout: 8000 }).catch(() => {});
  ok(await p.locator('#disponibilites').getByText('Modifications enregistrées').isVisible(), 'Disponibilités enregistrées');
  await p.locator('#preferences').getByText('CDI', { exact: true }).click(); await p.selectOption('#desiredWorkTime', 'part_time'); await p.selectOption('#searchRadiusKm', '10');
  await p.locator('#preferences button[type=submit]').click();
  await p.locator('#preferences').getByText('Modifications enregistrées').waitFor({ timeout: 8000 }).catch(() => {});
  ok(await p.locator('#preferences').getByText('Modifications enregistrées').isVisible(), 'Préférences enregistrées');

  // fichiers
  await p.locator('#cv input[type=file]').setInputFiles(require('path').resolve(require('os').tmpdir(), 'kairo-faux.pdf'));
  ok(await p.locator('#cv').getByText('Format non accepté').waitFor({ timeout: 10000 }).then(() => true, () => false), 'CV : faux PDF (exécutable renommé) refusé');
  await p.locator('#cv input[type=file]').setInputFiles(require('path').resolve(require('os').tmpdir(), 'kairo-cv.pdf'));
  ok(await p.locator('#cv').getByText('CV enregistré').waitFor({ timeout: 15000 }).then(() => true, () => false), 'CV : vrai PDF enregistré');
  await p.locator('#photo input[type=file]').setInputFiles(require('path').resolve(require('os').tmpdir(), 'kairo-photo.png'));
  ok(await p.locator('#photo').getByText('Photo enregistrée').waitFor({ timeout: 15000 }).then(() => true, () => false), 'Photo enregistrée');
  await p.reload();
  ok(await p.locator('#cv').getByText('cv.pdf').isVisible(), 'CV affiché après rechargement');
  const cvResp = await p.request.get(base + '/espace/cv', { maxRedirects: 0 });
  const loc = cvResp.headers()['location'] || '';
  const file = loc.includes('/storage/v1/object/sign/cvs/') ? await fetch(loc) : null;
  ok(file?.ok && (file.headers.get('content-type') || '').includes('pdf'), `/espace/cv → lien signé temporaire vers le PDF (${file?.headers.get('content-type')})`);
  const anonCv = await (await b.newContext()).request.get(base + '/espace/cv', { maxRedirects: 0 });
  ok(anonCv.status() >= 300 && anonCv.status() < 400 && (anonCv.headers()['location'] || '').includes('/connexion'), 'Visiteur non connecté sur /espace/cv → connexion');

  // ── D. Recruteur : inscription UI, puis création d'une offre réelle (script)
  const rp = await (await b.newContext()).newPage();
  await rp.goto(base + '/inscription?role=recruteur');
  await rp.fill('#companyName', 'Entreprise Test E2E'); await rp.fill('#fullName', 'Rémi Recruteur'); await rp.fill('#email', rec); await rp.fill('#password', PW); await rp.check('input[name=terms]');
  await rp.click('button[type=submit]'); await rp.waitForURL(/\/recruteur/, { timeout: 15000 }).catch(() => {});
  ok(/\/recruteur(\/entreprise)?$/.test(rp.url()), 'Inscription recruteur → espace recruteur');
  await rp.goto(base + '/espace'); ok(/\/recruteur(\/entreprise)?$/.test(rp.url()), 'Recruteur sur /espace → renvoyé vers son espace (création d\'entreprise)');

  const R = sb(); await R.auth.signInWithPassword({ email: rec, password: PW });
  const { data: { user: ru } } = await R.auth.getUser();
  const { data: prof } = await R.from('profiles').select('role').eq('id', ru.id).single();
  ok(prof.role === 'recruiter', 'Base : rôle « recruiter » attribué par le trigger');
  const { error: roleErr } = await R.from('profiles').update({ role: 'admin' }).eq('id', ru.id);
  ok(!!roleErr, 'Base : un recruteur ne peut pas se promouvoir admin');
  const { data: company, error: ce } = await R.from('companies').insert({ owner_id: ru.id, name: 'Entreprise Test E2E', slug: `e2e-${ts}` }).select().single();
  ok(!ce, 'Recruteur : entreprise créée ' + (ce?.message || ''));
  await (await require('./admin-helper.cjs')()).from('companies').update({ is_verified: true }).eq('id', company.id);
  await (await require('./admin-helper.cjs')()).from('offer_credits').insert([{ company_id: company.id, source: 'admin', note: 'tests' }, { company_id: company.id, source: 'admin', note: 'tests' }]);
  const slug = `e2e-vendeur-creteil-${ts}`;
  const { data: offer, error: oe } = await R.from('job_offers').insert({
    company_id: company.id, title: TITLE, slug, short_description: 'Offre de test automatisé, supprimée après les tests.',
    missions: ['Conseiller les clients'], profile: ['Sens du contact'], contract_type: 'cdi', work_time: 'part_time', schedules: ['weekend'],
    sector: 'retail', is_student_friendly: true, salary_min: 12.5, salary_period: 'hour', city: 'Créteil', postal_code: '94000', commune_code: '94028',
    status: 'published', published_at: new Date().toISOString(),
  }).select().single();
  ok(!oe, 'Recruteur : offre publiée en base ' + (oe?.message || ''));

  // ── E. Recherche + candidature
  await p.goto(base + `/offres?q=${ts}&lieu=Cr%C3%A9teil&rayon=10`);
  await p.getByRole('link', { name: TITLE }).waitFor({ timeout: 8000 }).catch(() => {});
  ok(await p.getByRole('link', { name: TITLE }).isVisible(), 'Recherche : la vraie offre apparaît (Créteil + 10 km)');
  await p.getByRole('link', { name: TITLE }).click(); await p.waitForURL(new RegExp(slug));
  ok(await p.locator('script[type="application/ld+json"]').count() === 1, 'Offre réelle : données structurées JobPosting présentes');
  ok(await p.locator('article header').getByText('Exemple fictif').count() === 0 && await p.getByText('Offre fictive de démonstration').count() === 0, 'Offre réelle : pas de badge ni d\'avertissement « fictif »');
  await p.getByRole('button', { name: "Enregistrer l'offre" }).click();
  ok(await waitText('Offre enregistrée'), 'Favori ajouté');
  await p.getByRole('button', { name: 'Postuler' }).click();
  ok(await p.getByText('CV joint : kairo-cv.pdf').isVisible(), 'Candidature : CV du profil joint');
  await p.fill('#coverMessage', 'Bonjour, je suis disponible le week-end.');
  await p.getByRole('button', { name: 'Envoyer ma candidature' }).click();
  ok(await waitText('Candidature envoyée'), 'Candidature envoyée');
  await p.reload(); ok(await waitText('Suivre ma candidature'), 'Offre rechargée : candidature visible avec son statut');

  await p.goto(base + '/espace');
  const stat = async (label) => Number((await p.locator('a', { hasText: label }).first().innerText()).match(/(\d+)\s*$/)?.[1]);
  ok(await stat('Candidatures en cours') === 1 && await stat('Offres enregistrées') === 1, 'Tableau de bord : 1 candidature, 1 favori');
  await p.goto(base + '/espace/favoris'); ok(await p.getByRole('link', { name: TITLE }).isVisible(), 'Favoris : offre listée');
  await p.goto(base + '/espace/candidatures');
  ok(await p.getByText('Envoyée', { exact: true }).first().isVisible() && await p.getByRole('button', { name: 'Retirer' }).isVisible(), 'Candidatures : statut « Envoyée », retrait possible');

  // ── F. Le recruteur traite la candidature
  const { data: apps } = await R.from('applications').select('id, cover_message, candidate_id');
  ok(apps?.length === 1 && apps[0].cover_message.includes('week-end'), 'Recruteur : voit la candidature reçue');
  const { data: cp } = await R.from('profiles').select('full_name, phone, cv_path').eq('id', apps[0].candidate_id).single();
  ok(cp?.full_name === 'Camille Test' && cp.phone, 'Recruteur : voit le profil du candidat');
  const { data: signed } = await R.storage.from('cvs').createSignedUrl(cp.cv_path, 60);
  ok(!!signed?.signedUrl, 'Recruteur : peut télécharger le CV du candidat');
  const { error: msgErr } = await R.from('applications').update({ cover_message: 'modifié' }).eq('id', apps[0].id);
  ok(!!msgErr, 'Recruteur : ne peut pas modifier le message du candidat');
  const { error: stErr } = await R.from('applications').update({ status: 'interview' }).eq('id', apps[0].id);
  ok(!stErr, 'Recruteur : statut passé à « Entretien »');
  await p.reload();
  ok(await p.getByText('Entretien', { exact: true }).first().isVisible() && await p.getByRole('button', { name: 'Retirer' }).count() === 0, 'Candidat : voit « Entretien », retrait impossible');

  // ── G. Isolation : un 2e candidat ne voit rien
  const C2 = sb(); const { data: s2, error: e2 } = await C2.auth.signUp({ email: cand2, password: PW, options: { data: { full_name: 'Autre Candidat', role: 'candidate' } } });
  ok(!e2 && s2.session, 'Candidat B créé');
  const [pr, ap, fv, files] = await Promise.all([
    C2.from('profiles').select('id'), C2.from('applications').select('id'), C2.from('saved_jobs').select('*'), C2.storage.from('cvs').createSignedUrl(cp.cv_path, 60),
  ]);
  ok(pr.data.length === 1 && ap.data.length === 0 && fv.data.length === 0, 'Candidat B : ne voit ni le profil, ni les candidatures, ni les favoris de A');
  ok(!files.data?.signedUrl, 'Candidat B : ne peut pas accéder au CV de A');
  const { error: e2b } = await C2.from('applications').insert({ job_offer_id: offer.id, candidate_id: apps[0].candidate_id });
  ok(!!e2b, 'Candidat B : ne peut pas postuler au nom de A');
  const A = createClient(URL_, KEY, { auth: { persistSession: false } });
  const anon = await A.from('profiles').select('id');
  ok(anon.data.length === 0, 'Visiteur anonyme : aucun profil visible');

  // ── H. Export RGPD + suppression sans clé secrète
  const exp = await p.request.get(base + '/espace/compte/export');
  const json = await exp.json().catch(() => ({}));
  ok(exp.ok() && json.profile?.full_name === 'Camille Test' && json.applications?.length === 1 && json.files?.cv, 'Export RGPD : profil, candidature et lien du CV');
  ok((exp.headers()['content-disposition'] || '').includes('attachment'), 'Export : téléchargé en fichier');
  await p.goto(base + '/espace/compte');
  await p.fill('#delete-confirm', 'supprimer');
  ok(await p.getByRole('button', { name: /Supprimer définitivement/ }).isDisabled(), 'Suppression : bouton inactif tant que « SUPPRIMER » n\'est pas tapé exactement');
  await p.fill('#delete-confirm', 'SUPPRIMER'); await p.getByRole('button', { name: /Supprimer définitivement/ }).click();
  ok(await waitText('momentanément indisponible'), 'Suppression sans clé secrète : message clair (aucune donnée perdue)');
  await p.goto(base + '/mot-de-passe-oublie'); await p.fill('#email', cand); await p.click('button[type=submit]');
  ok(await waitText('Si un compte existe'), 'Mot de passe oublié : message neutre');

  await p.screenshot({ path: (process.env.SHOTS_DIR ?? require('os').tmpdir()) + '/p3-compte.png' });
  await p.goto(base + '/espace/candidatures'); await p.screenshot({ path: (process.env.SHOTS_DIR ?? require('os').tmpdir()) + '/p3-candidatures.png' });
  await p.goto(base + '/espace'); await p.screenshot({ path: (process.env.SHOTS_DIR ?? require('os').tmpdir()) + '/p3-dashboard.png' });
  await p.goto(base + '/espace/profil'); await p.screenshot({ path: (process.env.SHOTS_DIR ?? require('os').tmpdir()) + '/p3-profil.png', fullPage: true });

  // Nettoyage : offre (et donc candidature + favori, en cascade), puis fichiers du candidat.
  const { error: delErr } = await R.from('job_offers').delete().eq('id', offer.id);
  const C = sb(); await C.auth.signInWithPassword({ email: cand, password: PW });
  const { data: { user: cu } } = await C.auth.getUser();
  const removed = [];
  for (const bucket of ['cvs', 'avatars']) {
    const { data: list } = await C.storage.from(bucket).list(cu.id);
    if (list?.length) { const r = await C.storage.from(bucket).remove(list.map(f => `${cu.id}/${f.name}`)); removed.push(...(r.data || [])); }
  }
  const { data: left } = await A.from('public_job_offers').select('id').eq('id', offer.id);
  ok(!delErr && left.length === 0 && removed.length === 2, `Nettoyage : offre de test supprimée, ${removed.length} fichier(s) supprimé(s)`);

  fs.writeFileSync(require('path').resolve(require('os').tmpdir(), 'kairo-state.json'), JSON.stringify({ offerId: offer.id, slug, candidateId: apps[0].candidate_id }));
  ok(jsErrors.length === 0, 'Aucune erreur JavaScript ' + jsErrors.join(' | '));
  console.log(`\n${failures === 0 ? 'TOUT EST VERT' : failures + ' ÉCHEC(S)'}`);
  await b.close();
})().catch(e => { console.error('ARRÊT :', e.message); process.exit(1); });
