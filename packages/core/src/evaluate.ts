import { BASE } from "./constants.js";
import { decide } from "./decide.js";
import type { EvaluatedSnapshot, RouteKey, RoutesSnapshot } from "./types.js";

/**
 * delay = max(0, total - base), per prompt-implementation-san-bernardino.md §4. Never negative.
 * `baseMin` defaults to constants.BASE[route] but should be passed explicitly from the
 * snapshot (snapshot.<route>.baseMin) once normalize() has picked a per-poll baseMin — e.g.
 * RealRoutesProvider's traffic-free reference time — instead of the constant, so delay
 * reflects "slower than usual right now" rather than "longer than a short mock baseline".
 */
export function delayOf(route: RouteKey, totalMin: number | null | undefined, baseMin: number = BASE[route]): number | null {
  if (totalMin == null) return null;
  return Math.max(0, totalMin - baseMin);
}

/**
 * Runs decide() once and derives every figure detectEvents()/the API needs, so the
 * verdict stays a single source of truth (backend-san-bernardino.md §4).
 */
export function evaluate(snapshot: RoutesSnapshot): EvaluatedSnapshot {
  const result = decide(snapshot);
  const delays: EvaluatedSnapshot["delays"] = {
    tunnel: delayOf("tunnel", snapshot.tunnel.totalMin, snapshot.tunnel.baseMin),
    col: delayOf("col", snapshot.col.totalMin, snapshot.col.baseMin),
  };
  if (snapshot.gothard) {
    delays.gothard = delayOf("gothard", snapshot.gothard.totalMin, snapshot.gothard.baseMin);
  }

  return {
    snapshot,
    verdict: result.verdict,
    saturated: result.saturated,
    reason: result.reason,
    delays,
    // The Gothard detour is "worth it" exactly when decide() recommends it: A13 saturated
    // and the Gothard total is strictly shorter than the best A13 option.
    gothardWorthIt: result.verdict === "gothard",
  };
}
