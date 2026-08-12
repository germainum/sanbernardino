import type { RoutesSnapshot } from "./types.js";

/**
 * Ported from the SCENARIOS object in san-bernardino-decision.jsx. Used by the UI's dev
 * scenario switcher, by MockViasuisseProvider/MockRoutesProvider (packages/core/src/providers),
 * and by the decide()/detectEvents() test suites — one source of truth for all three.
 */
export const SCENARIOS = {
  fluide: {
    label: "Été · fluide",
    snapshot: {
      updatedAt: "2026-01-01T12:00:00Z",
      direction: "italie",
      tunnel: { state: "go", baseMin: 8, totalMin: 8, detail: "Trafic fluide" },
      col: { state: "go", baseMin: 34, totalMin: 34, detail: "Ouvert · route sèche" },
    },
  },
  bouchon: {
    label: "Été · bouchon tunnel",
    snapshot: {
      updatedAt: "2026-01-01T12:00:00Z",
      direction: "italie",
      tunnel: { state: "caution", baseMin: 8, totalMin: 48, detail: "Bouchon 4 km · ~40 min" },
      col: { state: "go", baseMin: 34, totalMin: 34, detail: "Ouvert · route sèche" },
    },
  },
  hiver: {
    label: "Hiver · col fermé",
    snapshot: {
      updatedAt: "2026-01-01T12:00:00Z",
      direction: "italie",
      tunnel: { state: "go", baseMin: 8, totalMin: 8, detail: "Trafic fluide" },
      col: { state: "stop", baseMin: 34, totalMin: null, detail: "Fermé pour l'hiver", seasonal: true },
    },
  },
  sature: {
    label: "A13 saturé · Gothard OK",
    snapshot: {
      updatedAt: "2026-01-01T12:00:00Z",
      direction: "italie",
      tunnel: { state: "stop", baseMin: 8, totalMin: 88, detail: "Bouchon 8 km · ~80 min" },
      col: { state: "stop", baseMin: 34, totalMin: null, detail: "Fermé · neige" },
      gothard: { state: "caution", baseMin: 42, totalMin: 62, detail: "Bouchon 2 km · ~20 min", detourMin: 45 },
    },
  },
  gothardKo: {
    label: "Tout bloqué",
    snapshot: {
      updatedAt: "2026-01-01T12:00:00Z",
      direction: "italie",
      tunnel: { state: "stop", baseMin: 8, totalMin: 88, detail: "Bouchon 8 km · ~80 min" },
      col: { state: "stop", baseMin: 34, totalMin: null, detail: "Fermé · neige" },
      gothard: { state: "stop", baseMin: 42, totalMin: 118, detail: "Bouchon 12 km · ~95 min", detourMin: 55 },
    },
  },
  accident: {
    label: "Tunnel fermé",
    snapshot: {
      updatedAt: "2026-01-01T12:00:00Z",
      direction: "italie",
      tunnel: { state: "stop", baseMin: 8, totalMin: null, detail: "Fermé · accident" },
      col: { state: "caution", baseMin: 34, totalMin: 45, detail: "Ouvert · trafic dense" },
    },
  },
} satisfies Record<string, { label: string; snapshot: RoutesSnapshot }>;

export type ScenarioKey = keyof typeof SCENARIOS;

/**
 * 3h delay history (7 points) per route, for the per-route sparkline in each RouteCard's
 * Detail drawer. The tunnel/col series that used to be the sole generic `SCENARIO_HISTORY`
 * array are kept verbatim (ported from the prototype) under whichever route they actually
 * matched; the other route's series is newly authored to track that scenario's own
 * col/tunnel delay.
 */
export const SCENARIO_HISTORY: Record<keyof typeof SCENARIOS, { tunnel: number[]; col: number[] }> = {
  fluide: { tunnel: [1, 0, 2, 0, 0, 1, 0], col: [0, 1, 0, 0, 0, 1, 0] },
  bouchon: { tunnel: [8, 14, 22, 28, 34, 38, 40], col: [0, 0, 1, 0, 0, 0, 0] },
  hiver: { tunnel: [2, 0, 1, 0, 0, 0, 0], col: [4, 3, 2, 1, 0, 0, 0] },
  sature: { tunnel: [40, 52, 60, 68, 74, 78, 80], col: [0, 0, 0, 0, 0, 0, 0] },
  gothardKo: { tunnel: [78, 80, 82, 80, 79, 80, 80], col: [0, 0, 0, 0, 0, 0, 0] },
  accident: { tunnel: [15, 30, 50, 65, 75, 80, 80], col: [4, 5, 7, 9, 11, 11, 11] },
};
