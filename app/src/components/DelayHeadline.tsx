import type { RouteKey } from "@san-bernardino/core";
import { C } from "../theme";

interface DelayHeadlineProps {
  route: Extract<RouteKey, "tunnel" | "col">;
  delay: number | null;
}

export function DelayHeadline({ route, delay }: DelayHeadlineProps) {
  const label = route === "tunnel" ? "Tunnel" : "Col";
  const desc =
    delay == null
      ? "Route fermée"
      : delay === 0
        ? "Trafic faible"
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
        boxShadow: "0 4px 16px rgba(24,39,28,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: C.muted }}>RETARD ACTUEL · {label.toUpperCase()}</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>{desc}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1, color: delay ? (delay < 40 ? C.amber : C.coral) : C.limeDeep }}>
          {delay == null ? "—" : delay}
          <span style={{ fontSize: 18, color: C.muted, fontWeight: 700 }}>{delay == null ? "" : " min"}</span>
        </div>
      </div>
    </div>
  );
}
