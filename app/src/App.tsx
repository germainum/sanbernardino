import { useEffect, useRef, useState } from "react";
import { Home } from "./screens/Home";
import { Settings } from "./screens/Settings";
import { hideBanner, initAds, maybeShowInterstitial } from "./ads/AdManager";
import { useRemoveAds } from "./hooks/useRemoveAds";

type Screen = "home" | "settings";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const { removeAds, ready, offer, purchase, restore } = useRemoveAds();
  const adsInitialized = useRef(false);

  useEffect(() => {
    if (!ready) return;
    if (removeAds) {
      // Only hide if we actually initialized a banner earlier this session — calling
      // hideBanner() when none was ever shown (e.g. removeAds was already true on cold
      // start) has nothing to undo.
      if (adsInitialized.current) void hideBanner();
      return;
    }
    adsInitialized.current = true;
    void initAds(false);
  }, [ready, removeAds]);

  function openSettings() {
    setScreen("settings");
  }

  function closeSettings() {
    setScreen("home");
    // Interstitial on RETURN from a secondary screen, never at launch — exactly the
    // placement addendum-monetisation-san-bernardino.md §3/§4 calls for.
    void maybeShowInterstitial(removeAds);
  }

  if (screen === "settings") {
    return <Settings onBack={closeSettings} removeAds={removeAds} offer={offer} onPurchase={purchase} onRestore={restore} />;
  }
  return <Home onOpenSettings={openSettings} />;
}
