-- The "geolocated alerts" setting was UI-only — no geofencing code ever backed it — and has
-- been removed from the app (Settings.tsx) and DevicePrefs type. Drops it from new devices'
-- default prefs; existing rows keep a harmless unused "geo_enabled" key in their stored JSON
-- (ignored by both client and server code going forward, not worth a data migration).
alter table devices alter column prefs set default '{
   "directions": ["suisse","italie"],
   "types": {"verdict":true,"col_open":true,"tunnel_closed":true,"gothard":true,
             "jam_threshold":true,"cleared":false,"restriction":true},
   "jam_threshold_min": 20,
   "quiet_hours": {"from":"22:00","to":"07:00"}
}'::jsonb;
