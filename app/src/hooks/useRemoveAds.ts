import { useCallback, useEffect, useRef, useState } from "react";
import { Preferences } from "@capacitor/preferences";
import {
  fetchRemoveAdsEntitlement,
  getRemoveAdsOffer,
  resolveRemoveAds,
  restoreRemoveAds,
  type PurchaseOutcome,
  type RemoveAdsOffer,
} from "../iap/RevenueCat";

const REMOVE_ADS_CACHE_KEY = "sanbernardino:removeAds";

async function readCachedRemoveAds(): Promise<boolean> {
  const { value } = await Preferences.get({ key: REMOVE_ADS_CACHE_KEY });
  return value === "true";
}

async function writeCachedRemoveAds(value: boolean): Promise<void> {
  await Preferences.set({ key: REMOVE_ADS_CACHE_KEY, value: value ? "true" : "false" });
}

export interface UseRemoveAds {
  /** Whether ads should stay hidden. Starts from the local cache, then RevenueCat confirms it. */
  removeAds: boolean;
  /** True once the initial cache+RevenueCat check has settled — gate ad init on this. */
  ready: boolean;
  offer: RemoveAdsOffer | null;
  purchase(): Promise<PurchaseOutcome>;
  restore(): Promise<PurchaseOutcome>;
}

export function useRemoveAds(): UseRemoveAds {
  const [removeAds, setRemoveAds] = useState(false);
  const [ready, setReady] = useState(false);
  const [offer, setOffer] = useState<RemoveAdsOffer | null>(null);
  const offerRef = useRef<RemoveAdsOffer | null>(null);

  useEffect(() => {
    (async () => {
      const [cached, live] = await Promise.all([readCachedRemoveAds(), fetchRemoveAdsEntitlement()]);
      const resolved = resolveRemoveAds(live, cached);
      setRemoveAds(resolved);
      setReady(true);
      if (resolved) void writeCachedRemoveAds(true);

      const availableOffer = await getRemoveAdsOffer();
      offerRef.current = availableOffer;
      setOffer(availableOffer);
    })();
  }, []);

  const purchase = useCallback(async (): Promise<PurchaseOutcome> => {
    if (!offerRef.current) return { status: "error", message: "Offre indisponible pour le moment." };
    const outcome = await offerRef.current.purchase();
    if (outcome.status === "success") {
      setRemoveAds(true);
      void writeCachedRemoveAds(true);
    }
    return outcome;
  }, []);

  const restore = useCallback(async (): Promise<PurchaseOutcome> => {
    const outcome = await restoreRemoveAds();
    if (outcome.status === "success") {
      setRemoveAds(true);
      void writeCachedRemoveAds(true);
    }
    return outcome;
  }, []);

  return { removeAds, ready, offer, purchase, restore };
}
