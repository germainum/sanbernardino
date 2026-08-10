import { describe, expect, it } from "vitest";
import { buildPushPayload } from "../src/notifications.js";
import type { DetectedEvent } from "../src/types.js";

function event(overrides: Partial<DetectedEvent>): DetectedEvent {
  return {
    key: "test",
    type: "verdict",
    direction: "italie",
    priority: "high",
    payload: {},
    ...overrides,
  };
}

describe("buildPushPayload()", () => {
  it("includes a direction-correct deeplink", () => {
    expect(buildPushPayload(event({ direction: "suisse" })).deeplink).toBe("sanbernardino://home?dir=suisse");
    expect(buildPushPayload(event({ direction: "italie" })).deeplink).toBe("sanbernardino://home?dir=italie");
  });

  it("reuses decide()'s reason text for verdict changes", () => {
    const payload = buildPushPayload(event({ type: "verdict", payload: { reason: "Le col est plus court aujourd'hui." } }));
    expect(payload.body).toBe("Le col est plus court aujourd'hui.");
  });

  it("mentions the delay for jam_threshold", () => {
    const payload = buildPushPayload(event({ type: "jam_threshold", payload: { threshold: 20, delay: 25 } }));
    expect(payload.body).toContain("25 min");
  });

  it("mentions the Gothard ETA", () => {
    const payload = buildPushPayload(event({ type: "gothard", payload: { eta: 62 } }));
    expect(payload.body).toContain("62 min");
  });

  it("produces a non-empty title and body for every event type", () => {
    const types: DetectedEvent["type"][] = ["verdict", "col_open", "tunnel_closed", "jam_threshold", "gothard", "cleared", "restriction"];
    for (const type of types) {
      const payload = buildPushPayload(event({ type }));
      expect(payload.title.length).toBeGreaterThan(0);
      expect(payload.body.length).toBeGreaterThan(0);
    }
  });
});
