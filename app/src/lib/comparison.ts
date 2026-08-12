import type { EvaluatedSnapshot, RouteInfo, RoutesSnapshot, Verdict } from "@san-bernardino/core";

type ComparedRoute = "tunnel" | "col";

/** null when the verdict isn't a direct tunnel/col pick (gothard/attente) or a total is missing. */
export function computeGapMin(snapshot: RoutesSnapshot, verdict: Verdict): number | null {
  if (verdict !== "tunnel" && verdict !== "col") return null;
  const { tunnel, col } = snapshot;
  if (tunnel.totalMin == null || col.totalMin == null) return null;
  return Math.abs(tunnel.totalMin - col.totalMin);
}

export function fasterRoute(snapshot: RoutesSnapshot): ComparedRoute | null {
  const { tunnel, col } = snapshot;
  if (tunnel.totalMin == null || col.totalMin == null || tunnel.totalMin === col.totalMin) return null;
  return tunnel.totalMin < col.totalMin ? "tunnel" : "col";
}

const TRAIT: Record<ComparedRoute, string> = { tunnel: "Fiable", col: "Panoramique" };
const COST_CHIP: Record<ComparedRoute, string> = { tunnel: "Vignette", col: "Gratuit" };

/**
 * Exactly 2 chip strings. When the route has a real local issue (state !== "go"), its own
 * detail text replaces the speed/trait chip so the "why" stays visible without opening the
 * detail drawer — same localIssue signal already used elsewhere for delay framing.
 */
export function chipsFor(route: ComparedRoute, snapshot: RoutesSnapshot, faster: ComparedRoute | null): [string, string] {
  const data = snapshot[route];
  const localIssue = data.state !== "go";
  const first = localIssue && data.detail ? data.detail : faster === route ? "Plus rapide" : TRAIT[route];
  return [first, COST_CHIP[route]];
}

/**
 * Aggregate, axis-level word — deliberately never derived from a single route's own detail,
 * so the status line never isolates a delay to just one route.
 */
export function axisConditionWord(evaluated: EvaluatedSnapshot): string {
  if (evaluated.saturated) return "Axe saturé";
  const anyIssue = evaluated.snapshot.tunnel.state !== "go" || evaluated.snapshot.col.state !== "go";
  return anyIssue ? "Trafic chargé" : "Trafic fluide";
}

export function closedColMessage(col: RouteInfo): string {
  return col.detail || "Col fermé";
}
