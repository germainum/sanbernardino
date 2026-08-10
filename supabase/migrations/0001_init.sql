-- Schema per backend-san-bernardino.md §2. Six tables: snapshots (state at each poll),
-- delay_history (time series for the 3h graph), devices (push registry + prefs),
-- notification_log (dedup/cooldown/cap), event_candidates (persist-over-2-polls), and
-- planned_trips (T-30min departure reminders).

create extension if not exists pgcrypto;

create table snapshots (
  id            bigserial primary key,
  captured_at   timestamptz not null default now(),
  direction     text not null,          -- 'suisse' | 'italie'
  tunnel_state  text not null,          -- 'go' | 'caution' | 'stop'
  tunnel_total  int,                    -- minutes (null if closed with no ETA)
  tunnel_detail text,
  col_state     text not null,
  col_total     int,
  col_detail    text,
  col_seasonal_open boolean,
  gothard_state text,
  gothard_total int,
  gothard_detail text,
  verdict       text not null,          -- 'tunnel' | 'col' | 'gothard' | 'attente'
  saturated     boolean not null default false,
  raw           jsonb,                  -- normalized RoutesSnapshot, full payload
  -- The last CONFIRMED reading per direction — event detection compares against this, not
  -- against the immediately preceding raw poll. A transition only advances the baseline
  -- (and fires events) once event_candidates has seen the same target state on two
  -- consecutive polls; every raw poll is still archived here regardless, for /api/history
  -- and audit. See supabase/functions/poll/index.ts for the confirm/advance logic.
  is_baseline   boolean not null default false
);
create index on snapshots (captured_at desc);
create index on snapshots (direction, captured_at desc);
create unique index snapshots_one_baseline_per_direction on snapshots (direction) where is_baseline;

-- Reference free-flow times (constants, not stored per row): tunnel=8, col=34, gothard=42.
-- delay = max(0, total - base) — see packages/core/src/{constants,evaluate}.ts, the single
-- source of truth also used server-side by the poll function and the /api/state endpoint.

create table delay_history (
  id          bigserial primary key,
  captured_at timestamptz not null default now(),
  direction   text not null,
  route       text not null,            -- 'tunnel' | 'col' | 'gothard'
  delay_min   int not null
);
create index on delay_history (route, direction, captured_at desc);

create table devices (
  id          uuid primary key default gen_random_uuid(),
  push_token  text unique not null,
  platform    text not null,            -- 'android' | 'ios'
  created_at  timestamptz not null default now(),
  last_seen   timestamptz not null default now(),
  -- "types" keys must match packages/core's EventType union exactly (fanOut checks
  -- device.prefs.types[event.type] === false) — using "tunnel_closed" here, not the
  -- "incident" name from fonctionnalites-natives-san-bernardino.md's example JSON, and
  -- including "gothard", which that example omits. Either mismatch would silently make the
  -- per-type toggle a no-op for that event type.
  prefs       jsonb not null default '{
     "directions": ["suisse","italie"],
     "types": {"verdict":true,"col_open":true,"tunnel_closed":true,"gothard":true,
               "jam_threshold":true,"cleared":false,"restriction":true},
     "jam_threshold_min": 20,
     "quiet_hours": {"from":"22:00","to":"07:00"},
     "geo_enabled": false
  }'::jsonb,
  remove_ads  boolean not null default false,  -- entitlement IAP (validated server-side)
  consent     jsonb                            -- UMP status (personalized / npa)
);

create table notification_log (
  id         bigserial primary key,
  device_id  uuid not null references devices(id) on delete cascade,
  type       text not null,
  dedup_key  text not null,             -- e.g. 'verdict:italie:col'
  sent_at    timestamptz not null default now()
);
create index on notification_log (device_id, type, sent_at desc);

-- An event is confirmed and sent only if it is still present on the *next* poll
-- (anti-noise for the ~3min data refresh) — see packages/core/src/events.ts and
-- backend-san-bernardino.md §3.1 confirmPersistence().
create table event_candidates (
  key         text primary key,         -- e.g. 'col_open:italie' | 'jam_threshold:tunnel:40:italie'
  direction   text not null,            -- lets the poll function wipe stale candidates for one
                                         -- direction (e.g. once its baseline advances) without
                                         -- parsing the key string
  first_seen  timestamptz not null default now(),
  payload     jsonb
);
create index on event_candidates (direction);

create table planned_trips (
  id         uuid primary key default gen_random_uuid(),
  device_id  uuid not null references devices(id) on delete cascade,
  direction  text not null,             -- 'suisse' | 'italie'
  depart_at  timestamptz not null,
  notified   boolean not null default false
);
create index on planned_trips (depart_at) where not notified;

-- RLS, no policies: default-deny for the anon/authenticated roles PostgREST exposes these
-- tables to. All real access goes through the Edge Functions API (service_role, which
-- bypasses RLS) — see backend-san-bernardino.md §4. Migrations/seed scripts connect as the
-- postgres superuser, which also bypasses RLS, so this is a no-op for local dev tooling.
alter table snapshots enable row level security;
alter table delay_history enable row level security;
alter table devices enable row level security;
alter table notification_log enable row level security;
alter table event_candidates enable row level security;
alter table planned_trips enable row level security;

-- Recent Supabase projects no longer auto-grant table privileges to the Data API roles on
-- table creation (config.toml's `auto_expose_new_tables`, now defaulted off). service_role
-- (used exclusively by the Edge Functions in supabase/functions/) needs explicit grants to
-- read/write at all; it still bypasses RLS via its Postgres role attribute, so this grant
-- alone is sufficient for it. anon/authenticated get no grants at all — combined with RLS
-- enabled and zero policies above, that's belt-and-suspenders default-deny for them.
grant usage on schema public to service_role;
grant select, insert, update, delete on
  snapshots, delay_history, devices, notification_log, event_candidates, planned_trips
  to service_role;
grant usage, select on all sequences in schema public to service_role;
