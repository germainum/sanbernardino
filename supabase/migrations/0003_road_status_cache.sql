-- Caches the parsed San Bernardino/Gotthard road status derived from ASTRA/opentransportdata.swiss's
-- national DATEX II "Traffic Situations" feed (packages/core/src/providers/astraDatex2.ts).
-- That feed is a ~23MB national dump with no server-side filter for one road, so it's fetched
-- on its own slow cadence (~every 30min, via the refresh-road-status Edge Function + its own
-- pg_cron job) rather than on every 3-min `poll` run. `poll` just reads the latest row here.
-- Singleton row (id always 1) — there's only one corridor this app tracks.
create table road_status_cache (
  id         smallint primary key default 1,
  fetched_at timestamptz not null,
  raw        jsonb not null,             -- ViasuisseRaw shape: {tunnel, col, gothard}
  constraint road_status_cache_singleton check (id = 1)
);

alter table road_status_cache enable row level security;

grant select, insert, update on road_status_cache to service_role;
