import { evaluate } from "../../../packages/core/dist/index.js";
import { json, handleOptions } from "../_shared/http.ts";
import { serviceClient } from "../_shared/db.ts";

/**
 * GET /api/state?dir=italie|suisse — per backend-san-bernardino.md §4. Returns the most
 * recent raw poll for the direction (freshest data for the screen), with the verdict
 * computed live via evaluate() so this stays the same single source of truth the poll
 * function's event detection uses — never a separately-maintained copy of decide().
 */
Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  if (req.method !== "GET") return json({ error: "method_not_allowed" }, { status: 405 });

  const url = new URL(req.url);
  const direction = url.searchParams.get("dir") === "suisse" ? "suisse" : "italie";

  const db = serviceClient();
  const { data: row, error } = await db
    .from("snapshots")
    .select("raw")
    .eq("direction", direction)
    .order("captured_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return json({ error: error.message }, { status: 500 });
  if (!row) return json({ error: "no_data_yet" }, { status: 503 });

  const snapshot = row.raw;
  const evaluated = evaluate(snapshot);

  return json({
    updatedAt: snapshot.updatedAt,
    direction: snapshot.direction,
    routes: {
      tunnel: snapshot.tunnel,
      col: snapshot.col,
      ...(snapshot.gothard ? { gothard: snapshot.gothard } : {}),
    },
    verdict: evaluated.verdict,
    saturated: evaluated.saturated,
    reason: evaluated.reason,
    delays: evaluated.delays,
  });
});
