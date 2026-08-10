import { createClient } from "npm:@supabase/supabase-js@2";
import {
  normalize,
  evaluate,
  detectEvents,
  shouldSuppress,
  getViasuisseProvider,
  getRoutesProvider,
  buildPushPayload,
} from "../../../packages/core/dist/index.js";
import { sendFcmPush } from "../_shared/fcm.ts";

/**
 * The cron job: fetch -> normalize -> archive -> detect events -> confirm persistence ->
 * fan-out (anti-spam gated) -> purge, per backend-san-bernardino.md §3. Runs once per
 * direction per invocation since verdict/travel-time depend on destination, while
 * road-state facts (tunnel/col/gothard state) are shared — see packages/core/src/events.ts.
 *
 * Persistence-over-2-polls (fonctionnalites-natives-san-bernardino.md §2 transversal rule):
 * event detection compares against the last CONFIRMED snapshot (snapshots.is_baseline),
 * not the immediately preceding raw poll. If it just compared adjacent raw polls, a
 * transition could only ever be observed once — the poll right after a change already has
 * the new value as its own "previous", so the delta vanishes and a same-key event could
 * never recur to get confirmed. Pinning the baseline until a candidate is confirmed twice
 * (and self-healing back to zero candidates if the data reverts) is what actually
 * implements the "wait for 2 consecutive identical readings" rule from the spec.
 *
 * Real push sending: Android via FCM HTTP v1 (supabase/functions/_shared/fcm.ts) when the
 * FIREBASE_SERVICE_ACCOUNT_JSON secret is set; otherwise (or for iOS, not yet built) falls
 * back to a console.log so the anti-spam gates (cooldown/quiet-hours/daily-cap) still get
 * exercised for real without a Firebase project.
 */

const DIRECTIONS = ["suisse", "italie"];
const RETENTION_DAYS = { delay_history: 30, snapshots: 7, notification_log: 7 };

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function confirmPersistence(db, events) {
  const confirmed = [];
  const freshlyUpserted = [];
  for (const ev of events) {
    const { data: existing } = await db.from("event_candidates").select("key").eq("key", ev.key).maybeSingle();
    if (existing) {
      confirmed.push(ev);
      await db.from("event_candidates").delete().eq("key", ev.key);
    } else {
      await db.from("event_candidates").upsert({ key: ev.key, direction: ev.direction, payload: ev.payload });
      freshlyUpserted.push(ev.key);
    }
  }
  return { confirmed, freshlyUpserted };
}

async function fanOut(db, event, firebaseServiceAccount) {
  // Filtered in code rather than via PostgREST jsonb-path containment: supabase-js's
  // .contains() serializes JS arrays as Postgres array literals ({a,b}), which doesn't
  // match a jsonb column/path — it silently returns zero rows instead of erroring.
  const { data: allDevices } = await db.from("devices").select("*");
  const devices = (allDevices ?? []).filter((d) => d.prefs?.directions?.includes(event.direction));

  const sent = [];
  for (const device of devices) {
    if (device.prefs?.types?.[event.type] === false) continue;

    // Scoped by dedup_key (e.g. "verdict:italie:tunnel"), not just type — otherwise an
    // independent "verdict" push for one direction would cool down the other direction's
    // unrelated "verdict" push fired in the same cycle.
    const { data: lastSentRow } = await db
      .from("notification_log")
      .select("sent_at")
      .eq("device_id", device.id)
      .eq("dedup_key", event.key)
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { count: dailyCount } = await db
      .from("notification_log")
      .select("id", { count: "exact", head: true })
      .eq("device_id", device.id)
      .gte("sent_at", daysAgo(1));

    const suppressed = shouldSuppress({
      type: event.type,
      priority: event.priority,
      now: new Date(),
      quietHours: device.prefs?.quiet_hours,
      lastSentAt: lastSentRow ? new Date(lastSentRow.sent_at) : null,
      dailyCount: dailyCount ?? 0,
    });
    if (suppressed) continue;

    const payload = buildPushPayload(event);
    if (firebaseServiceAccount && device.platform === "android") {
      const result = await sendFcmPush(firebaseServiceAccount, device.push_token, payload);
      if (!result.ok) console.error(`[push:fcm] send failed for device ${device.id}`, result.error);
    } else {
      // iOS/APNs isn't built yet (fonctionnalites-natives-san-bernardino.md §6) and this is
      // also the fallback when no Firebase project is configured — anti-spam gates above
      // still run for real either way, only the transport is a log line here.
      console.log(`[push:${device.platform}] -> ${device.id}`, JSON.stringify(payload));
    }
    await db.from("notification_log").insert({ device_id: device.id, type: event.type, dedup_key: event.key });
    sent.push(device.id);
  }
  return sent;
}

function liveOrMock(value) {
  return value === "live" ? "live" : value === "mock" ? "mock" : undefined;
}

async function readCachedRoadStatus(db) {
  const { data, error } = await db.from("road_status_cache").select("raw, fetched_at").eq("id", 1).maybeSingle();
  if (error) throw new Error(`road_status_cache read failed: ${error.message}`);
  if (!data) throw new Error("road_status_cache is empty — has refresh-road-status run yet?");
  return data.raw;
}

function buildProviderEnv(body, db) {
  return {
    DATA_SOURCE: Deno.env.get("DATA_SOURCE") === "live" ? "live" : "mock",
    // Per-provider overrides let Phase 11 sub-tasks (real Viasuisse, real Routes) ship
    // independently — e.g. ROUTES_DATA_SOURCE=live while Viasuisse is still mocked.
    VIASUISSE_DATA_SOURCE: liveOrMock(Deno.env.get("VIASUISSE_DATA_SOURCE")),
    ROUTES_DATA_SOURCE: liveOrMock(Deno.env.get("ROUTES_DATA_SOURCE")),
    MOCK_SCENARIO: body.scenario,
    VIASUISSE_READ_CACHE: () => readCachedRoadStatus(db),
    GOOGLE_ROUTES_API_KEY: Deno.env.get("GOOGLE_ROUTES_API_KEY"),
  };
}

async function processDirection(db, direction, viasuisseRaw, providerEnv, capturedAt, firebaseServiceAccount) {
  const routesProvider = getRoutesProvider(providerEnv);
  const routesRaw = await routesProvider.fetchGoogleRoutes(direction);
  const snapshot = normalize(viasuisseRaw, routesRaw, direction, capturedAt);
  const curr = evaluate(snapshot);

  const { data: baselineRows } = await db
    .from("snapshots")
    .select("id, raw")
    .eq("direction", direction)
    .eq("is_baseline", true)
    .limit(1);
  const baselineRow = baselineRows && baselineRows[0] ? baselineRows[0] : null;
  const baseline = baselineRow ? evaluate(baselineRow.raw) : null;

  const { data: insertedRow, error: insertError } = await db
    .from("snapshots")
    .insert({
      captured_at: capturedAt,
      direction,
      tunnel_state: snapshot.tunnel.state,
      tunnel_total: snapshot.tunnel.totalMin,
      tunnel_detail: snapshot.tunnel.detail ?? null,
      col_state: snapshot.col.state,
      col_total: snapshot.col.totalMin,
      col_detail: snapshot.col.detail ?? null,
      col_seasonal_open: snapshot.col.seasonal ?? null,
      gothard_state: snapshot.gothard?.state ?? null,
      gothard_total: snapshot.gothard?.totalMin ?? null,
      gothard_detail: snapshot.gothard?.detail ?? null,
      verdict: curr.verdict,
      saturated: curr.saturated,
      raw: snapshot,
    })
    .select("id")
    .single();

  if (insertError) {
    throw new Error(`snapshots insert failed for ${direction}: ${JSON.stringify(insertError)}`);
  }

  for (const route of ["tunnel", "col", "gothard"]) {
    const delay = curr.delays[route];
    if (delay == null) continue;
    await db.from("delay_history").insert({ captured_at: capturedAt, direction, route, delay_min: delay });
  }

  let rawEvents = [];
  let confirmed = [];

  // Known limitation: baseline is one whole-snapshot value, but confirmation is naturally
  // per-event-key. If two independent events are both mid-confirmation (e.g. verdict AND
  // tunnel_closed both first-seen this poll) and only one of them confirms before the
  // underlying data shifts to a THIRD state, the baseline jumps straight to that third
  // state and the other event's pending candidate can never be re-derived — it silently
  // never fires. This requires 3 distinct scenario states within 2 consecutive polls to
  // trigger, which real ~3-5min Viasuisse polling essentially never does (state changes
  // that fast are exactly the noise this whole persistence mechanism exists to filter).
  // Fixing it fully means tracking confirmation per event-key rather than one shared
  // baseline snapshot — a bigger redesign than this MVP anti-spam system warrants.
  if (baseline === null) {
    // First-ever poll for this direction: adopt immediately, nothing to compare against yet.
    await db.from("snapshots").update({ is_baseline: true }).eq("id", insertedRow.id);
  } else {
    rawEvents = detectEvents(baseline, curr);
    if (rawEvents.length > 0) {
      const result = await confirmPersistence(db, rawEvents);
      confirmed = result.confirmed;
      if (confirmed.length > 0) {
        await db.from("snapshots").update({ is_baseline: false }).eq("id", baselineRow.id);
        await db.from("snapshots").update({ is_baseline: true }).eq("id", insertedRow.id);
        // Baseline moved — candidates left over from a PRIOR poll (computed against the now-
        // superseded old baseline) are stale. Candidates upserted THIS SAME poll are not —
        // they're other events from the same batch still on their first occurrence, and
        // still deserve their chance at a second confirmation next poll.
        let deleteStale = db.from("event_candidates").delete().eq("direction", direction);
        if (result.freshlyUpserted.length > 0) {
          deleteStale = deleteStale.not("key", "in", `(${result.freshlyUpserted.map((k) => `"${k}"`).join(",")})`);
        }
        await deleteStale;
      }
    } else {
      // curr matches the baseline exactly — self-heal: drop any candidates left over from a
      // one-off glitchy reading that never repeated.
      await db.from("event_candidates").delete().eq("direction", direction);
    }
  }

  const sentByEvent = {};
  for (const ev of confirmed) {
    sentByEvent[ev.key] = await fanOut(db, ev, firebaseServiceAccount);
  }

  return {
    direction,
    verdict: curr.verdict,
    saturated: curr.saturated,
    candidateEvents: rawEvents.map((e) => e.key),
    confirmedEvents: confirmed.map((e) => e.key),
    sent: sentByEvent,
  };
}

Deno.serve(async (req) => {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && req.headers.get("x-cron-secret") !== cronSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    let body = {};
    try {
      body = await req.json();
    } catch {
      // empty/absent body is fine — real cron invocations won't send one
    }

    const db = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
    const providerEnv = buildProviderEnv(body, db);

    const rawServiceAccount = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
    let firebaseServiceAccount = null;
    if (rawServiceAccount) {
      try {
        firebaseServiceAccount = JSON.parse(rawServiceAccount);
      } catch (err) {
        // A malformed secret must degrade to "no push notifications" (same as unset), not
        // crash the whole poll — this took down snapshot writing entirely for hours in
        // production before this guard existed.
        console.error("[poll] FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON, disabling push for this run", err);
      }
    }

    const viasuisseProvider = getViasuisseProvider(providerEnv);
    const viasuisseRaw = await viasuisseProvider.fetchViasuisse();
    const capturedAt = new Date().toISOString();

    const perDirection = [];
    for (const direction of DIRECTIONS) {
      perDirection.push(await processDirection(db, direction, viasuisseRaw, providerEnv, capturedAt, firebaseServiceAccount));
    }

    await db.from("delay_history").delete().lt("captured_at", daysAgo(RETENTION_DAYS.delay_history));
    await db.from("snapshots").delete().lt("captured_at", daysAgo(RETENTION_DAYS.snapshots)).eq("is_baseline", false);
    await db.from("notification_log").delete().lt("sent_at", daysAgo(RETENTION_DAYS.notification_log));

    return new Response(JSON.stringify({ ok: true, capturedAt, results: perDirection }), {
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    // Previously any exception anywhere in this handler propagated uncaught, and the Edge
    // Runtime's own fallback returned a bare "Internal Server Error" with zero diagnostic
    // info — undiagnosable from outside without digging through analytics log queries.
    console.error("[poll] unhandled error", err);
    return new Response(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
});
