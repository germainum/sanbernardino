import { ADMOB_APP_ID, ADMOB_BANNER_ID, ADMOB_INTERSTITIAL_ID } from "../lib/env";

/**
 * Google's public test App ID and ad units — functional without an AdMob account,
 * genuinely serve test creatives, but never earn revenue. See
 * https://developers.google.com/admob/android/test-ads.
 */
export const AD_TEST_IDS = {
  appId: "ca-app-pub-3940256099942544~3347511713",
  banner: "ca-app-pub-3940256099942544/6300978111",
  interstitial: "ca-app-pub-3940256099942544/1033173712",
} as const;

/**
 * Real AdMob IDs (ADMOB_* env vars, set only in .env.production) take over from the test IDs
 * once all three are present — see addendum-monetisation-san-bernardino.md §2/§7. `isTest`
 * drives AdMob.initialize's `initializeForTesting` flag in AdManager.ts: clicking your own
 * real ads during dev risks an AdMob account suspension, so this must default to test
 * whenever real IDs aren't fully configured, never the other way round.
 */
export function getAdIds(): { appId: string; banner: string; interstitial: string; isTest: boolean } {
  if (ADMOB_APP_ID && ADMOB_BANNER_ID && ADMOB_INTERSTITIAL_ID) {
    return { appId: ADMOB_APP_ID, banner: ADMOB_BANNER_ID, interstitial: ADMOB_INTERSTITIAL_ID, isTest: false };
  }
  return { ...AD_TEST_IDS, isTest: true };
}

/** addendum-monetisation-san-bernardino.md §4: at most ~1 interstitial per 3-4 min of usage. */
export const INTERSTITIAL_MIN_INTERVAL_MS = 3.5 * 60 * 1000;

/**
 * Forbidden zones (never place a banner or an interstitial trigger here), per
 * addendum-monetisation-san-bernardino.md §3: the verdict hero, the route cards, the
 * direction switch, and the Gothard panel — anywhere a decision-critical tap happens. The
 * banner is anchored bottom, physically outside all of these; interstitials only ever
 * trigger on return from a secondary screen (e.g. Settings), never at launch, never while
 * data is loading, and never overlapping a tappable element (>=32px margin).
 */
export const FORBIDDEN_AD_ZONES = ["verdict-hero", "route-card", "direction-switch", "gothard-panel"] as const;

/**
 * Pure cadence gate — no launch interstitial (ever), no more than one per
 * INTERSTITIAL_MIN_INTERVAL_MS. `now`/`lastShownAt` are epoch ms, passed in rather than
 * read internally so this stays a pure, testable function.
 */
export function canShowInterstitial(lastShownAt: number | null, now: number, isAppLaunch: boolean): boolean {
  if (isAppLaunch) return false;
  if (lastShownAt == null) return true;
  return now - lastShownAt >= INTERSTITIAL_MIN_INTERVAL_MS;
}
