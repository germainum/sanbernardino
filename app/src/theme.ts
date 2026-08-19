import type { RouteState } from "@san-bernardino/core";

/**
 * Design tokens. Pivoted 2026-08-12 from the original alpine-green identity
 * (prompt-implementation-san-bernardino.md §7) to a mustard/dark/cream identity per a
 * reference mockup the user provided — `mustard`/`mustardDeep`/`dark` replace what used to
 * be `lime`/`limeDeep`/`forest`. STATE's go/caution/stop semantic colors are deliberately
 * untouched (green=fluide/amber=ralenti/coral=bloqué stays the traffic-light convention).
 */
export const C = {
  bg: "#F6F1E7",
  card: "#FFFFFF",
  ink: "#18271C",
  // #6E7E70 measured ~3.8:1 on `bg` and ~4.3:1 on `card` — both fail WCAG AA's 4.5:1 for
  // normal text. This darker value keeps the same grey-green character while passing both
  // (still ~4.7:1 on the new cream bg, ~5.3:1 on card).
  muted: "#5F6F60",
  mustard: "#E3A72F",
  mustardDeep: "#B8841E",
  dark: "#1C1B18",
  amber: "#EFA83A",
  // Darkened from #B9832A — the original only reached ~2.8:1 as text on its own light-amber
  // wash (GothardPanel's label, RouteCard's total/footer), well under WCAG AA's 4.5:1. Kept
  // as the same token (not a new one) since nothing relies on amberDeep being light: it's
  // only ever used as text or as a gradient's dark stop, never as a background needing to
  // stay pale enough for text on top of it.
  amberDeep: "#7A5218",
  coral: "#E4645A",
  // New — coral's text-safe counterpart, matching the amberDeep/mustardDeep convention.
  // Plain `coral` stays light because it doubles as a background (offline banner isn't
  // affected — it uses dark ink text on the light coral instead — and the "attente" verdict
  // chip) where text needs to sit on top of it; darkening `coral` itself would break those.
  coralDeep: "#8B3B33",
  // Same hex as the old `limeDeep` — kept as its own token because it means "success/
  // positive" (Settings' confirmation text, checkbox/slider accent, STATE.go), a distinct
  // role from the brand/recommendation accent that moved to mustard.
  // Darkened from #5B9C1C — the original only reached ~3.4:1 on white and ~3.0:1 on its own
  // soft wash, under WCAG AA's 4.5:1. Safe to darken in place (unlike amber/coral) since
  // successText is never used as a background needing to stay light.
  successText: "#3F6B14",
  line: "rgba(24,39,28,0.08)",
  shadowCard: "0 4px 16px rgba(24,39,28,0.06)",
  shadowChip: "0 2px 8px rgba(24,39,28,0.08)",
} as const;

export interface StateStyle {
  color: string;
  /** AA-safe (≥4.5:1) text color for this state on light/white backgrounds. `color` itself
   * stays the more vivid original hue for decorative uses (status dot, sparkline stroke)
   * where contrast rules don't apply the same way. */
  textColor: string;
  soft: string;
  grad: string;
  /** Flow animation duration in seconds; 0 means no animation (stopped route). */
  spd: number;
}

export const STATE: Record<RouteState, StateStyle> = {
  go: { color: C.successText, textColor: C.successText, soft: "rgba(91,156,28,0.12)", grad: "linear-gradient(150deg,#3f7a34,#7fbf3a)", spd: 1.1 },
  caution: { color: C.amber, textColor: C.amberDeep, soft: "rgba(239,168,58,0.14)", grad: `linear-gradient(150deg,${C.amberDeep},#efc06a)`, spd: 2.4 },
  stop: { color: C.coral, textColor: C.coralDeep, soft: "rgba(228,100,90,0.14)", grad: "linear-gradient(150deg,#7a4a4a,#e4645a)", spd: 0 },
};

/** Bar color by severity, matching prompt-implementation-san-bernardino.md §4 thresholds. */
export function barColor(delayMin: number): string {
  return delayMin <= 5 ? C.successText : delayMin < 40 ? C.amber : C.coral;
}

// Styling only — the title/chip text itself is translated, see app/src/i18n/*.ts's
// `verdict.title`/`verdict.chip`.
export const VERDICT_META = {
  tunnel: { chipBg: C.mustard, chipInk: C.ink },
  col: { chipBg: C.mustard, chipInk: C.ink },
  gothard: { chipBg: C.amber, chipInk: "#3d2a06" },
  // chipInk was "#fff" — white on the light `coral` bg only reached ~3.3:1, under 4.5:1 at
  // this chip's 12px/800 weight (not "large text" by WCAG's own size threshold). C.ink passes.
  attente: { chipBg: C.coral, chipInk: C.ink },
} as const;
