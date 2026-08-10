import { describe, expect, it } from "vitest";
import { detectEvents } from "../src/events.js";
import { evaluate } from "../src/evaluate.js";
import { SCENARIOS } from "./fixtures.js";

describe("detectEvents()", () => {
  it("returns nothing on the first poll (no prev)", () => {
    expect(detectEvents(null, evaluate(SCENARIOS.fluide))).toEqual([]);
  });

  it("fires a verdict event when the recommended route changes", () => {
    const events = detectEvents(evaluate(SCENARIOS.fluide), evaluate(SCENARIOS.bouchon));
    expect(events.some((e) => e.type === "verdict" && e.payload.from === "tunnel" && e.payload.to === "col")).toBe(true);
  });

  it("fires col_open when the col transitions from stop to any other state", () => {
    const events = detectEvents(evaluate(SCENARIOS.hiver), evaluate(SCENARIOS.fluide));
    expect(events.some((e) => e.type === "col_open")).toBe(true);
  });

  it("fires tunnel_closed when the tunnel transitions into stop", () => {
    const events = detectEvents(evaluate(SCENARIOS.bouchon), evaluate(SCENARIOS.accident));
    expect(events.some((e) => e.type === "tunnel_closed")).toBe(true);
  });

  it("fires jam_threshold once delay crosses 20 and again at 40", () => {
    const under20 = evaluate(SCENARIOS.fluide); // tunnel delay 0
    const over20 = evaluate(SCENARIOS.bouchon); // tunnel delay 40
    const events = detectEvents(under20, over20);
    const thresholds = events.filter((e) => e.type === "jam_threshold").map((e) => e.payload.threshold);
    expect(thresholds).toEqual(expect.arrayContaining([20, 40]));
  });

  it("does not re-fire jam_threshold when delay stays above the threshold", () => {
    const events = detectEvents(evaluate(SCENARIOS.bouchon), evaluate(SCENARIOS.bouchon));
    expect(events.filter((e) => e.type === "jam_threshold")).toHaveLength(0);
  });

  it("fires gothard when the detour becomes worthwhile", () => {
    const events = detectEvents(evaluate(SCENARIOS.gothardKo), evaluate(SCENARIOS.sature));
    expect(events.some((e) => e.type === "gothard")).toBe(true);
  });

  it("fires cleared when tunnel delay drops back under the threshold", () => {
    const events = detectEvents(evaluate(SCENARIOS.bouchon), evaluate(SCENARIOS.fluide));
    expect(events.some((e) => e.type === "cleared")).toBe(true);
  });

  it("produces stable, collision-free keys for persistence", () => {
    const events = detectEvents(evaluate(SCENARIOS.fluide), evaluate(SCENARIOS.sature));
    const keys = events.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
