import type { RouteState } from "@san-bernardino/core";

/** Design tokens from prompt-implementation-san-bernardino.md §7, ported verbatim from the prototype. */
export const C = {
  bg: "#EDF2E6",
  card: "#FFFFFF",
  ink: "#18271C",
  muted: "#6E7E70",
  lime: "#8FCB2E",
  limeDeep: "#5B9C1C",
  forest: "#22432E",
  amber: "#EFA83A",
  coral: "#E4645A",
  line: "rgba(24,39,28,0.08)",
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
  caution: { color: C.amber, soft: "rgba(239,168,58,0.14)", grad: "linear-gradient(150deg,#b9832a,#efc06a)", spd: 2.4 },
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
