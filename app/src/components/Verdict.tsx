import type { Direction, EvaluatedSnapshot } from "@san-bernardino/core";
import { deriveColStatus } from "@san-bernardino/core";
import { C, VERDICT_META } from "../theme";
import { StatusLine } from "./StatusLine";
import { axisConditionWord, computeGapMin } from "../lib/comparison";

const DIRECTION_ROUTE_LABELS: Record<Direction, { from: string; to: string }> = {
  italie: { from: "Coire / Zurich", to: "Bellinzone / Italie" },
  suisse: { from: "Bellinzone / Italie", to: "Coire / Zurich" },
};

interface VerdictProps {
  direction: Direction;
  evaluated: EvaluatedSnapshot;
  updatedLabel: string;
  source: string;
  stale: boolean;
}

export function Verdict({ direction, evaluated, updatedLabel, source, stale }: VerdictProps) {
  const { snapshot, verdict, reason } = evaluated;
  const v = VERDICT_META[verdict];
  const { from, to } = DIRECTION_ROUTE_LABELS[direction];
  const gap = computeGapMin(snapshot, verdict);
  const colStatus = snapshot.col.colStatus ?? deriveColStatus(snapshot.col.state);

  return (
    <div
      style={{
        borderRadius: 26,
        padding: 22,
        marginBottom: 16,
        position: "relative",
        overflow: "hidden",
        // Light stop darkened from #6fb03e -> #4f8f35: the original failed WCAG contrast for
        // white text (~2.6:1 solid, ~2.3:1 at 0.85 opacity) even against the large-text 3:1
        // threshold. #4f8f35 holds >=4.5:1 for white text across the whole gradient.
        background: "linear-gradient(160deg,#2b5236 0%,#3f7a3f 55%,#4f8f35 100%)",
        boxShadow: "0 12px 30px rgba(34,67,46,0.28)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.5,
          pointerEvents: "none",
          background: "radial-gradient(70% 50% at 80% 0%, rgba(255,255,255,0.25), transparent 60%)",
        }}
      />
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 700 }}>{from}</span>
          <span style={{ color: C.lime }}>→</span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 700 }}>{to}</span>
        </div>

        <StatusLine colStatus={colStatus} conditionWord={axisConditionWord(evaluated)} updatedLabel={updatedLabel} source={source} stale={stale} />

        <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: 999, background: v.chipBg, color: v.chipInk, fontSize: 12, fontWeight: 800, marginBottom: 12 }}>
          {v.chip}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: "#fff", lineHeight: 1.05 }}>{v.title}</h1>
          {gap != null && (
            <span style={{ fontSize: 20, fontWeight: 800, color: C.lime }}>
              -{gap} <span style={{ fontSize: 14, fontWeight: 700 }}>min</span>
            </span>
          )}
        </div>
        <p style={{ margin: "12px 0 0", fontSize: 14.5, lineHeight: 1.5, color: "rgba(255,255,255,0.9)" }}>{reason}</p>
      </div>
    </div>
  );
}
