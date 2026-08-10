import { BASE } from "./constants.js";
import type { Direction, RoutesRaw, RoutesSnapshot, ViasuisseRaw } from "./types.js";

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
    },
    col: {
      state: viasuisse.col.state,
      baseMin: routes.colBaseMin ?? BASE.col,
      totalMin: routes.colMin,
      detail: viasuisse.col.detail,
      seasonal: viasuisse.col.seasonal,
    },
  };

  if (viasuisse.gothard) {
    snapshot.gothard = {
      state: viasuisse.gothard.state,
      baseMin: routes.gothardBaseMin ?? BASE.gothard,
      totalMin: routes.gothardMin,
      detail: viasuisse.gothard.detail,
      detourMin: routes.gothardDetourMin,
    };
  }

  return snapshot;
}
