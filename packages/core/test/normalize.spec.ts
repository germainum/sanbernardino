import { describe, expect, it } from "vitest";
import { deriveColStatus, normalize } from "../src/normalize.js";
import type { RoutesRaw, ViasuisseRaw } from "../src/types.js";

describe("deriveColStatus", () => {
  it("maps stop to closed, caution to restricted, go to open", () => {
    expect(deriveColStatus("stop")).toBe("closed");
    expect(deriveColStatus("caution")).toBe("restricted");
    expect(deriveColStatus("go")).toBe("open");
  });
});

describe("normalize() colStatus", () => {
  const routes: RoutesRaw = { tunnelMin: 90, colMin: 95, gothardMin: null };

  it("derives colStatus from state when the provider doesn't set it", () => {
    const viasuisse: ViasuisseRaw = {
      tunnel: { state: "go" },
      col: { state: "stop", detail: "Fermé · neige" },
    };
    const snapshot = normalize(viasuisse, routes, "italie", "2026-01-01T00:00:00Z");
    expect(snapshot.col.colStatus).toBe("closed");
  });

  it("prefers a colStatus supplied directly by the provider over the derived fallback", () => {
    const viasuisse: ViasuisseRaw = {
      tunnel: { state: "go" },
      col: { state: "go", colStatus: "restricted" },
    };
    const snapshot = normalize(viasuisse, routes, "italie", "2026-01-01T00:00:00Z");
    expect(snapshot.col.colStatus).toBe("restricted");
  });
});
