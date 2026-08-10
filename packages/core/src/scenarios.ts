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

/** 3h history bars (7 points), ported verbatim from the prototype's per-scenario `history` arrays. */
export const SCENARIO_HISTORY: Record<keyof typeof SCENARIOS, number[]> = {
  fluide: [1, 0, 2, 0, 0, 1, 0],
  bouchon: [8, 14, 22, 28, 34, 38, 40],
  hiver: [2, 0, 1, 0, 0, 0, 0],
  sature: [40, 52, 60, 68, 74, 78, 80],
  gothardKo: [78, 80, 82, 80, 79, 80, 80],
  accident: [4, 5, 7, 9, 11, 11, 11],
};
