// Audit d'accessibilité WCAG 2.1 A/AA (axe-core) : 35 pages et états publics, candidat, recruteur, administrateur.
// Prérequis : npm i -D @axe-core/playwright ; serveur sur http://localhost:3100 ; confirmation e-mail désactivée (comptes de test).
// Pages publiques seules : PUBLIC_ONLY=1. Administrateur : ADMIN_JSON=chemin vers {"email","password"}.
const { chromium } = require('playwright');
const { default: AxeBuilder } = require('@axe-core/playwright');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const KEY = fs.readFileSync(require('path').resolve(__dirname, '../../.env.local'), 'utf8').match(/PUBLISHABLE_KEY=(\S+)/)[1];
const base = 'http://localhost:3100', PW = 'Jobfinder-test-2026', ts = Date.now();
(async () => {
  const b = await chromium.launch();
  const total = { pages: 0, violations: 0 };
  const audit = async (p, label) => {
    const r = await new AxeBuilder({ page: p }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    total.pages++; total.violations += r.violations.length;
    console.log(`${r.violations.length ? '❌' : '✅'} ${label}${r.violations.map((v) => `\n     ${v.id} (${v.impact}) : ${v.nodes[0]?.target.join(' ')}`).join('')}`);
  };
  const login = async (p, email, pw) => { await p.goto(base + '/connexion'); await p.fill('#email', email); await p.fill('#password', pw); await p.click('main button[type=submit]'); await p.waitForURL((u) => !u.toString().includes('/connexion'), { timeout: 15000 }); };

  const pub = await (await b.newContext({ reducedMotion: 'reduce' })).newPage();
  for (const u of ['/', '/offres', '/offres?lieu=Cr%C3%A9teil&rayon=10&contrat=cdi', '/tarifs', '/entreprises', '/contact', '/confidentialite', '/connexion', '/inscription?role=recruteur', '/mot-de-passe-oublie', '/page-inexistante']) { await pub.goto(base + u); await audit(pub, 'public ' + u); }
  const mob = await (await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })).newPage();
  await mob.goto(base + '/offres'); await mob.getByRole('button', { name: /^Filtres/ }).click(); await mob.waitForTimeout(400); await audit(mob, 'mobile : panneau de filtres ouvert');

  if (process.env.PUBLIC_ONLY) { console.log(`\n${total.pages} pages auditées (WCAG 2.1 A/AA) — ${total.violations} type(s) de violation`); return b.close(); }
  // Candidat (créé via l'API)
  const email = `e2e.a11y.${ts}@example.com`;
  await createClient('https://ntfzctzimthfrcnllalc.supabase.co', KEY, { auth: { persistSession: false } }).auth.signUp({ email, password: PW, options: { data: { full_name: 'Axe Candidat', role: 'candidate' } } });
  const c = await (await b.newContext({ reducedMotion: 'reduce' })).newPage(); await login(c, email, PW);
  for (const u of ['/espace', '/espace/profil', '/espace/candidatures', '/espace/favoris', '/espace/notifications', '/espace/compte']) { await c.goto(base + u); await audit(c, 'candidat ' + u); }
  // Recruteur
  const remail = `e2e.a11y.rec.${ts}@example.com`;
  await createClient('https://ntfzctzimthfrcnllalc.supabase.co', KEY, { auth: { persistSession: false } }).auth.signUp({ email: remail, password: PW, options: { data: { full_name: 'Axe Recruteur', role: 'recruiter', company_name: 'Axe SARL' } } });
  const r = await (await b.newContext({ reducedMotion: 'reduce' })).newPage(); await login(r, remail, PW);
  await r.goto(base + '/recruteur/entreprise'); await audit(r, 'recruteur /recruteur/entreprise (création)');
  await r.click('#informations button[type=submit]'); await r.waitForURL(/bienvenue/);
  for (const u of ['/recruteur', '/recruteur/offres', '/recruteur/offres/nouvelle', '/recruteur/candidatures', '/recruteur/abonnement', '/recruteur/entreprise', '/recruteur/compte']) { await r.goto(base + u); await audit(r, 'recruteur ' + u); }
  await r.goto(base + '/recruteur/offres/nouvelle'); await r.click('button[value=publish]'); await r.getByText('Certains champs').first().waitFor(); await audit(r, 'recruteur : formulaire d\'offre avec erreurs');
  // Administrateur
  const admin = JSON.parse(fs.readFileSync(process.env.ADMIN_JSON ?? 'admin.json', 'utf8'));
  const a = await (await b.newContext({ reducedMotion: 'reduce' })).newPage(); await login(a, admin.email, admin.password);
  for (const u of ['/admin', '/admin/moderation', '/admin/signalements', '/admin/utilisateurs', '/admin/entreprises', '/admin/abonnements', '/admin/avis', '/admin/journal']) { await a.goto(base + u); await audit(a, 'admin ' + u); }
  console.log(`\n${total.pages} pages auditées (WCAG 2.1 A/AA) — ${total.violations} type(s) de violation`);
  await b.close();
})().catch((e) => { console.error('ARRÊT :', e.message.split('\n')[0]); process.exit(1); });
