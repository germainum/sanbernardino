import type { EvaluatedSnapshot, RouteInfo, RoutesSnapshot, Verdict } from "@san-bernardino/core";
import type { Dictionary } from "../i18n";

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
export function axisConditionWord(evaluated: EvaluatedSnapshot, t: Dictionary): string {
  if (evaluated.saturated) return t.axisCondition.saturated;
  const anyIssue = evaluated.snapshot.tunnel.state !== "go" || evaluated.snapshot.col.state !== "go";
  return anyIssue ? t.axisCondition.heavy : t.axisCondition.fluid;
}

export function closedColMessage(col: RouteInfo, t: Dictionary): string {
  return col.detail || t.comparison.colClosedFallback;
}
