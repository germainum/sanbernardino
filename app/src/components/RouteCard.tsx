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
        boxShadow: recommended ? "0 8px 24px rgba(91,156,28,0.18)" : "0 4px 16px rgba(24,39,28,0.06)",
      }}
    >
      <div style={{ width: 74, height: 74, borderRadius: 16, flexShrink: 0, background: st.grad, display: "flex", alignItems: "flex-end", padding: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", opacity: 0.9, textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>{thumbLabel}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.ink }}>{name}</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{meta}</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, padding: "3px 10px", borderRadius: 999, background: st.soft }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: st.color }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: st.color }}>{data.detail}</span>
        </div>
      </div>
      <div style={{ textAlign: "right", paddingRight: 6 }}>
        {delay != null ? (
          <>
            <div style={{ fontSize: 22, fontWeight: 800, color: delayColor, lineHeight: 1 }}>
              {delay === 0 ? "0" : `+${delay}`}
              <span style={{ fontSize: 12, fontWeight: 700 }}> min</span>
            </div>
            <div style={{ fontSize: 10.5, color: C.muted, fontWeight: 600, marginTop: 2 }}>de retard</div>
            {data.totalMin != null && (
              <div style={{ fontSize: 10.5, color: C.muted, marginTop: 3 }}>trajet complet · {data.totalMin} min</div>
            )}
          </>
        ) : (
          <div style={{ fontSize: 15, color: C.muted }}>—</div>
        )}
      </div>
    </div>
  );
}
