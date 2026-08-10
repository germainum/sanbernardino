import { json, handleOptions } from "../_shared/http.ts";
import { serviceClient } from "../_shared/db.ts";

const VALID_ROUTES = ["tunnel", "col", "gothard"];

/**
 * GET /api/history?route=tunnel&hours=3&dir=italie — per backend-san-bernardino.md §4.
 * `t` is returned as an ISO timestamp rather than a pre-formatted "HH:mm" string so the
 * client formats it in the user's own locale/timezone instead of baking in a server-side
 * assumption.
 */
Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  if (req.method !== "GET") return json({ error: "method_not_allowed" }, { status: 405 });

  const url = new URL(req.url);
  const route = url.searchParams.get("route") ?? "tunnel";
  const direction = url.searchParams.get("dir") === "suisse" ? "suisse" : "italie";
  const hours = Number(url.searchParams.get("hours") ?? "3");

  if (!VALID_ROUTES.includes(route)) {
    return json({ error: `invalid route, expected one of ${VALID_ROUTES.join(", ")}` }, { status: 400 });
  }
  if (!Number.isFinite(hours) || hours <= 0) {
    return json({ error: "hours must be a positive number" }, { status: 400 });
  }

  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const db = serviceClient();
  const { data, error } = await db
    .from("delay_history")
    .select("captured_at, delay_min")
    .eq("route", route)
    .eq("direction", direction)
    .gte("captured_at", since)
    .order("captured_at", { ascending: true });

  if (error) return json({ error: error.message }, { status: 500 });

  return json({
    route,
    direction,
    points: (data ?? []).map((r) => ({ t: r.captured_at, delay: r.delay_min })),
  });
});
