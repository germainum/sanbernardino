import { json, handleOptions } from "../_shared/http.ts";
import { serviceClient } from "../_shared/db.ts";

/**
 * POST /api/devices { push_token, platform } -> { device_id }
 * GET /api/devices/:id -> device row (Settings screen hydration; not in the original
 * backend-san-bernardino.md §4 table, added because Settings needs to read current prefs)
 * PATCH /api/devices/:id { prefs?, consent? } -> updated device row
 * per backend-san-bernardino.md §4. `remove_ads` is deliberately NOT settable here — the
 * remove_ads entitlement ended up being checked entirely client-side via the RevenueCat SDK
 * (app/src/iap/RevenueCat.ts), which validates purchases against the Play Store itself, so
 * this column is currently unused/always false. Kept rather than dropped in case a future
 * need (analytics, support lookups) calls for syncing it via a RevenueCat webhook.
 */
Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const db = serviceClient();

  if (req.method === "GET") {
    const id = new URL(req.url).pathname.split("/").filter(Boolean).pop();
    if (!id) return json({ error: "device id required in path, e.g. /devices/:id" }, { status: 400 });
    const { data, error } = await db.from("devices").select().eq("id", id).maybeSingle();
    if (error) return json({ error: error.message }, { status: 500 });
    if (!data) return json({ error: "device_not_found" }, { status: 404 });
    return json(data);
  }

  if (req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    if (!body.push_token || !body.platform) {
      return json({ error: "push_token and platform are required" }, { status: 400 });
    }
    const { data, error } = await db
      .from("devices")
      .upsert({ push_token: body.push_token, platform: body.platform, last_seen: new Date().toISOString() }, { onConflict: "push_token" })
      .select("id")
      .single();
    if (error) return json({ error: error.message }, { status: 500 });
    return json({ device_id: data.id }, { status: 201 });
  }

  if (req.method === "PATCH") {
    const id = new URL(req.url).pathname.split("/").filter(Boolean).pop();
    if (!id) return json({ error: "device id required in path, e.g. /devices/:id" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const update = {};
    if (body.prefs !== undefined) update.prefs = body.prefs;
    if (body.consent !== undefined) update.consent = body.consent;
    if (Object.keys(update).length === 0) return json({ error: "nothing to update (prefs/consent expected)" }, { status: 400 });

    const { data, error } = await db.from("devices").update(update).eq("id", id).select().maybeSingle();
    if (error) return json({ error: error.message }, { status: 500 });
    if (!data) return json({ error: "device_not_found" }, { status: 404 });
    return json(data);
  }

  return json({ error: "method_not_allowed" }, { status: 405 });
});
