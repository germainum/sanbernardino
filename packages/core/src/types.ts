export type RouteState = "go" | "caution" | "stop";
export type RouteKey = "tunnel" | "col" | "gothard";
export type Direction = "suisse" | "italie";
export type Verdict = "tunnel" | "col" | "gothard" | "attente";

/**
 * Dedicated open/closed/restricted signal for the col, distinct from the generic
 * `RouteState` (go/caution/stop) which mixes "closed" with "just jammed". Optional because
 * no live provider sets it yet — normalize() derives a fallback from `state` until a real
 * feed (e.g. a richer ASTRA classification) supplies it directly.
 */
export type ColStatus = "open" | "closed" | "restricted";

export interface RouteInfo {
  state: RouteState;
  /** Reference free-flow time in minutes for this route. */
  baseMin: number;
  /** Current total travel time in minutes, including delay. null if the route has no ETA (e.g. closed). */
  totalMin: number | null;
  detail?: string;
  seasonal?: boolean;
  /** Extra minutes the Gothard detour adds versus a direct A13 crossing. */
  detourMin?: number;
  /** Col only. See ColStatus. */
  colStatus?: ColStatus;
}

export interface RoutesSnapshot {
  updatedAt: string;
  direction: Direction;
  tunnel: RouteInfo;
  col: RouteInfo;
  gothard?: RouteInfo;
}

export interface DecideResult {
  verdict: Verdict;
  saturated: boolean;
  reason: string;
}

/** A snapshot enriched with the decision and derived figures, shared by the API and the event detector. */
export interface EvaluatedSnapshot {
  snapshot: RoutesSnapshot;
  verdict: Verdict;
  saturated: boolean;
  reason: string;
  delays: Partial<Record<RouteKey, number | null>>;
  gothardWorthIt: boolean;
}

export type EventType =
  | "verdict"
  | "col_open"
  | "tunnel_closed"
  | "jam_threshold"
  | "gothard"
  | "cleared"
  | "restriction";

export type EventPriority = "high" | "medium" | "low" | "contextual";

export interface DetectedEvent {
  /** Stable identity for persistence/dedup — e.g. "verdict:italie" or "jam_threshold:tunnel:40". */
  key: string;
  type: EventType;
  direction: Direction;
  priority: EventPriority;
  payload: Record<string, unknown>;
}

/** Raw road-status payload as returned by the Viasuisse provider, before normalization. */
export interface ViasuisseRaw {
  tunnel: { state: RouteState; detail?: string };
  col: { state: RouteState; detail?: string; seasonal?: boolean; colStatus?: ColStatus };
  gothard?: { state: RouteState; detail?: string };
}

/** Raw travel-time payload as returned by the Google Routes provider, before normalization. */
export interface RoutesRaw {
  tunnelMin: number | null;
  colMin: number | null;
  gothardMin: number | null;
  gothardDetourMin?: number;
  /**
   * Optional per-route traffic-free reference time (minutes), for providers whose totalMin
   * reflects a real end-to-end trip (so constants.BASE's short local-crossing figures would
   * make delay = total - base meaningless). When set, normalize() uses this instead of
   * constants.BASE for that route's baseMin. Mock providers leave these unset.
   */
  tunnelBaseMin?: number;
  colBaseMin?: number;
  gothardBaseMin?: number;
}
