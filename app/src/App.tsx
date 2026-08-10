import { useEffect, useState } from "react";
import { Home } from "./screens/Home";
import { Settings } from "./screens/Settings";
import { initAds, maybeShowInterstitial } from "./ads/AdManager";

type Screen = "home" | "settings";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");

  useEffect(() => {
    // remove_ads entitlement wiring lands in Phase 11 alongside real Play Billing +
    // server-side receipt validation (addendum-monetisation-san-bernardino.md §5) — for now
    // this always initializes ads (a no-op on web/PWA builds regardless).
    void initAds(false);
  }, []);

  function openSettings() {
    setScreen("settings");
  }

  function closeSettings() {
    setScreen("home");
    // Interstitial on RETURN from a secondary screen, never at launch — exactly the
    // placement addendum-monetisation-san-bernardino.md §3/§4 calls for.
    void maybeShowInterstitial(false);
  }

  if (screen === "settings") {
    return <Settings onBack={closeSettings} />;
  }
  return <Home onOpenSettings={openSettings} />;
}
