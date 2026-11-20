#!/usr/bin/env bash
# Exécute les migrations puis les tests RLS sur un PostgreSQL local jetable.
# Usage : PGHOST=... PGPORT=... PGUSER=postgres supabase/tests/run.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
psql -q -c "set client_min_messages = warning" -c "drop database if exists jobfinder_test" -c "create database jobfinder_test"
args=(-d jobfinder_test -v ON_ERROR_STOP=1 -q -f supabase/tests/supabase-stubs.sql)
for f in supabase/migrations/*.sql; do args+=(-f "$f"); done
psql "${args[@]}" -f supabase/tests/rls.test.sql 2>&1 | sed -n 's/.*NOTICE:  //p; /✅\|ÉCHEC\|ERROR/p'
