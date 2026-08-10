import type { RouteInfo } from "@san-bernardino/core";
import { C, STATE } from "../theme";

interface RouteCardProps {
  name: string;
  meta: string;
  data: RouteInfo;
  delay: number | null;
  thumbLabel: string;
  recommended: boolean;
}

export function RouteCard({ name, meta, data, delay, thumbLabel, recommended }: RouteCardProps) {
  const st = STATE[data.state];
  // Tunnel/col share ~95% of the same Google Routes trip, so a nonzero numeric delay often
  // just reflects shared-highway traffic, not a problem specific to this crossing. Only
  // frame it as "de retard" when the real road-status feed (state) confirms a local issue.
  const localIssue = data.state !== "go";
  const delayColor = delay == null ? C.muted : delay === 0 ? C.limeDeep : delay < 40 ? C.amber : C.coral;
  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        alignItems: "center",
        background: C.card,
        borderRadius: 22,
        padding: 12,
        border: `1.5px solid ${recommended ? C.lime : "transparent"}`,
        boxShadow: recommended ? "0 8px 24px rgba(91,156,28,0.18)" : C.shadowCard,
      }}
    >
      <div
        style={{
          width: 74,
          height: 74,
          borderRadius: 16,
          flexShrink: 0,
          background: st.grad,
          display: "flex",
          alignItems: "flex-end",
          padding: 8,
          filter: recommended ? undefined : "grayscale(0.5) opacity(0.85)",
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", opacity: 0.9, textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>{thumbLabel}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 17, fontWeight: recommended ? 800 : 700, color: C.ink, display: "flex", alignItems: "center", gap: 6 }}>
          {recommended && (
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: C.lime,
                color: "#1c3208",
                fontSize: 10,
                fontWeight: 800,
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✓
            </span>
          )}
          <span>{name}</span>
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{meta}</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, padding: "3px 10px", borderRadius: 999, background: st.soft }}>
          {/* Square, not round — a circular dot reads as a toggle knob next to interactive-looking pills. */}
          <span style={{ width: 7, height: 7, borderRadius: 2, background: st.color }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: st.color }}>{data.detail}</span>
        </div>
      </div>
      <div style={{ textAlign: "right", paddingRight: 6 }}>
        {delay != null && localIssue ? (
          <>
            <div style={{ fontSize: 22, fontWeight: 800, color: delayColor, lineHeight: 1 }}>
              {`+${delay}`}
              <span style={{ fontSize: 12, fontWeight: 700 }}> min</span>
            </div>
            <div style={{ fontSize: 10.5, color: C.muted, fontWeight: 600, marginTop: 2 }}>de retard</div>
            {data.totalMin != null && (
              <div style={{ fontSize: 10.5, color: C.muted, marginTop: 3 }}>trajet complet · {data.totalMin} min</div>
            )}
          </>
        ) : data.totalMin != null ? (
          <>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.ink, lineHeight: 1 }}>
              {data.totalMin}
              <span style={{ fontSize: 12, fontWeight: 700 }}> min</span>
            </div>
            <div style={{ fontSize: 10.5, color: C.muted, fontWeight: 600, marginTop: 2 }}>trajet complet</div>
          </>
        ) : (
          <div style={{ fontSize: 15, color: C.muted }}>—</div>
        )}
      </div>
    </div>
  );
}
