#!/usr/bin/env bash
# Lance les scénarios de bout en bout contre un serveur local (http://localhost:3100) relié au projet Supabase de test.
# Prérequis : .env.local complet (Supabase, Stripe test, Resend avec EMAIL_REDIRECT_TO, BILLING_KEY),
# confirmation e-mail désactivée dans Supabase, administrateur de test (tests/e2e/.admin.json, voir create-admin.cjs),
# serveur démarré avec sa sortie dans .server.log :  npm run build && npm start -- -p 3100 > .server.log 2>&1 &
set -uo pipefail
cd "$(dirname "$0")"
total=0; failed=0
for f in 0*.cjs; do
  out=$(node "$f" 2>&1); ok=$(grep -c '✅' <<<"$out"); total=$((total + ok))
  if grep -q 'TOUT EST VERT' <<<"$out"; then echo "✅ $f : $ok vérifications"; else failed=1; echo "❌ $f"; grep -E '❌|ARRÊT' <<<"$out"; fi
done
echo "Total : $total vérifications"
exit $failed
