const { createClient } = require('@supabase/supabase-js');
const fs = require('fs'), crypto = require('crypto');
const KEY = fs.readFileSync(require('path').resolve(__dirname, '../../.env.local'), 'utf8').match(/PUBLISHABLE_KEY=(\S+)/)[1];
const email = `qa.admin.${Date.now()}@example.com`, password = crypto.randomBytes(24).toString('base64url');
(async () => {
  const sb = createClient('https://ntfzctzimthfrcnllalc.supabase.co', KEY, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name: 'Admin Test E2E' } } });
  if (error || !data.session) { console.log('ERREUR', error?.message); process.exit(1); }
  fs.writeFileSync((process.env.ADMIN_JSON ?? require('path').resolve(__dirname, '.admin.json')), JSON.stringify({ email, password }), { mode: 0o600 });
  fs.appendFileSync(require('path').resolve(__dirname, '.accounts.log'), email + '\n');
  console.log(email);
})();
