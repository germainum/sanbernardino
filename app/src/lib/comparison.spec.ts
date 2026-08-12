import { describe, expect, it } from "vitest";
import type { EvaluatedSnapshot, RoutesSnapshot } from "@san-bernardino/core";
import { axisConditionWord, chipsFor, closedColMessage, computeGapMin, fasterRoute } from "./comparison";

function snapshot(overrides: Partial<RoutesSnapshot> = {}): RoutesSnapshot {
  return {
    updatedAt: "2026-01-01T00:00:00Z",
    direction: "italie",
    tunnel: { state: "go", baseMin: 8, totalMin: 25 },
    col: { state: "go", baseMin: 34, totalMin: 32 },
    ...overrides,
  };
}

describe("computeGapMin", () => {
  it("returns the absolute gap when the verdict is tunnel or col", () => {
    expect(computeGapMin(snapshot(), "tunnel")).toBe(7);
    expect(computeGapMin(snapshot({ tunnel: { state: "go", baseMin: 8, totalMin: 32 }, col: { state: "go", baseMin: 34, totalMin: 25 } }), "col")).toBe(7);
  });

  it("returns null for gothard/attente verdicts", () => {
    expect(computeGapMin(snapshot(), "gothard")).toBeNull();
    expect(computeGapMin(snapshot(), "attente")).toBeNull();
  });

  it("returns null when either total is missing", () => {
    expect(computeGapMin(snapshot({ col: { state: "stop", baseMin: 34, totalMin: null } }), "tunnel")).toBeNull();
  });
});

describe("fasterRoute", () => {
  it("picks the lower total", () => {
    expect(fasterRoute(snapshot())).toBe("tunnel");
  });

  it("returns null on a tie or missing data", () => {
    expect(fasterRoute(snapshot({ col: { state: "go", baseMin: 34, totalMin: 25 } }))).toBeNull();
    expect(fasterRoute(snapshot({ col: { state: "stop", baseMin: 34, totalMin: null } }))).toBeNull();
  });
});

describe("chipsFor", () => {
  it("labels the faster route and gives the other its trait fallback", () => {
    expect(chipsFor("col", snapshot(), "col")).toEqual(["Plus rapide", "Gratuit"]);
    expect(chipsFor("tunnel", snapshot(), "col")).toEqual(["Fiable", "Vignette"]);
  });

  it("replaces the first chip with the real detail text when the route has a local issue", () => {
    const withJam = snapshot({ tunnel: { state: "caution", baseMin: 8, totalMin: 48, detail: "Bouchon 4 km" } });
    expect(chipsFor("tunnel", withJam, "col")).toEqual(["Bouchon 4 km", "Vignette"]);
  });

  it("falls back to the trait chip if there's a local issue but no detail text", () => {
    const noDetail = snapshot({ tunnel: { state: "caution", baseMin: 8, totalMin: 48 } });
    expect(chipsFor("tunnel", noDetail, "col")).toEqual(["Fiable", "Vignette"]);
  });
});

describe("axisConditionWord", () => {
  function evaluated(overrides: Partial<EvaluatedSnapshot> = {}): EvaluatedSnapshot {
    return {
      snapshot: snapshot(),
      verdict: "col",
      saturated: false,
      reason: "",
      delays: { tunnel: 0, col: 0 },
      gothardWorthIt: false,
      ...overrides,
    };
  }

  it("says saturated when the whole axis is blocked", () => {
    expect(axisConditionWord(evaluated({ saturated: true }))).toBe("Axe saturé");
  });

  it("says fluide when both routes are go", () => {
    expect(axisConditionWord(evaluated())).toBe("Trafic fluide");
  });

  it("says chargé when either route has an issue, without naming which one", () => {
    const withIssue = evaluated({ snapshot: snapshot({ tunnel: { state: "caution", baseMin: 8, totalMin: 40 } }) });
    expect(axisConditionWord(withIssue)).toBe("Trafic chargé");
  });
});

describe("closedColMessage", () => {
  it("uses the real feed detail when present", () => {
    expect(closedColMessage({ state: "stop", baseMin: 34, totalMin: null, detail: "Fermé pour l'hiver" })).toBe("Fermé pour l'hiver");
  });

  it("falls back to a generic message when there's no detail", () => {
    expect(closedColMessage({ state: "stop", baseMin: 34, totalMin: null })).toBe("Col fermé");
  });
});
