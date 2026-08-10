import type { RouteInfo } from "@san-bernardino/core";
import { C, STATE } from "../theme";

interface GothardPanelProps {
  gothard: RouteInfo;
  recommended: boolean;
}

export function GothardPanel({ gothard, recommended }: GothardPanelProps) {
  const st = STATE[gothard.state];
  return (
    <div
      style={{
        borderRadius: 22,
        padding: 14,
        marginBottom: 16,
        background: recommended ? "rgba(239,168,58,0.10)" : "rgba(24,39,28,0.04)",
        border: `1.5px ${recommended ? "dashed " + C.amber : "solid " + C.line}`,
        opacity: recommended ? 1 : 0.75,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", color: recommended ? C.amberDeep : C.muted, marginBottom: 10 }}>
        {recommended ? "ITINÉRAIRE ALTERNATIF · A2" : "ALTERNATIVE ÉCARTÉE · A2"}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: st.grad }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>Gothard</div>
          <div style={{ fontSize: 12.5, color: st.color, fontWeight: 600, marginTop: 2 }}>{gothard.detail}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.ink, lineHeight: 1 }}>
            {gothard.totalMin}
            <span style={{ fontSize: 12, color: C.muted }}> min</span>
          </div>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginTop: 2 }}>
            {recommended ? `+${gothard.detourMin} min détour` : "pas plus rapide"}
          </div>
        </div>
      </div>
    </div>
  );
}
