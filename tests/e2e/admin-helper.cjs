// Client Supabase connecté en tant qu'administrateur de test (identifiants générés dans admin.json).
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const KEY = fs.readFileSync(require('path').resolve(__dirname, '../../.env.local'), 'utf8').match(/PUBLISHABLE_KEY=(\S+)/)[1];
module.exports = async function adminClient() {
  const { email, password } = JSON.parse(fs.readFileSync((process.env.ADMIN_JSON ?? require('path').resolve(__dirname, '.admin.json')), 'utf8'));
  const sb = createClient('https://ntfzctzimthfrcnllalc.supabase.co', KEY, { auth: { persistSession: false } });
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error('Connexion admin impossible : ' + error.message);
  return sb;
};
