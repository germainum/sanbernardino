import { useEffect, useMemo, useState } from "react";
import {
  evaluate,
  SCENARIOS,
  SCENARIO_HISTORY,
  type Direction,
  type EvaluatedSnapshot,
  type RoutesSnapshot,
  type ScenarioKey,
} from "@san-bernardino/core";
import { DATA_SOURCE } from "../lib/env";
import { fetchHistory, fetchState, toEvaluatedSnapshot } from "../lib/api";
import { formatUpdatedLabel, isStale } from "../lib/format";
import { listenForDeeplinks } from "../push/register";
import { useLang } from "../i18n";

export type { ScenarioKey };

const REFRESH_INTERVAL_MS = 60_000;
const LAST_KNOWN_KEY_PREFIX = "sanbernardino:lastKnown:";

interface LastKnown {
  evaluated: EvaluatedSnapshot;
  tunnelHistory: number[];
  colHistory: number[];
}

function loadLastKnown(direction: Direction): LastKnown | null {
  try {
    const raw = localStorage.getItem(LAST_KNOWN_KEY_PREFIX + direction);
    return raw ? (JSON.parse(raw) as LastKnown) : null;
  } catch {
    return null; // storage unavailable (private browsing, quota) — degrade to loading state
  }
}

function saveLastKnown(direction: Direction, value: LastKnown) {
  try {
    localStorage.setItem(LAST_KNOWN_KEY_PREFIX + direction, JSON.stringify(value));
  } catch {
    // best-effort cache — a write failure just means no offline fallback next time
  }
}

/**
 * DATA_SOURCE=mock (default for `npm run dev` with no backend running): reads the 6
 * prototype scenarios directly, in-process — this is what Phases 2-3 built and is what
 * powers the dev Scenario Switcher.
 *
 * DATA_SOURCE=api: fetches GET /api/state + /api/history from the real Supabase backend
 * (Phases 4-6). Caches the last successful response per direction in localStorage so a
 * network failure falls back to "last known state + timestamp" instead of a blank screen
 * (prompt-implementation-san-bernardino.md §6/§10), while the PWA service worker's
 * NetworkFirst cache (vite.config.ts) covers the same need at the HTTP layer.
 */
export function useSnapshot() {
  const { t } = useLang();
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>("bouchon");
  const [direction, setDirection] = useState<Direction>("italie");
  const [apiData, setApiData] = useState<LastKnown | null>(() => (DATA_SOURCE === "api" ? loadLastKnown(direction) : null));
  const [isOffline, setIsOffline] = useState(false);

  // Tapping a push notification or opening a sanbernardino:// link pre-selects the right
  // direction, per fonctionnalites-natives-san-bernardino.md §8 — a no-op on web builds.
  useEffect(() => listenForDeeplinks(setDirection), []);

  useEffect(() => {
    if (DATA_SOURCE !== "api") return;

    let cancelled = false;
    const controller = new AbortController();
    setApiData(loadLastKnown(direction));
    setIsOffline(false);

    async function load() {
      try {
        const state = await fetchState(direction, controller.signal);
        const evaluated = toEvaluatedSnapshot(state);
        const [tunnelHistory, colHistory] = await Promise.all([
          fetchHistory(direction, "tunnel", 3, controller.signal),
          fetchHistory(direction, "col", 3, controller.signal),
        ]);
        if (cancelled) return;
        const fresh: LastKnown = { evaluated, tunnelHistory, colHistory };
        setApiData(fresh);
        saveLastKnown(direction, fresh);
        setIsOffline(false);
      } catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === "AbortError")) return;
        setIsOffline(true);
      }
    }

    load();
    const id = setInterval(load, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(id);
    };
  }, [direction]);

  const mockSnapshot: RoutesSnapshot = useMemo(() => {
    const base: RoutesSnapshot = SCENARIOS[scenarioKey].snapshot;
    return { ...base, direction };
  }, [scenarioKey, direction]);
  const mockEvaluated = useMemo(() => evaluate(mockSnapshot), [mockSnapshot]);

  if (DATA_SOURCE === "mock") {
    return {
      status: "ready" as const,
      isOffline: false,
      scenarioKey,
      setScenarioKey,
      direction,
      setDirection,
      snapshot: mockSnapshot,
      evaluated: mockEvaluated,
      tunnelHistory: SCENARIO_HISTORY[scenarioKey].tunnel,
      colHistory: SCENARIO_HISTORY[scenarioKey].col,
      updatedLabel: t.format.updatedMinutesAgo(2),
      source: t.source.simulated,
      stale: false,
    };
  }

  return {
    status: (apiData ? "ready" : "loading") as "ready" | "loading",
    isOffline,
    scenarioKey: undefined,
    setScenarioKey: undefined,
    direction,
    setDirection,
    snapshot: apiData?.evaluated.snapshot,
    evaluated: apiData?.evaluated,
    tunnelHistory: apiData?.tunnelHistory ?? [],
    colHistory: apiData?.colHistory ?? [],
    updatedLabel: apiData ? formatUpdatedLabel(apiData.evaluated.snapshot.updatedAt, t) : "",
    source: isOffline ? t.source.offline : t.source.live,
    stale: apiData ? isStale(apiData.evaluated.snapshot.updatedAt) : false,
  };
}
