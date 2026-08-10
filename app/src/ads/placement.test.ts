import { describe, expect, it } from "vitest";
import { canShowInterstitial, INTERSTITIAL_MIN_INTERVAL_MS } from "./placement";

describe("canShowInterstitial()", () => {
  const now = 1_000_000;

  it("never allows an interstitial on app launch", () => {
    expect(canShowInterstitial(null, now, true)).toBe(false);
    expect(canShowInterstitial(now - INTERSTITIAL_MIN_INTERVAL_MS * 10, now, true)).toBe(false);
  });

  it("allows the first interstitial after launch when none has been shown yet", () => {
    expect(canShowInterstitial(null, now, false)).toBe(true);
  });

  it("blocks a second interstitial within the cooldown window", () => {
    expect(canShowInterstitial(now - INTERSTITIAL_MIN_INTERVAL_MS / 2, now, false)).toBe(false);
  });

  it("allows another interstitial once the cooldown has elapsed", () => {
    expect(canShowInterstitial(now - INTERSTITIAL_MIN_INTERVAL_MS, now, false)).toBe(true);
    expect(canShowInterstitial(now - INTERSTITIAL_MIN_INTERVAL_MS - 1, now, false)).toBe(true);
  });
});
