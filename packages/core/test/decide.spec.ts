import { describe, expect, it } from "vitest";
import { decide } from "../src/decide.js";
import { delayOf } from "../src/evaluate.js";
import type { RoutesSnapshot } from "../src/types.js";
import { SCENARIOS } from "./fixtures.js";

describe("decide()", () => {
  it.each([
    ["fluide", "tunnel"],
    ["bouchon", "col"],
    ["hiver", "tunnel"],
    ["sature", "gothard"],
    ["gothardKo", "attente"],
    ["accident", "col"],
  ] as const)("%s -> %s", (scenario, expectedVerdict) => {
    expect(decide(SCENARIOS[scenario]).verdict).toBe(expectedVerdict);
  });

  it("never recommends Gothard unless saturated and strictly shorter than the best A13 option", () => {
    for (const [name, snapshot] of Object.entries(SCENARIOS)) {
      const result = decide(snapshot);
      if (result.verdict === "gothard") {
        expect(result.saturated, `${name} should be saturated to recommend Gothard`).toBe(true);
        const bestA13 = Math.min(snapshot.tunnel.totalMin ?? Infinity, snapshot.col.totalMin ?? Infinity);
        expect(snapshot.gothard?.totalMin ?? Infinity).toBeLessThan(bestA13);
      }
    }
  });

  it("marks gothardKo as saturated with no better alternative", () => {
    const result = decide(SCENARIOS.gothardKo);
    expect(result.saturated).toBe(true);
    expect(result.verdict).toBe("attente");
  });

  describe("reason tone", () => {
    function snapshot(tunnelMin: number, colMin: number): RoutesSnapshot {
      return {
        updatedAt: "2026-01-01T00:00:00Z",
        direction: "italie",
        tunnel: { state: "go", baseMin: 8, totalMin: tunnelMin },
        col: { state: "go", baseMin: 34, totalMin: colMin },
      };
    }

    it("uses balanced wording when the tunnel wins by a small margin", () => {
      const result = decide(snapshot(41, 48)); // 7 min gap
      expect(result.verdict).toBe("tunnel");
      expect(result.reason).toBe("Le tunnel est un peu plus rapide (7 min). Le col reste une belle option, gratuite et panoramique.");
    });

    it("uses balanced wording when the col wins by a small margin", () => {
      const result = decide(snapshot(48, 41)); // 7 min gap
      expect(result.verdict).toBe("col");
      expect(result.reason).toBe("Le col est un peu plus rapide (7 min). Le tunnel reste une option fiable, mais payante.");
    });

    it("keeps the categorical wording once the gap exceeds the close-gap threshold", () => {
      const tunnelWins = decide(snapshot(30, 50)); // 20 min gap
      expect(tunnelWins.verdict).toBe("tunnel");
      expect(tunnelWins.reason).toBe("Le tunnel reste le plus rapide (30 min). Le col n'apporte rien.");

      const colWins = decide(snapshot(50, 30)); // 20 min gap
      expect(colWins.verdict).toBe("col");
      expect(colWins.reason).toBe("Bouchon au tunnel. Le col est plus court aujourd'hui : 30 contre 50 min.");
    });
  });
});

describe("delayOf()", () => {
  it("computes delay = max(0, total - base), never negative", () => {
    expect(delayOf("tunnel", 8)).toBe(0);
    expect(delayOf("tunnel", 48)).toBe(40);
    expect(delayOf("tunnel", 5)).toBe(0); // below base — must clamp to 0, not go negative
    expect(delayOf("tunnel", null)).toBeNull();
  });
});
