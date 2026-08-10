import { afterEach, describe, expect, it, vi } from "vitest";
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

describe("getAdIds()", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("defaults to Google's test IDs when no real AdMob env vars are set", async () => {
    vi.resetModules();
    const { getAdIds, AD_TEST_IDS } = await import("./placement");
    expect(getAdIds()).toEqual({ ...AD_TEST_IDS, isTest: true });
  });

  it("switches to the real IDs once all three env vars are set", async () => {
    vi.stubEnv("VITE_ADMOB_APP_ID", "ca-app-pub-1~1");
    vi.stubEnv("VITE_ADMOB_BANNER_ID", "ca-app-pub-1/2");
    vi.stubEnv("VITE_ADMOB_INTERSTITIAL_ID", "ca-app-pub-1/3");
    vi.resetModules();
    const { getAdIds } = await import("./placement");
    expect(getAdIds()).toEqual({ appId: "ca-app-pub-1~1", banner: "ca-app-pub-1/2", interstitial: "ca-app-pub-1/3", isTest: false });
  });

  it("stays on test IDs if only some of the real env vars are set", async () => {
    vi.stubEnv("VITE_ADMOB_APP_ID", "ca-app-pub-1~1");
    vi.resetModules();
    const { getAdIds, AD_TEST_IDS } = await import("./placement");
    expect(getAdIds()).toEqual({ ...AD_TEST_IDS, isTest: true });
  });
});
