import { describe, expect, it } from "vitest";
import { evaluate } from "../src/evaluate.js";
import { normalize } from "../src/normalize.js";
import { MockRoutesProvider, MockViasuisseProvider, ScenarioSequence } from "../src/providers/mock.js";
import type { RoutesRaw, ViasuisseRaw } from "../src/types.js";

/**
 * Contract test for the swap seam: decide()/detectEvents() must behave identically no
 * matter which ViasuisseProvider/RoutesProvider implementation feeds normalize(). Proven
 * here by comparing MockViasuisseProvider/MockRoutesProvider's output (derived from
 * src/scenarios.ts) against an independently hand-authored raw fixture describing the same
 * real-world situation — if both normalize to the same EvaluatedSnapshot, any provider that
 * returns a conforming raw shape (including RealViasuisseProvider/RealRoutesProvider once
 * implemented in Phase 11) will decide correctly too.
 */
describe("provider contract", () => {
  it("mock providers and an independently authored raw fixture normalize to the same decision", async () => {
    const mockViasuisse = new MockViasuisseProvider("sature");
    const mockRoutes = new MockRoutesProvider("sature");

    const [viasuisseFromMock, routesFromMock] = await Promise.all([
      mockViasuisse.fetchViasuisse(),
      mockRoutes.fetchGoogleRoutes("italie"),
    ]);

    // Hand-authored, independent of src/scenarios.ts — describes the same "A13 saturated,
    // Gothard OK" situation a real ViasuisseProvider/RoutesProvider pair would return.
    const independentViasuisse: ViasuisseRaw = {
      tunnel: { state: "stop", detail: "Bouchon 8 km · ~80 min" },
      col: { state: "stop", detail: "Fermé · neige" },
      gothard: { state: "caution", detail: "Bouchon 2 km · ~20 min" },
    };
    const independentRoutes: RoutesRaw = {
      tunnelMin: 88,
      colMin: null,
      gothardMin: 62,
      gothardDetourMin: 45,
    };

    const fromMock = evaluate(normalize(viasuisseFromMock, routesFromMock, "italie", "2026-01-01T12:00:00Z"));
    const fromIndependentFixture = evaluate(normalize(independentViasuisse, independentRoutes, "italie", "2026-01-01T12:00:00Z"));

    expect(fromMock).toEqual(fromIndependentFixture);
    expect(fromMock.verdict).toBe("gothard");
  });

  it("ScenarioSequence steps through scenarios in order and wraps around", () => {
    const seq = new ScenarioSequence(["fluide", "bouchon", "sature"]);
    expect(seq.current()).toBe("fluide");
    seq.advance();
    expect(seq.current()).toBe("bouchon");
    seq.advance();
    expect(seq.current()).toBe("sature");
    seq.advance();
    expect(seq.current()).toBe("fluide"); // wraps
  });

  it("mock providers stay in sync when driven by a shared ScenarioSequence", async () => {
    const seq = new ScenarioSequence(["fluide", "accident"]);
    const viasuisse = new MockViasuisseProvider(() => seq.current());
    const routes = new MockRoutesProvider(() => seq.current());

    const firstPoll = evaluate(
      normalize(await viasuisse.fetchViasuisse(), await routes.fetchGoogleRoutes("italie"), "italie", "t0"),
    );
    expect(firstPoll.verdict).toBe("tunnel");

    seq.advance();
    const secondPoll = evaluate(
      normalize(await viasuisse.fetchViasuisse(), await routes.fetchGoogleRoutes("italie"), "italie", "t1"),
    );
    expect(secondPoll.verdict).toBe("col");
  });
});

describe("RealViasuisseProvider (Phase 11 stub — not implemented yet)", () => {
  it("throws a clear not-implemented error instead of silently returning fake data", async () => {
    const { RealViasuisseProvider } = await import("../src/providers/http.js");
    const viasuisse = new RealViasuisseProvider({
      apiBase: "https://example.test",
      tokenUrl: "https://example.test/token",
      clientId: "id",
      clientSecret: "secret",
    });

    await expect(viasuisse.fetchViasuisse()).rejects.toThrow(/not implemented/i);
  });
});

describe("RealRoutesProvider", () => {
  function fakeFetch(callsByIndex) {
    let call = 0;
    return async () => {
      const entry = callsByIndex[call];
      call += 1;
      if (entry === null) return new Response("not found", { status: 404 });
      return new Response(JSON.stringify({ routes: [{ duration: `${entry.duration}s`, staticDuration: `${entry.staticDuration}s` }] }), {
        status: 200,
      });
    };
  }

  it("computes tunnel/col/gothard minutes and their traffic-free baseMin from three independent computeRoutes calls", async () => {
    const { RealRoutesProvider } = await import("../src/providers/http.js");
    const originalFetch = globalThis.fetch;
    // tunnel=4800s(80min)/base 70min, col=6000s(100min)/base 90min, gothard=7200s(120min)/base 110min
    globalThis.fetch = fakeFetch([
      { duration: 4800, staticDuration: 4200 },
      { duration: 6000, staticDuration: 5400 },
      { duration: 7200, staticDuration: 6600 },
    ]);
    try {
      const routes = new RealRoutesProvider({ apiKey: "key" });
      const raw = await routes.fetchGoogleRoutes("italie");
      expect(raw.tunnelMin).toBe(80);
      expect(raw.colMin).toBe(100);
      expect(raw.gothardMin).toBe(120);
      expect(raw.gothardDetourMin).toBe(40); // 120 - min(80, 100)
      expect(raw.tunnelBaseMin).toBe(70);
      expect(raw.colBaseMin).toBe(90);
      expect(raw.gothardBaseMin).toBe(110);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("degrades a single impassable route to null instead of failing the whole fetch", async () => {
    const { RealRoutesProvider } = await import("../src/providers/http.js");
    const originalFetch = globalThis.fetch;
    // tunnel=4800s(80min), col closed (404), gothard=7200s(120min)
    globalThis.fetch = fakeFetch([{ duration: 4800, staticDuration: 4200 }, null, { duration: 7200, staticDuration: 6600 }]);
    try {
      const routes = new RealRoutesProvider({ apiKey: "key" });
      const raw = await routes.fetchGoogleRoutes("suisse");
      expect(raw.tunnelMin).toBe(80);
      expect(raw.colMin).toBeNull();
      expect(raw.colBaseMin).toBeUndefined();
      expect(raw.gothardMin).toBe(120);
      expect(raw.gothardDetourMin).toBe(40); // 120 - min(80) since col is null
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
