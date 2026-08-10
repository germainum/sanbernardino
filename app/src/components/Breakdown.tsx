import { C } from "../theme";

export interface BreakdownRow {
  name: string;
  base: number;
  delay: number | null;
  total: number | null;
  recommended: boolean;
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
      {rows.map((r) => (
        <div
          key={r.name}
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr 1fr 1fr",
            alignItems: "center",
            padding: "11px 12px",
            borderRadius: 14,
            background: r.recommended ? "rgba(143,203,46,0.10)" : "transparent",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{r.name}</span>
          <span style={{ textAlign: "right", fontSize: 13, color: C.muted, fontWeight: 600 }}>{r.base} min</span>
          <span style={{ textAlign: "right", fontSize: 13, fontWeight: 700, color: r.delay ? C.coral : C.muted }}>
            {r.delay == null ? "—" : r.delay ? "+" + r.delay : "0"}
            {r.delay == null ? "" : " min"}
          </span>
          <span style={{ textAlign: "right", fontSize: 14, fontWeight: 800, color: C.ink }}>{r.total == null ? "—" : r.total + " min"}</span>
        </div>
      ))}
    </div>
  );
}
