import { CLEARED_THRESHOLD_MIN, JAM_THRESHOLDS_MIN } from "./constants.js";
import type { DetectedEvent, EvaluatedSnapshot } from "./types.js";

/**
 * Ported from fonctionnalites-natives-san-bernardino.md §7. Compares two consecutive
 * evaluated snapshots and returns the transitions worth notifying about. `prev` is null
 * on the very first poll (nothing to compare against yet).
 *
 * Only implements the 6 transitions the spec gives concrete pseudocode for (#1-#6 of its
 * trigger table). "restriction" (#7) has no concrete trigger condition in the spec and
 * "planned trip reminder" (#8) is a scheduled check, not a diff — both are out of scope here.
 *
 * Every returned event still needs persistence-over-2-polls confirmation (event_candidates)
 * before it's actually sent — that's the caller's job (backend-san-bernardino.md §3.1).
 */
export function detectEvents(prev: EvaluatedSnapshot | null, curr: EvaluatedSnapshot): DetectedEvent[] {
  const events: DetectedEvent[] = [];
  const direction = curr.snapshot.direction;

  if (prev == null) return events;

  // 1. Verdict change
  if (prev.verdict !== curr.verdict) {
    events.push({
      key: `verdict:${direction}:${curr.verdict}`,
      type: "verdict",
      direction,
      priority: "high",
      payload: { from: prev.verdict, to: curr.verdict, snapshot: curr.snapshot, reason: curr.reason },
    });
  }

  // 2. Col opening
  if (prev.snapshot.col.state === "stop" && curr.snapshot.col.state !== "stop") {
    events.push({
      key: `col_open:${direction}`,
      type: "col_open",
      direction,
      priority: "high",
      payload: { detail: curr.snapshot.col.detail },
    });
  }

  // 3. Tunnel closure
  if (prev.snapshot.tunnel.state !== "stop" && curr.snapshot.tunnel.state === "stop") {
    events.push({
      key: `tunnel_closed:${direction}`,
      type: "tunnel_closed",
      direction,
      priority: "high",
      payload: { detail: curr.snapshot.tunnel.detail },
    });
  }

  // 4. Jam thresholds crossed upward (tunnel only, per spec pseudocode)
  const prevTunnelDelay = prev.delays.tunnel ?? null;
  const currTunnelDelay = curr.delays.tunnel ?? null;
  if (prevTunnelDelay != null && currTunnelDelay != null) {
    for (const threshold of JAM_THRESHOLDS_MIN) {
      if (prevTunnelDelay < threshold && currTunnelDelay >= threshold) {
        events.push({
          key: `jam_threshold:tunnel:${threshold}:${direction}`,
          type: "jam_threshold",
          direction,
          priority: "medium",
          payload: { route: "tunnel", threshold, delay: currTunnelDelay },
        });
      }
    }
  }

  // 5. Gothard detour becomes worthwhile
  if (!prev.gothardWorthIt && curr.gothardWorthIt && curr.snapshot.gothard) {
    events.push({
      key: `gothard:${direction}`,
      type: "gothard",
      direction,
      priority: "medium",
      payload: { eta: curr.snapshot.gothard.totalMin },
    });
  }

  // 6. Resorption (tunnel delay drops back below threshold)
  if (prevTunnelDelay != null && currTunnelDelay != null) {
    if (prevTunnelDelay >= CLEARED_THRESHOLD_MIN && currTunnelDelay < CLEARED_THRESHOLD_MIN) {
      events.push({
        key: `cleared:tunnel:${direction}`,
        type: "cleared",
        direction,
        priority: "low",
        payload: { route: "tunnel", delay: currTunnelDelay },
      });
    }
  }

  return events;
}
