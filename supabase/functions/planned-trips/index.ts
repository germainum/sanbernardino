import { json, handleOptions } from "../_shared/http.ts";
import { serviceClient } from "../_shared/db.ts";

/** POST /api/planned-trips { device_id, direction, depart_at } — per backend-san-bernardino.md §4. */
Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, { status: 405 });

  const body = await req.json().catch(() => ({}));
  if (!body.device_id || !body.direction || !body.depart_at) {
    return json({ error: "device_id, direction and depart_at are required" }, { status: 400 });
  }

  const db = serviceClient();
  const { data, error } = await db
    .from("planned_trips")
    .insert({ device_id: body.device_id, direction: body.direction, depart_at: body.depart_at })
    .select()
    .single();

  if (error) return json({ error: error.message }, { status: 500 });
  return json(data, { status: 201 });
});
