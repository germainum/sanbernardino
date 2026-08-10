export * from "./types.js";
export * from "./mock.js";
export * from "./http.js";

import type { ScenarioKey } from "../scenarios.js";
import { MockRoutesProvider, MockViasuisseProvider, type ScenarioSource } from "./mock.js";
import { RealRoutesProvider, RealViasuisseProvider } from "./http.js";
import type { RoutesProvider, ViasuisseProvider } from "./types.js";
import type { ViasuisseRaw } from "../types.js";

/**
 * Selection is by env var, never by code edit — the `poll` Edge Function and any local
 * dev/seed tooling call these factories, never the concrete provider classes directly.
 * DATA_SOURCE defaults to mock so the whole app runs with zero external accounts.
 */
export interface ProviderEnv {
  DATA_SOURCE?: "live" | "mock";
  /** Overrides DATA_SOURCE for the Viasuisse provider only — lets Phase 11 sub-tasks ship independently. */
  VIASUISSE_DATA_SOURCE?: "live" | "mock";
  /** Overrides DATA_SOURCE for the Routes provider only — lets Phase 11 sub-tasks ship independently. */
  ROUTES_DATA_SOURCE?: "live" | "mock";
  MOCK_SCENARIO?: ScenarioSource;
  /** Injected by the caller (poll/index.ts) — reads the road_status_cache table. See ViasuisseHttpConfig in http.ts for why this is a cache read, not a direct fetch. */
  VIASUISSE_READ_CACHE?: () => Promise<ViasuisseRaw>;
  GOOGLE_ROUTES_API_KEY?: string;
}

const DEFAULT_SCENARIO: ScenarioKey = "bouchon";

export function getViasuisseProvider(env: ProviderEnv): ViasuisseProvider {
  const source = env.VIASUISSE_DATA_SOURCE ?? env.DATA_SOURCE;
  if (source === "live") {
    if (!env.VIASUISSE_READ_CACHE) throw new Error("Viasuisse live source requires VIASUISSE_READ_CACHE");
    return new RealViasuisseProvider({ readCache: env.VIASUISSE_READ_CACHE });
  }
  return new MockViasuisseProvider(env.MOCK_SCENARIO ?? DEFAULT_SCENARIO);
}

export function getRoutesProvider(env: ProviderEnv): RoutesProvider {
  const source = env.ROUTES_DATA_SOURCE ?? env.DATA_SOURCE;
  if (source === "live") {
    if (!env.GOOGLE_ROUTES_API_KEY) throw new Error("Routes live source requires GOOGLE_ROUTES_API_KEY");
    return new RealRoutesProvider({ apiKey: env.GOOGLE_ROUTES_API_KEY });
  }
  return new MockRoutesProvider(env.MOCK_SCENARIO ?? DEFAULT_SCENARIO);
}
