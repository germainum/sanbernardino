import type { RouteKey, RouteState } from "@san-bernardino/core";
import { C } from "../theme";

interface DelayHeadlineProps {
  route: Extract<RouteKey, "tunnel" | "col">;
  state: RouteState;
  delay: number | null;
  totalMin: number | null;
  updatedLabel: string;
  source: string;
  stale: boolean;
}

export function DelayHeadline({ route, state, delay, totalMin, updatedLabel, source, stale }: DelayHeadlineProps) {
  const label = route === "tunnel" ? "Tunnel" : "Col";
  // The road-status feed (state/desc) is the trustworthy local-condition signal; the numeric
  // delay is Google-Routes-derived and mostly reflects shared-highway traffic (tunnel/col
  // share ~95% of the same trip) — so a real local issue is only framed as "delay" when
  // state itself confirms one, not just because the raw number is nonzero.
  const localIssue = state !== "go";
  const desc =
    delay == null
      ? "Route fermée"
      : !localIssue
        ? "Trafic fluide"
        : delay < 20
          ? "Léger ralentissement"
          : delay < 45
            ? "Ralenti"
            : "Fortement chargé";

  return (
    <div
      style={{
        background: C.card,
        borderRadius: 22,
        padding: "18px 20px",
        marginBottom: 16,
        boxShadow: C.shadowCard,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: C.muted }}>RETARD ACTUEL · {label.toUpperCase()}</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>{desc}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          {delay != null && localIssue ? (
            <div aria-live="polite" aria-atomic="true" style={{ fontSize: 40, fontWeight: 800, lineHeight: 1, color: delay < 40 ? C.amber : C.coral }}>
              {delay}
              <span style={{ fontSize: 18, color: C.muted, fontWeight: 700 }}> min</span>
            </div>
          ) : (
            <div aria-live="polite" aria-atomic="true" style={{ fontSize: totalMin != null ? 28 : 40, fontWeight: 800, lineHeight: 1, color: delay == null ? C.muted : C.limeDeep }}>
              {delay == null ? "—" : totalMin}
              {delay != null && totalMin != null && <span style={{ fontSize: 14, color: C.muted, fontWeight: 700 }}> min</span>}
            </div>
          )}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 10,
          paddingTop: 8,
          borderTop: `1px solid ${C.line}`,
          fontSize: 11,
          fontWeight: 600,
          color: stale ? C.amber : C.muted,
        }}
      >
        <span>{stale ? "⚠ " : "● "}{updatedLabel}{stale ? " — à vérifier" : ""}</span>
        <span>{source}</span>
      </div>
    </div>
  );
}
