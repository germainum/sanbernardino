import type { EvaluatedSnapshot, RouteInfo, RoutesSnapshot, Verdict } from "@san-bernardino/core";

/** null when the verdict isn't a direct tunnel/col pick (gothard/attente) or a total is missing. */
export function computeGapMin(snapshot: RoutesSnapshot, verdict: Verdict): number | null {
  if (verdict !== "tunnel" && verdict !== "col") return null;
  const { tunnel, col } = snapshot;
  if (tunnel.totalMin == null || col.totalMin == null) return null;
  return Math.abs(tunnel.totalMin - col.totalMin);
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
