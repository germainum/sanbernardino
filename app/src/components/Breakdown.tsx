import type { RouteState } from "@san-bernardino/core";
import { C, STATE } from "../theme";

export interface BreakdownRow {
  name: string;
  base: number;
  delay: number | null;
  total: number | null;
  recommended: boolean;
  state: RouteState;
  detail?: string;
  cost?: "vignette" | "gratuit" | null;
  distanceKm?: number | null;
  altitudeM?: number | null;
}

export function Breakdown({ rows }: { rows: BreakdownRow[] }) {
  return (
    <div style={{ background: C.card, borderRadius: 22, padding: "14px 8px 8px", marginBottom: 16, boxShadow: "0 4px 16px rgba(24,39,28,0.06)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr 1fr", padding: "0 12px 8px", fontSize: 10.5, fontWeight: 800, letterSpacing: "0.06em", color: C.muted }}>
        <span>ROUTE</span>
        <span style={{ textAlign: "right" }}>BASE</span>
        <span style={{ textAlign: "right" }}>RETARD</span>
        <span style={{ textAlign: "right" }}>TOTAL</span>
      </div>
      {rows.map((r) => {
        const st = STATE[r.state];
        const hasMeta = r.cost != null || r.distanceKm != null || r.altitudeM != null || r.detail;
        return (
          <div
            key={r.name}
            style={{
              padding: "11px 12px",
              borderRadius: 14,
              background: r.recommended ? "rgba(143,203,46,0.10)" : "transparent",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr 1fr", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{r.name}</span>
              <span style={{ textAlign: "right", fontSize: 13, color: C.muted, fontWeight: 600 }}>{r.base} min</span>
              <span style={{ textAlign: "right", fontSize: 13, fontWeight: 700, color: r.delay ? C.coral : C.muted }}>
                {r.delay == null ? "—" : r.delay ? "+" + r.delay : "0"}
                {r.delay == null ? "" : " min"}
              </span>
              <span style={{ textAlign: "right", fontSize: 14, fontWeight: 800, color: C.ink }}>{r.total == null ? "—" : r.total + " min"}</span>
            </div>
            {hasMeta && (
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginTop: 6 }}>
                {r.cost && (
                  <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{r.cost === "vignette" ? "🎫 Vignette" : "🆓 Gratuit"}</span>
                )}
                {r.distanceKm != null && <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>📏 {r.distanceKm} km</span>}
                {r.altitudeM != null && <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>⛰ {r.altitudeM} m</span>}
                {r.detail && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: st.color, fontWeight: 600 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: st.color }} />
                    {r.detail}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
