-- Schedules refresh-road-status every 30 minutes via pg_cron + pg_net — see that function's
-- doc comment and road_status_cache's migration for why this runs on its own slow cadence
-- instead of piggybacking on the 3-min poll-san-bernardino job. Reuses the same 'cron_secret'
-- Vault entry and CRON_SECRET function secret as poll-san-bernardino (0002_schedule_poll_cron.sql)
-- — no separate secret needed, both jobs just need "prove you're our own cron, not the public
-- internet" against the same value.
select cron.schedule('refresh-road-status', '*/30 * * * *', 'select net.http_post(url:=''https://phkeefhmoonzdwkjzxwa.supabase.co/functions/v1/refresh-road-status'', headers:=jsonb_build_object(''Content-Type'',''application/json'',''x-cron-secret'',(select decrypted_secret from vault.decrypted_secrets where name = ''cron_secret'')), body:=''{}''::jsonb);');
