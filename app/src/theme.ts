import type { RouteState } from "@san-bernardino/core";

/** Design tokens from prompt-implementation-san-bernardino.md §7, ported verbatim from the prototype. */
export const C = {
  bg: "#EDF2E6",
  card: "#FFFFFF",
  ink: "#18271C",
  // #6E7E70 measured ~3.8:1 on `bg` and ~4.3:1 on `card` — both fail WCAG AA's 4.5:1 for
  // normal text. This darker value keeps the same grey-green character while passing both
  // (~4.7:1 on bg, ~5.3:1 on card).
  muted: "#5F6F60",
  lime: "#8FCB2E",
  limeDeep: "#5B9C1C",
  forest: "#22432E",
  amber: "#EFA83A",
  amberDeep: "#B9832A",
  coral: "#E4645A",
  line: "rgba(24,39,28,0.08)",
  shadowCard: "0 4px 16px rgba(24,39,28,0.06)",
  shadowChip: "0 2px 8px rgba(24,39,28,0.08)",
} as const;

export interface StateStyle {
  color: string;
  soft: string;
  grad: string;
  /** Flow animation duration in seconds; 0 means no animation (stopped route). */
  spd: number;
}

export const STATE: Record<RouteState, StateStyle> = {
  go: { color: C.limeDeep, soft: "rgba(91,156,28,0.12)", grad: "linear-gradient(150deg,#3f7a34,#7fbf3a)", spd: 1.1 },
  caution: { color: C.amber, soft: "rgba(239,168,58,0.14)", grad: `linear-gradient(150deg,${C.amberDeep},#efc06a)`, spd: 2.4 },
  stop: { color: C.coral, soft: "rgba(228,100,90,0.14)", grad: "linear-gradient(150deg,#7a4a4a,#e4645a)", spd: 0 },
};

/** Bar color by severity, matching prompt-implementation-san-bernardino.md §4 thresholds. */
export function barColor(delayMin: number): string {
  return delayMin <= 5 ? C.limeDeep : delayMin < 40 ? C.amber : C.coral;
}

export const VERDICT_META = {
  tunnel: { title: "Prends le tunnel", chip: "Recommandé", chipBg: C.lime, chipInk: "#1c3208" },
  col: { title: "Prends le col", chip: "Recommandé", chipBg: C.lime, chipInk: "#1c3208" },
  gothard: { title: "Passe par le Gothard", chip: "Déviation", chipBg: C.amber, chipInk: "#3d2a06" },
  attente: { title: "Mieux vaut patienter", chip: "Rien de plus rapide", chipBg: C.coral, chipInk: "#fff" },
} as const;
