// Tests de bout en bout phase 8 : e-mails réellement envoyés via Resend (redirigés vers delivered@resend.dev).
const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
const fs = require('fs');
const env = Object.fromEntries(fs.readFileSync(require('path').resolve(__dirname, '../../.env.local'), 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL, KEY = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const stripe = new Stripe('sk_test_proxy_injected', { httpClient: Stripe.createFetchHttpClient() });
const base = 'http://localhost:3100', ts = Date.now(), PW = 'Jobfinder-test-2026', dir = __dirname;
const LOG = process.env.SERVER_LOG ?? require('path').resolve(__dirname, '../../.server.log');
const rec = `e2e.recruteur.${ts}@example.com`, cand = `e2e.candidat.${ts}@example.com`;
fs.appendFileSync(require('path').resolve(__dirname, '.accounts.log'), [rec, cand].join('\n') + '\n');
let failures = 0;
const ok = (c, m) => { console.log((c ? '✅ ' : '❌ ') + m); if (!c) failures++; };
const sb = () => createClient(URL_, KEY, { auth: { persistSession: false } });
const logStart = fs.statSync(LOG).size;

/** Identifiants Resend journalisés par le serveur depuis le début du test, par type d'e-mail. */
function sentIds(tag) {
  const log = fs.readFileSync(LOG).subarray(logStart).toString('utf8'); // découpage en octets (accents)
  return [...log.matchAll(new RegExp(`\\[email:${tag}\\] envoyé ([0-9a-f-]{36})`, 'g'))].map((m) => m[1]);
}
async function waitSent(tag, n = 1, ms = 15000) {
  const end = Date.now() + ms;
  while (Date.now() < end) { const ids = sentIds(tag); if (ids.length >= n) return ids; await new Promise((r) => setTimeout(r, 500)); }
  return sentIds(tag);
}
/** Clé Resend « envoi uniquement » : on vérifie que l'envoi a été accepté par Resend (identifiant journalisé). */
async function check(tag, _to, _content, label) {
  const ids = await waitSent(tag, 1, 20000);
  ok(ids.length >= 1, `${label} — accepté par Resend (${ids.at(-1) ?? 'aucun identifiant'})`);
}
async function deliver(event) {
  const payload = JSON.stringify(event);
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret: env.STRIPE_WEBHOOK_SECRET });
  return (await fetch(base + '/api/stripe/webhook', { method: 'POST', body: payload, headers: { 'stripe-signature': header } })).status;
}
const synthetic = (type, object) => ({ id: `evt_test_${ts}_${Math.random().toString(36).slice(2, 10)}`, object: 'event', type, created: Math.floor(Date.now() / 1000), livemode: false, data: { object }, api_version: null, pending_webhooks: 0, request: null });

(async () => {
  const A = await require('./admin-helper.cjs')();
  // Recruteur + entreprise vérifiée + crédit, candidat
  const R = sb(); const rs = await R.auth.signUp({ email: rec, password: PW, options: { data: { full_name: 'Rose Recruteuse', role: 'recruiter' } } });
  const { data: co } = await R.from('companies').insert({ owner_id: rs.data.user.id, name: `Café E2E ${ts}`, slug: `e2e-cafe-${ts}` }).select().single();
  await A.from('companies').update({ is_verified: true }).eq('id', co.id);
  await A.from('offer_credits').insert({ company_id: co.id, source: 'admin', note: 'tests' });
  const TITLE = `Barista E2E ${ts}`;
  const { data: offer } = await R.from('job_offers').insert({ company_id: co.id, title: TITLE, slug: `e2e-barista-${ts}`, short_description: 'Offre de test automatisé, supprimée après les tests.', missions: ['Préparer les boissons'], contract_type: 'cdd', duration_months: 3, work_time: 'part_time', schedules: ['weekend'], sector: 'hospitality', city: 'Paris 11e', postal_code: '75011', commune_code: '75111', status: 'published' }).select().single();
  ok(offer?.slug, 'Offre de test publiée');
  const C = sb(); await C.auth.signUp({ email: cand, password: PW, options: { data: { full_name: 'Chloé Candidate', role: 'candidate' } } });

  const b = await chromium.launch();
  const c = await (await b.newContext()).newPage();
  await c.goto(base + '/connexion'); await c.fill('#email', cand); await c.fill('#password', PW); await c.click('main button[type=submit]'); await c.waitForURL(/\/espace/);
  // ── Candidature → 2 e-mails
  await c.goto(base + `/offres/${offer.slug}`); await c.getByRole('button', { name: 'Postuler' }).click();
  await c.getByRole('button', { name: 'Envoyer ma candidature' }).click();
  await c.getByText('Candidature envoyée').first().waitFor();
  await check('application_confirmation', cand, TITLE, 'E-mail au candidat : confirmation de candidature');
  await check('application_received', rec, 'Chloé Candidate', 'E-mail au recruteur : nouvelle candidature');

  // ── Changement de statut → e-mail
  const r = await (await b.newContext()).newPage();
  await r.goto(base + '/connexion'); await r.fill('#email', rec); await r.fill('#password', PW); await r.click('main button[type=submit]'); await r.waitForURL(/\/recruteur/);
  await r.goto(base + '/recruteur/candidatures'); await r.getByText('Chloé Candidate').click(); await r.waitForURL(/candidatures\/[0-9a-f-]{36}$/);
  await r.getByRole('radio', { name: 'Entretien' }).click(); await r.getByText('prévenu par e-mail').first().waitFor();
  await check('application_status', cand, 'Entretien', 'E-mail au candidat : statut « Entretien »');

  // ── Facturation (abonnement réel Stripe + événements)
  const customer = await stripe.customers.create({ email: rec, metadata: { company_id: co.id } });
  const bill = createClient(URL_, KEY, { auth: { persistSession: false }, global: { headers: { 'x-billing-key': env.BILLING_KEY } } });
  await bill.rpc('billing_link_customer', { company: co.id, customer: customer.id });
  const pm = await stripe.paymentMethods.attach('pm_card_visa', { customer: customer.id });
  await stripe.customers.update(customer.id, { invoice_settings: { default_payment_method: pm.id } });
  const sub = await stripe.subscriptions.create({ customer: customer.id, items: [{ price: env.STRIPE_PRICE_PRO }], metadata: { company_id: co.id } });
  const session = { id: `cs_test_${ts}`, object: 'checkout.session', mode: 'subscription', subscription: sub.id, customer: customer.id, metadata: { company_id: co.id, kind: 'subscription' }, payment_status: 'paid', status: 'complete' };
  ok(await deliver(synthetic('checkout.session.completed', session)) === 200, 'Webhook : abonnement Pro souscrit');
  await check('subscription_activated', rec, 'Pro', 'E-mail : abonnement activé');
  const single = { id: `cs_test_single_${ts}`, object: 'checkout.session', mode: 'payment', customer: customer.id, metadata: { company_id: co.id, kind: 'single_offer' }, payment_status: 'paid', amount_total: 990, currency: 'eur' };
  await deliver(synthetic('checkout.session.completed', single));
  await check('single_offer', rec, 'annonce', 'E-mail : annonce à l\'unité achetée');
  const priceLine = { pricing: { price_details: { price: env.STRIPE_PRICE_PRO } }, description: 'x' };
  await deliver(synthetic('invoice.paid', { id: `in_test_ok_${ts}`, object: 'invoice', customer: customer.id, amount_paid: 5900, amount_due: 5900, currency: 'eur', billing_reason: 'subscription_cycle', lines: { data: [priceLine] } }));
  await check('subscription_renewed', rec, '59', 'E-mail : abonnement renouvelé (59 €)');
  await deliver(synthetic('invoice.payment_failed', { id: `in_test_ko_${ts}`, object: 'invoice', customer: customer.id, amount_paid: 0, amount_due: 5900, currency: 'eur', billing_reason: 'subscription_cycle', lines: { data: [priceLine] } }));
  await check('payment_failed', rec, 'Mettre à jour mon paiement', 'E-mail : échec de paiement');
  await stripe.subscriptions.cancel(sub.id);
  await new Promise((res) => setTimeout(res, 2500));
  const del = (await stripe.events.list({ types: ['customer.subscription.deleted'], limit: 20 })).data.find((e) => e.data.object.id === sub.id);
  await deliver(del);
  await check('subscription_ended', rec, 'pris fin', 'E-mail : fin d\'abonnement');

  // ── Les e-mails n'ont rien bloqué et ne contiennent pas d'erreur côté serveur
  const errors = fs.readFileSync(LOG).subarray(logStart).toString('utf8').split('\n').filter((l) => /\[email:[^\]]+\] (?!envoyé)/.test(l));
  ok(errors.length === 0, `Aucune erreur d'envoi dans le journal du serveur ${errors.slice(0, 2).join(' | ')}`);

  // ── Nettoyage
  await A.from('job_offers').delete().eq('id', offer.id);
  await stripe.customers.del(customer.id);
  ok(true, 'Nettoyage : offre et client Stripe supprimés');
  console.log(`\n${failures === 0 ? 'TOUT EST VERT' : failures + ' ÉCHEC(S)'}`);
  await b.close();
})().catch((e) => { console.error('ARRÊT :', e.message.split('\n')[0]); process.exit(1); });
