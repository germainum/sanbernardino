import { json, handleOptions } from "../_shared/http.ts";

/**
 * POST /api/iap/validate { device_id, receipt } — per backend-san-bernardino.md §4 and
 * addendum-monetisation-san-bernardino.md §5. Stubbed until Phase 11: real implementation
 * verifies the Google Play purchase token via the Play Developer API
 * (https://developer.android.com/google/play/billing/getting-ready#verify) — which needs a
 * Google Play Developer account and a linked service account — before ever setting
 * devices.remove_ads = true. Never trust a client-asserted "I paid" without that check.
 */
Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, { status: 405 });

  return json(
    {
      remove_ads: false,
      status: "not_implemented",
      message: "Server-side Google Play receipt validation lands in Phase 11, once a Play Developer account exists.",
    },
    { status: 501 },
  );
});
