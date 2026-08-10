import type { Direction, EvaluatedSnapshot, RouteInfo, RoutesSnapshot, Verdict } from "@san-bernardino/core";
import { API_BASE, SUPABASE_ANON_KEY } from "./env";

export interface StateResponse {
  updatedAt: string;
  direction: Direction;
  routes: { tunnel: RouteInfo; col: RouteInfo; gothard?: RouteInfo };
  verdict: Verdict;
  saturated: boolean;
  reason: string;
  delays: EvaluatedSnapshot["delays"];
}

function authHeaders() {
  return { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };
}

export async function fetchState(direction: Direction, signal?: AbortSignal): Promise<StateResponse> {
  const res = await fetch(`${API_BASE}/state?dir=${direction}`, { headers: authHeaders(), signal });
  if (!res.ok) throw new Error(`state fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchHistory(
  direction: Direction,
  route: "tunnel" | "col" | "gothard",
  hours = 3,
  signal?: AbortSignal,
): Promise<number[]> {
  const res = await fetch(`${API_BASE}/history?route=${route}&dir=${direction}&hours=${hours}`, {
    headers: authHeaders(),
    signal,
  });
  if (!res.ok) throw new Error(`history fetch failed: ${res.status}`);
  const data: { points: Array<{ t: string; delay: number }> } = await res.json();
  return data.points.map((p) => p.delay);
}

/** /api/state already returns decide()'s output — this just reshapes it into the same
 * EvaluatedSnapshot shape packages/core produces, so the UI never recomputes the verdict
 * itself (backend-san-bernardino.md §4 single-source-of-truth). */
export function toEvaluatedSnapshot(state: StateResponse): EvaluatedSnapshot {
  const snapshot: RoutesSnapshot = {
    updatedAt: state.updatedAt,
    direction: state.direction,
    tunnel: state.routes.tunnel,
    col: state.routes.col,
    ...(state.routes.gothard ? { gothard: state.routes.gothard } : {}),
  };
  return {
    snapshot,
    verdict: state.verdict,
    saturated: state.saturated,
    reason: state.reason,
    delays: state.delays,
    gothardWorthIt: state.verdict === "gothard",
  };
}
