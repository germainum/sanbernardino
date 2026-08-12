import { BASE } from "./constants.js";
import type { ColStatus, Direction, RouteState, RoutesRaw, RoutesSnapshot, ViasuisseRaw } from "./types.js";

/**
 * Fallback col open/closed/restricted derivation for providers that don't yet set
 * `colStatus` directly. Deliberately takes only `state` — NOT `seasonal`, which
 * astraDatex2.ts currently sets to `true` unconditionally (summer or winter) as a static
 * note, not a live signal. Using it here would mislabel a plain jam as a seasonal closure.
 */
export function deriveColStatus(state: RouteState): ColStatus {
  if (state === "stop") return "closed";
  if (state === "caution") return "restricted";
  return "open";
}

/**
 * Combines the Viasuisse road-status payload with Google Routes travel times into the
 * normalized snapshot shape shared by decide(), detectEvents(), and the UI
 * (prompt-implementation-san-bernardino.md §4, backend-san-bernardino.md §3 `curr`).
 *
 * Deriving `state` from jam length/closures is the responsibility of each concrete
 * ViasuisseProvider (mock or real) before this function runs — normalize() only combines
 * already-derived states with travel times.
 */
export function normalize(
  viasuisse: ViasuisseRaw,
  routes: RoutesRaw,
  direction: Direction,
  updatedAt: string,
): RoutesSnapshot {
  const snapshot: RoutesSnapshot = {
    updatedAt,
    direction,
    tunnel: {
      state: viasuisse.tunnel.state,
      baseMin: routes.tunnelBaseMin ?? BASE.tunnel,
      totalMin: routes.tunnelMin,
      detail: viasuisse.tunnel.detail,
      polyline: routes.tunnelPolyline,
    },
    col: {
      state: viasuisse.col.state,
      baseMin: routes.colBaseMin ?? BASE.col,
      totalMin: routes.colMin,
      detail: viasuisse.col.detail,
      seasonal: viasuisse.col.seasonal,
      colStatus: viasuisse.col.colStatus ?? deriveColStatus(viasuisse.col.state),
      polyline: routes.colPolyline,
    },
  };

  if (viasuisse.gothard) {
    snapshot.gothard = {
      state: viasuisse.gothard.state,
      baseMin: routes.gothardBaseMin ?? BASE.gothard,
      totalMin: routes.gothardMin,
      detail: viasuisse.gothard.detail,
      detourMin: routes.gothardDetourMin,
      polyline: routes.gothardPolyline,
    };
  }

  return snapshot;
}
