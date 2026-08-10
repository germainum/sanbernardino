import { Capacitor } from "@capacitor/core";
import { AD_TEST_IDS, canShowInterstitial } from "./placement";

let lastInterstitialAt: number | null = null;
let isFirstScreenSinceLaunch = true;

async function loadAdMob() {
  // Dynamic import: this module must stay a safe no-op on web/PWA builds, where
  // @capacitor-community/admob's native bridge doesn't exist.
  return import("@capacitor-community/admob");
}

/**
 * Requests UMP consent (EEA/UK/Switzerland, addendum-monetisation-san-bernardino.md §6),
 * then initializes AdMob in test mode and shows the banner. No-op if the user has the
 * remove_ads entitlement, or when running as a plain web/PWA build (no native ad SDK there).
 */
export async function initAds(removeAds: boolean): Promise<void> {
  if (removeAds || !Capacitor.isNativePlatform()) return;

  const { AdMob } = await loadAdMob();

  try {
    const consentInfo = await AdMob.requestConsentInfo();
    if (consentInfo.isConsentFormAvailable && consentInfo.status === "REQUIRED") {
      await AdMob.showConsentForm();
    }
  } catch {
    // Consent form unavailable/failed — fall back to serving non-personalized ads rather
    // than none, per addendum §6 ("Sans consentement -> pubs non personnalisées").
  }

  await AdMob.initialize({ initializeForTesting: true });
  await showBanner();
}

/** Bottom-anchored adaptive banner — outside every forbidden zone in placement.ts. */
export async function showBanner(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const { AdMob, BannerAdPosition, BannerAdSize } = await loadAdMob();
  await AdMob.showBanner({
    adId: AD_TEST_IDS.banner,
    adSize: BannerAdSize.ADAPTIVE_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
  });
}

export async function hideBanner(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const { AdMob } = await loadAdMob();
  await AdMob.hideBanner();
}

/**
 * Call this on return from a secondary screen (Settings, a webcam detail view) — never at
 * launch, never while /api/state is loading. The cadence gate (canShowInterstitial) is the
 * actual enforcement; this function just wires it to the real AdMob calls and tracks state.
 */
export async function maybeShowInterstitial(removeAds: boolean): Promise<void> {
  if (removeAds || !Capacitor.isNativePlatform()) return;

  const isLaunch = isFirstScreenSinceLaunch;
  isFirstScreenSinceLaunch = false;

  const now = Date.now();
  if (!canShowInterstitial(lastInterstitialAt, now, isLaunch)) return;

  const { AdMob } = await loadAdMob();
  await AdMob.prepareInterstitial({ adId: AD_TEST_IDS.interstitial });
  await AdMob.showInterstitial();
  lastInterstitialAt = now;
}

/** Test-only: resets module state between test cases. */
export function __resetAdManagerStateForTests(): void {
  lastInterstitialAt = null;
  isFirstScreenSinceLaunch = true;
}
