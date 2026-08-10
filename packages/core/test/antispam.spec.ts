import { describe, expect, it } from "vitest";
import { cooldownFor, isInQuietHours, exceedsDailyCap, shouldSuppress } from "../src/antispam.js";

describe("isInQuietHours()", () => {
  const quietHours = { from: "22:00", to: "07:00" };

  it("handles overnight ranges", () => {
    expect(isInQuietHours(quietHours, new Date("2026-01-01T23:30:00"))).toBe(true);
    expect(isInQuietHours(quietHours, new Date("2026-01-01T05:00:00"))).toBe(true);
    expect(isInQuietHours(quietHours, new Date("2026-01-01T12:00:00"))).toBe(false);
  });
});

describe("exceedsDailyCap()", () => {
  it("never caps high-priority notifications", () => {
    expect(exceedsDailyCap(10, "high")).toBe(false);
  });

  it("caps non-high notifications at the daily limit", () => {
    expect(exceedsDailyCap(4, "medium")).toBe(false);
    expect(exceedsDailyCap(5, "medium")).toBe(true);
  });
});

describe("shouldSuppress()", () => {
  const now = new Date("2026-01-01T12:00:00");

  it("suppresses within cooldown window", () => {
    const lastSentAt = new Date(now.getTime() - 5 * 60_000); // 5 min ago
    expect(
      shouldSuppress({ type: "verdict", priority: "high", now, lastSentAt, dailyCount: 0 }),
    ).toBe(true); // cooldown for verdict is 15 min
  });

  it("allows once cooldown has elapsed", () => {
    const lastSentAt = new Date(now.getTime() - 20 * 60_000);
    expect(
      shouldSuppress({ type: "verdict", priority: "high", now, lastSentAt, dailyCount: 0 }),
    ).toBe(false);
  });

  it("respects quiet hours for non-high priority", () => {
    const quietNow = new Date("2026-01-01T23:00:00");
    expect(
      shouldSuppress({
        type: "jam_threshold",
        priority: "medium",
        now: quietNow,
        quietHours: { from: "22:00", to: "07:00" },
        lastSentAt: null,
        dailyCount: 0,
      }),
    ).toBe(true);
  });

  it("overrides quiet hours for high priority", () => {
    const quietNow = new Date("2026-01-01T23:00:00");
    expect(
      shouldSuppress({
        type: "tunnel_closed",
        priority: "high",
        now: quietNow,
        quietHours: { from: "22:00", to: "07:00" },
        lastSentAt: null,
        dailyCount: 0,
      }),
    ).toBe(false);
  });

  it("cooldownFor returns a sane default for unknown types", () => {
    expect(cooldownFor("restriction" as never)).toBeGreaterThan(0);
  });
});
