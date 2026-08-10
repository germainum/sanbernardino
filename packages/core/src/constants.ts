import type { RouteKey } from "./types.js";

/** Free-flow reference times (minutes) — from prompt-implementation-san-bernardino.md §4/§7. */
export const BASE: Record<RouteKey, number> = {
  tunnel: 8,
  col: 34,
  gothard: 42,
};

/** state thresholds from prompt-implementation-san-bernardino.md §4: go <=5, caution 5-40, stop >40 or physically closed. */
export const JAM_GO_MAX_MIN = 5;
export const JAM_STOP_MIN = 40;

/** Jam thresholds that trigger a "jam_threshold" event, per fonctionnalites-natives-san-bernardino.md §2/§7. */
export const JAM_THRESHOLDS_MIN = [20, 40];

/** Delay below which a route is considered "cleared" again, per fonctionnalites-natives-san-bernardino.md §7. */
export const CLEARED_THRESHOLD_MIN = 10;

/** Data older than this is flagged stale on the delay headline card. */
export const STALE_DATA_THRESHOLD_MIN = 15;

/** Below this gap between tunnel/col totals, decide()'s reason text stays balanced instead of directive. */
export const CLOSE_GAP_THRESHOLD_MIN = 15;

/** Cooldowns per event type (minutes), per backend-san-bernardino.md §3.2 and fonctionnalites-natives §5. */
export const COOLDOWN_MIN: Record<string, number> = {
  verdict: 15,
  jam_threshold: 30,
  col_open: 0,
  tunnel_closed: 0,
  gothard: 30,
  cleared: 60,
  restriction: 30,
};

export const DAILY_NOTIFICATION_CAP = 5;
