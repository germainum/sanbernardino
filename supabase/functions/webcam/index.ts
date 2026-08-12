import { CORS_HEADERS, handleOptions, json } from "../_shared/http.ts";

/**
 * GET /api/webcam?webcamId=... — relays Windy Webcams API v3 to the client, injecting the
 * x-windy-api-key header from the WINDY_KEY secret so it never reaches the browser bundle.
 * Also accepts ?nearby=lat,lng,radiusKm (instead of webcamId) for the one-off lookup used to
 * find a real webcam id near a location — the running app only ever passes webcamId.
 *
 * The response body/status are passed through as-is (including Windy's own 401/404), so the
 * client can tell "key not active yet" apart from "wrong webcam id" instead of both collapsing
 * into one generic failure.
 */
const WINDY_BASE = "https://api.windy.com/webcams/api/v3/webcams";

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  if (req.method !== "GET") return json({ error: "method_not_allowed" }, { status: 405 });

  const apiKey = Deno.env.get("WINDY_KEY");
  if (!apiKey) {
    // TODO: once a Windy Webcams API key exists, set it with:
    //   supabase secrets set WINDY_KEY=... --project-ref phkeefhmoonzdwkjzxwa
    // (and add WINDY_KEY=... to supabase/functions/.env.local for local dev via `supabase functions serve`).
    return json({ error: "windy_key_not_configured" }, { status: 503 });
  }

  const url = new URL(req.url);
  const webcamId = url.searchParams.get("webcamId");
  const nearby = url.searchParams.get("nearby");
  const include = url.searchParams.get("include") ?? "images,location";

  if (!webcamId && !nearby) {
    return json({ error: "webcamId_or_nearby_required" }, { status: 400 });
  }

  const target = new URL(webcamId ? `${WINDY_BASE}/${webcamId}` : WINDY_BASE);
  target.searchParams.set("include", include);
  if (!webcamId && nearby) target.searchParams.set("nearby", nearby);

  let upstream: Response;
  try {
    upstream = await fetch(target, { headers: { "x-windy-api-key": apiKey } });
  } catch {
    return json({ error: "windy_unreachable" }, { status: 502 });
  }

  const body = await upstream.text();
  return new Response(body, { status: upstream.status, headers: { "content-type": "application/json", ...CORS_HEADERS } });
});
