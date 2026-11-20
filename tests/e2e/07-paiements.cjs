// Tests de bout en bout phase 7 : Stripe (mode test) + webhook + limites d'annonces.
const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
const fs = require('fs');
const env = Object.fromEntries(fs.readFileSync(require('path').resolve(__dirname, '../../.env.local'), 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL, KEY = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, WHSEC = env.STRIPE_WEBHOOK_SECRET;
const stripe = new Stripe('sk_test_proxy_injected', { httpClient: Stripe.createFetchHttpClient() });
const base = 'http://localhost:3100', ts = Date.now(), PW = 'Jobfinder-test-2026', dir = __dirname;
const rec = `e2e.recruteur.${ts}@example.com`;
fs.appendFileSync(require('path').resolve(__dirname, '.accounts.log'), rec + '\n');
let failures = 0;
const ok = (c, m) => { console.log((c ? '✅ ' : '❌ ') + m); if (!c) failures++; };
const sb = () => createClient(URL_, KEY, { auth: { persistSession: false } });
const t0 = Math.floor(Date.now() / 1000) - 5;

/** Livre un événement au webhook avec une signature Stripe valide. */
async function deliver(event) {
  const payload = JSON.stringify(event);
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret: WHSEC });
  const r = await fetch(base + '/api/stripe/webhook', { method: 'POST', body: payload, headers: { 'stripe-signature': header, 'content-type': 'application/json' } });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}
/** Récupère les vrais événements Stripe d'un client et les livre (ordre chronologique). */
async function deliverRealEvents(customer, types) {
  await new Promise((r) => setTimeout(r, 2500));
  const list = await stripe.events.list({ created: { gte: t0 }, types, limit: 100 });
  const mine = list.data.filter((e) => (e.data.object.customer ?? e.data.object.id) === customer && !delivered.has(e.id)).reverse();
  const results = [];
  for (const e of mine) { delivered.add(e.id); results.push({ type: e.type, ...(await deliver(e)) }); }
  return results;
}
const delivered = new Set();
const synthetic = (type, object) => ({ id: `evt_test_${ts}_${Math.random().toString(36).slice(2, 10)}`, object: 'event', type, created: Math.floor(Date.now() / 1000), livemode: false, data: { object }, api_version: null, pending_webhooks: 0, request: null });

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const r = await ctx.newPage();
  const errs = []; r.on('pageerror', (e) => errs.push(String(e)));
  const stripeRedirects = [];
  await ctx.route(/https:\/\/(checkout|billing)\.stripe\.com\/.*/, (route) => { stripeRedirects.push(route.request().url()); route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>Page Stripe (simulée pour le test)</h1>' }); });
  const see = (t, ms = 10000) => r.getByText(t).first().waitFor({ timeout: ms }).then(() => true, () => false);

  // ── Sécurité du webhook
  const noSig = await fetch(base + '/api/stripe/webhook', { method: 'POST', body: '{}' });
  ok(noSig.status === 400, 'Webhook sans signature → 400');
  const badSig = await fetch(base + '/api/stripe/webhook', { method: 'POST', body: '{"id":"evt_x"}', headers: { 'stripe-signature': 't=1,v1=faux' } });
  ok(badSig.status === 400, 'Webhook avec fausse signature → 400');

  // ── Recruteur sans formule
  await r.goto(base + '/inscription?role=recruteur');
  await r.fill('#companyName', `Agence E2E ${ts}`); await r.fill('#fullName', 'Paul Payeur'); await r.fill('#email', rec); await r.fill('#password', PW); await r.check('input[name=terms]');
  await r.click('main button[type=submit]'); await r.waitForURL(/\/recruteur/, { timeout: 15000 });
  await r.goto(base + '/recruteur/entreprise'); await r.click('#informations button[type=submit]'); await r.waitForURL(/bienvenue/, { timeout: 15000 });
  const R = sb(); await R.auth.signInWithPassword({ email: rec, password: PW }); const uid = (await R.auth.getUser()).data.user.id;
  const { data: co } = await R.from('companies').select('id').eq('owner_id', uid).single();
  const A = await require('./admin-helper.cjs')(); await A.from('companies').update({ is_verified: true }).eq('id', co.id);
  const offer = (i) => ({ company_id: co.id, title: `Poste E2E ${i} ${ts}`, slug: `e2e-poste-${i}-${ts}`, short_description: 'Offre de test automatisé, supprimée après les tests.', contract_type: 'cdi', work_time: 'full_time', sector: 'retail', city: 'Paris 11e', postal_code: '75011', commune_code: '75111', missions: ['Test'] });
  const ids = [];
  for (let i = 1; i <= 5; i++) ids.push((await R.from('job_offers').insert(offer(i)).select('id').single()).data.id);
  await r.goto(base + `/recruteur/offres/${ids[0]}`);
  await r.getByRole('button', { name: 'Publier' }).click();
  ok(await see("Limite d'annonces actives atteinte"), 'Sans formule : publication refusée avec un message clair');
  await r.goto(base + '/recruteur/abonnement');
  ok(await see('Aucune formule') && await see('0 / 0'), 'Page Abonnement : aucune formule, 0 / 0');

  // ── Checkout Starter : redirection vers Stripe
  await r.getByRole('button', { name: 'Choisir Starter' }).click();
  await r.waitForURL(/checkout\.stripe\.com/, { timeout: 20000 }).catch(() => {});
  const checkoutUrl = stripeRedirects.find((u) => u.includes('checkout.stripe.com'));
  ok(!!checkoutUrl, 'Choisir Starter → page de paiement Stripe (checkout.stripe.com)');
  const { data: subRow } = await R.from('subscriptions').select('stripe_customer_id').eq('company_id', co.id).single();
  const customer = subRow?.stripe_customer_id;
  ok(customer?.startsWith('cus_'), 'Client Stripe créé et rattaché à l\'entreprise');
  const cust = await stripe.customers.retrieve(customer);
  ok(cust.metadata.company_id === co.id && cust.email === rec, 'Client Stripe : e-mail et identifiant d\'entreprise corrects');
  const sessions = await stripe.checkout.sessions.list({ customer, limit: 5 });
  const cs = sessions.data[0];
  ok(cs && cs.mode === 'subscription' && cs.metadata.company_id === co.id && cs.locale === 'fr', 'Session Checkout : abonnement, métadonnées, page en français');

  // ── Paiement par carte de test (équivalent du formulaire Stripe) → vrais événements
  const pm = await stripe.paymentMethods.attach('pm_card_visa', { customer });
  await stripe.customers.update(customer, { invoice_settings: { default_payment_method: pm.id } });
  const sub = await stripe.subscriptions.create({ customer, items: [{ price: env.STRIPE_PRICE_STARTER }], metadata: { company_id: co.id } });
  ok(sub.status === 'active', `Abonnement Starter payé avec la carte de test (${sub.status})`);
  const res1 = await deliverRealEvents(customer, ['customer.subscription.created', 'invoice.paid']);
  ok(res1.length >= 2 && res1.every((x) => x.status === 200), `Webhook : ${res1.map((x) => x.type).join(', ')} → 200`);
  const replay = await deliver((await stripe.events.list({ types: ['customer.subscription.created'], created: { gte: t0 }, limit: 10 })).data.find((e) => e.data.object.customer === customer));
  ok(replay.body.result === 'duplicate', 'Événement rejoué : ignoré (idempotence)');
  await r.goto(base + '/recruteur/abonnement');
  ok(await see('Starter') && await see('Actif') && await see('Prochain renouvellement'), 'Page Abonnement : Starter actif, date de renouvellement');
  ok(await see('29 €') && await see('Payé') && await see('Abonnement Starter (mensuel)'), 'Historique : paiement de 29 € enregistré, libellé en français');

  // ── Limite Starter : 3 annonces
  const pub = async (id) => (await R.from('job_offers').update({ status: 'published' }).eq('id', id).select('status')).error;
  ok(!(await pub(ids[0])) && !(await pub(ids[1])) && !(await pub(ids[2])), 'Starter : 3 annonces publiées');
  const e4 = await pub(ids[3]); ok(e4?.message.includes('QUOTA_ATTEINT'), 'Starter : 4e annonce refusée par la base');
  ok(!!(await R.from('job_offers').select('is_featured').eq('id', ids[0]).single()).data.is_featured === false, 'Starter : pas de mise en avant');

  // ── Annonce à l'unité
  await r.goto(base + '/recruteur/abonnement'); await r.getByRole('button', { name: 'Acheter une annonce' }).click();
  await r.waitForURL(/checkout\.stripe\.com/, { timeout: 20000 }).catch(() => {});
  const single = (await stripe.checkout.sessions.list({ customer, limit: 5 })).data.find((s) => s.mode === 'payment');
  ok(single && single.metadata.kind === 'single_offer' && single.amount_total === 990, 'Checkout annonce à l\'unité : 9,90 €');
  const paidSession = { ...single, status: 'complete', payment_status: 'paid' };
  const d1 = await deliver(synthetic('checkout.session.completed', paidSession));
  ok(d1.status === 200, 'Webhook : paiement de l\'annonce à l\'unité enregistré');
  const d2 = await deliver(synthetic('checkout.session.completed', paidSession));
  const { data: credits } = await R.from('offer_credits').select('id');
  ok(d2.status === 200 && credits.length === 1, 'Même paiement reçu deux fois : un seul crédit accordé');
  ok(!(await pub(ids[3])), 'Avec le crédit : 4e annonce publiée');
  ok((await pub(ids[4]))?.message.includes('QUOTA_ATTEINT'), '5e annonce refusée (3 + 1 crédit)');
  await r.goto(base + '/recruteur/abonnement'); ok(await see('4 / 4'), 'Jauge : 4 / 4');

  // ── Passage en Pro (changement de formule)
  const subNow = await stripe.subscriptions.retrieve(sub.id);
  await stripe.subscriptions.update(sub.id, { items: [{ id: subNow.items.data[0].id, price: env.STRIPE_PRICE_PRO }], proration_behavior: 'none' });
  const res2 = await deliverRealEvents(customer, ['customer.subscription.updated']);
  ok(res2.some((x) => x.type === 'customer.subscription.updated' && x.status === 200), 'Webhook : passage en Pro');
  ok(!(await pub(ids[4])), 'Pro : 5e annonce publiée');
  const { data: feat } = await R.from('job_offers').select('is_featured').in('id', ids).eq('status', 'published');
  ok(feat.length === 5 && feat.every((o) => o.is_featured), 'Pro : toutes les annonces en ligne mises en avant');
  await r.goto(base + `/recruteur/offres/${ids[0]}`); ok(await see('Vues des 30 derniers jours'), 'Pro : statistiques avancées visibles');
  const anon = await (await b.newContext()).newPage(); await anon.goto(base + `/offres?q=${ts}`);
  ok(await anon.getByText('À la une').count() >= 1, 'Recherche publique : badge « À la une »');

  // ── Échec de paiement
  const failedInvoice = { id: `in_test_${ts}`, object: 'invoice', customer, amount_due: 5900, amount_paid: 0, currency: 'eur', billing_reason: 'subscription_cycle', lines: { data: [{ description: 'Kairo Pro' }] } };
  ok((await deliver(synthetic('invoice.payment_failed', failedInvoice))).status === 200, 'Webhook : échec de paiement');
  await r.goto(base + '/recruteur/notifications'); ok(await see('Échec du paiement de votre abonnement'), 'Recruteur notifié de l\'échec de paiement');
  await r.goto(base + '/recruteur/abonnement'); ok(await see('Échec'), 'Historique : paiement en échec visible');

  // ── Portail client
  await r.getByRole('button', { name: 'Gérer mon abonnement' }).click();
  await r.waitForURL(/billing\.stripe\.com/, { timeout: 20000 }).catch(() => {});
  ok(stripeRedirects.some((u) => u.includes('billing.stripe.com')), 'Gérer mon abonnement → portail client Stripe');

  // ── Administration
  const a = await (await b.newContext()).newPage();
  const admin = JSON.parse(fs.readFileSync((process.env.ADMIN_JSON ?? require('path').resolve(__dirname, '.admin.json')), 'utf8'));
  await a.goto(base + '/connexion'); await a.fill('#email', admin.email); await a.fill('#password', admin.password); await a.click('main button[type=submit]'); await a.waitForURL(/\/admin/, { timeout: 15000 });
  ok(await a.getByText('Revenus encaissés (total)').isVisible() && !(await a.locator('a', { hasText: 'Revenus encaissés (total)' }).innerText()).includes('0 €'), 'Admin : revenus encaissés > 0 €');
  await a.goto(base + '/admin/abonnements'); ok(await a.getByText(`Agence E2E ${ts}`).first().isVisible(), 'Admin : abonnement listé');

  // ── Résiliation
  await stripe.subscriptions.cancel(sub.id);
  const res3 = await deliverRealEvents(customer, ['customer.subscription.deleted']);
  ok(res3.some((x) => x.type === 'customer.subscription.deleted' && x.status === 200), 'Webhook : résiliation');
  await r.goto(base + '/recruteur/abonnement'); ok(await see('Aucune formule'), 'Après résiliation : plus de formule');
  const { data: after } = await R.from('job_offers').select('is_featured, status').in('id', ids);
  ok(after.every((o) => !o.is_featured) && after.filter((o) => o.status === 'published').length === 5, 'Résiliation : mise en avant retirée, annonces en ligne jusqu\'à expiration');
  await r.goto(base + '/recruteur/notifications'); ok(await see('Abonnement terminé'), 'Recruteur notifié de la fin de l\'abonnement');
  await r.goto(base + '/recruteur/abonnement'); await r.screenshot({ path: (process.env.SHOTS_DIR ?? require('os').tmpdir()) + '/p7-abonnement.png', fullPage: true });

  // ── Nettoyage
  await A.from('job_offers').delete().in('id', ids);
  await stripe.customers.del(customer);
  ok(true, 'Nettoyage : annonces et client Stripe de test supprimés');
  ok(errs.length === 0, 'Aucune erreur JavaScript ' + errs.join(' | '));
  console.log(`\n${failures === 0 ? 'TOUT EST VERT' : failures + ' ÉCHEC(S)'}`);
  await b.close();
})().catch((e) => { console.error('ARRÊT :', e.message.split('\n')[0]); process.exit(1); });
