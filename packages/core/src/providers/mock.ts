import { SCENARIOS, type ScenarioKey } from "../scenarios.js";
import type { Direction, RoutesRaw, RoutesSnapshot, ViasuisseRaw } from "../types.js";
import type { RoutesProvider, ViasuisseProvider } from "./types.js";

function toViasuisseRaw(snapshot: RoutesSnapshot): ViasuisseRaw {
  return {
    tunnel: { state: snapshot.tunnel.state, detail: snapshot.tunnel.detail },
    col: { state: snapshot.col.state, detail: snapshot.col.detail, seasonal: snapshot.col.seasonal },
    ...(snapshot.gothard ? { gothard: { state: snapshot.gothard.state, detail: snapshot.gothard.detail } } : {}),
  };
}

function toRoutesRaw(snapshot: RoutesSnapshot): RoutesRaw {
  return {
    tunnelMin: snapshot.tunnel.totalMin,
    colMin: snapshot.col.totalMin,
    gothardMin: snapshot.gothard?.totalMin ?? null,
    gothardDetourMin: snapshot.gothard?.detourMin,
  };
}

export type ScenarioSource = ScenarioKey | (() => ScenarioKey);

function resolve(source: ScenarioSource): ScenarioKey {
  return typeof source === "function" ? source() : source;
}

/** Seeded from src/scenarios.ts — the same fixtures the UI's dev scenario switcher and the test suite use. */
export class MockViasuisseProvider implements ViasuisseProvider {
  private readonly source: ScenarioSource;

  constructor(source: ScenarioSource) {
    this.source = source;
  }

  async fetchViasuisse(): Promise<ViasuisseRaw> {
    return toViasuisseRaw(SCENARIOS[resolve(this.source)].snapshot);
  }
}

export class MockRoutesProvider implements RoutesProvider {
  private readonly source: ScenarioSource;

  constructor(source: ScenarioSource) {
    this.source = source;
  }

  async fetchGoogleRoutes(_direction: Direction): Promise<RoutesRaw> {
    return toRoutesRaw(SCENARIOS[resolve(this.source)].snapshot);
  }
}

/**
 * Steps through a fixed sequence of scenarios, one per `advance()` call. Used by the
 * Supabase seed script (Phase 4) to generate a realistic multi-poll transition history —
 * e.g. persistence-over-2-polls and jam-threshold-crossing both require seeing the same
 * transition on consecutive polls, which a single static scenario can't exercise.
 */
export class ScenarioSequence {
  private index = 0;
  private readonly keys: ScenarioKey[];

  constructor(keys: ScenarioKey[]) {
    if (keys.length === 0) throw new Error("ScenarioSequence requires at least one scenario key");
    this.keys = keys;
  }

  current(): ScenarioKey {
    return this.keys[this.index % this.keys.length];
  }

  advance(): void {
    this.index += 1;
  }
}
