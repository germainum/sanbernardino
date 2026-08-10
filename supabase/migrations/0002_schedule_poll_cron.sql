-- Schedules the poll Edge Function every 3 minutes via pg_cron + pg_net, per
-- backend-san-bernardino.md §1 ("CRON toutes les 3-5 min"). The CRON_SECRET value itself is
-- NOT in this file — it lives in Supabase Vault (`vault.create_secret(..., 'cron_secret')`,
-- run once by hand against the target database) and is looked up at call time, so this
-- migration is safe to commit and replays identically in any environment.
--
-- This migration is written to be safe to run locally too: `supabase start`'s Postgres
-- image ships pg_cron/pg_net already enabled, but there is no 'cron_secret' row in a fresh
-- local vault and no real https://...supabase.co endpoint to call — the scheduled job
-- would simply fail silently (net.http_post logs failures to net._http_response, it doesn't
-- raise), which is harmless for local dev. Production requires the vault secret to be
-- seeded once per project (see the runbook below).
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'poll-san-bernardino',
  '*/3 * * * *',
  $$
  select net.http_post(
    url := 'https://phkeefhmoonzdwkjzxwa.supabase.co/functions/v1/poll',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- One-time runbook per environment (not part of this migration — run by hand):
--   select vault.create_secret('<the CRON_SECRET value>', 'cron_secret', 'x-cron-secret header for the poll function');
-- Must match the CRON_SECRET set via `supabase secrets set CRON_SECRET=...` for the
-- Edge Function itself to accept the request.
