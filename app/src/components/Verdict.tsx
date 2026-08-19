import type { Direction, EvaluatedSnapshot } from "@san-bernardino/core";
import { deriveColStatus } from "@san-bernardino/core";
import { C, VERDICT_META } from "../theme";
import { StatusLine } from "./StatusLine";
import { axisConditionWord, computeGapMin } from "../lib/comparison";
import { useLang, type Dictionary } from "../i18n";

/**
 * Hero-only sentence, deliberately independent of decide()'s `reason` text (which stays
 * number-bearing and tested elsewhere — notifications reuse it). The hero already carries
 * the decisive gap as its own "-X min" badge, so repeating the number in prose here reads
 * as redundant, and "un peu plus rapide" undercuts the badge's decisive tone right next to
 * it. No numbers here on purpose — the badge is the only place the gap appears.
 */
function heroSentence(evaluated: EvaluatedSnapshot, t: Dictionary): string {
  const { snapshot, verdict } = evaluated;
  const condition = axisConditionWord(evaluated, t);

  if (verdict === "tunnel") {
    return `${condition}. ${snapshot.col.state === "stop" ? t.verdict.heroTunnelColClosed : t.verdict.heroTunnelColOpen}`;
  }
  if (verdict === "col") {
    return `${condition}. ${snapshot.tunnel.state === "stop" ? t.verdict.heroColTunnelClosed : t.verdict.heroColTunnelOpen}`;
  }
  if (verdict === "gothard") {
    return `${condition}. ${t.verdict.heroGothard}`;
  }
  return `${condition}. ${t.verdict.heroAttente}`;
}

interface VerdictProps {
  direction: Direction;
  evaluated: EvaluatedSnapshot;
  updatedLabel: string;
  source: string;
  stale: boolean;
}

export function Verdict({ direction, evaluated, updatedLabel, source, stale }: VerdictProps) {
  const { t } = useLang();
  const { snapshot, verdict } = evaluated;
  const v = VERDICT_META[verdict];
  const { from, to } = t.verdict.route[direction];
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
        // Solid near-black (palette pivot from the old dark-green gradient) — white text
        // holds ~17:1 here, comfortably clearing WCAG AA's 4.5:1 with a lot of headroom.
        background: C.dark,
        boxShadow: "0 12px 30px rgba(0,0,0,0.32)",
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
          <span style={{ color: C.mustard }} aria-hidden="true">→</span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 700 }}>{to}</span>
        </div>

        <StatusLine colStatus={colStatus} conditionWord={axisConditionWord(evaluated, t)} updatedLabel={updatedLabel} source={source} stale={stale} />

        <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: 999, background: v.chipBg, color: v.chipInk, fontSize: 12, fontWeight: 800, marginBottom: 12 }}>
          {t.verdict.chip[verdict]}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: "#fff", lineHeight: 1.05 }}>{t.verdict.title[verdict]}</h1>
          {gap != null && (
            <span style={{ fontSize: 20, fontWeight: 800, color: C.mustard }}>
              -{gap} <span style={{ fontSize: 14, fontWeight: 700 }}>{t.common.min}</span>
            </span>
          )}
        </div>
        <p style={{ margin: "12px 0 0", fontSize: 14.5, lineHeight: 1.5, color: "rgba(255,255,255,0.9)" }}>{heroSentence(evaluated, t)}</p>
      </div>
    </div>
  );
}
