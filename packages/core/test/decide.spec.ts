import { describe, expect, it } from "vitest";
import { decide } from "../src/decide.js";
import { delayOf } from "../src/evaluate.js";
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
});

describe("delayOf()", () => {
  it("computes delay = max(0, total - base), never negative", () => {
    expect(delayOf("tunnel", 8)).toBe(0);
    expect(delayOf("tunnel", 48)).toBe(40);
    expect(delayOf("tunnel", 5)).toBe(0); // below base — must clamp to 0, not go negative
    expect(delayOf("tunnel", null)).toBeNull();
  });
});
