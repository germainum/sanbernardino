import { Capacitor } from "@capacitor/core";
import { REVENUECAT_API_KEY } from "../lib/env";

const REMOVE_ADS_ENTITLEMENT = "remove_ads";

export type PurchaseOutcome = { status: "success" } | { status: "cancelled" } | { status: "error"; message: string };

export interface RemoveAdsOffer {
  priceString: string;
  purchase(): Promise<PurchaseOutcome>;
}

let configured = false;

async function loadPurchases() {
  // Dynamic import: this module must stay a safe no-op on web/PWA builds, where
  // @revenuecat/purchases-capacitor's native bridge doesn't exist — same convention as
  // AdManager.ts's loadAdMob().
  return import("@revenuecat/purchases-capacitor");
}

async function ensureConfigured(): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || !REVENUECAT_API_KEY) return false;
  if (configured) return true;
  const { Purchases } = await loadPurchases();
  await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
  configured = true;
  return true;
}

/** Pure: no appUserID is set at configure time, so this checks RevenueCat's own anonymous ID's entitlements. */
export function hasRemoveAdsEntitlement(entitlements: { active: Record<string, unknown> }): boolean {
  return REMOVE_ADS_ENTITLEMENT in entitlements.active;
}

/**
 * Never lets a network hiccup downgrade a previously-confirmed purchase — null means "couldn't
 * ask RevenueCat right now", in which case the caller should keep trusting its local cache.
 */
export function resolveRemoveAds(live: boolean | null, cached: boolean): boolean {
  return live ?? cached;
}

/** true/false = confirmed by RevenueCat; null = not native, not configured (no API key yet), or unreachable. */
export async function fetchRemoveAdsEntitlement(): Promise<boolean | null> {
  if (!(await ensureConfigured())) return null;
  const { Purchases } = await loadPurchases();
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return hasRemoveAdsEntitlement(customerInfo.entitlements);
  } catch {
    return null;
  }
}

function purchaseErrorOutcome(error: unknown): PurchaseOutcome {
  const err = error as { userCancelled?: boolean | null; message?: string } | null;
  if (err?.userCancelled) return { status: "cancelled" };
  return { status: "error", message: err?.message ?? "Achat impossible pour le moment." };
}

/**
 * The remove_ads product should be configured as RevenueCat's "Lifetime" package type (a
 * one-time, non-consumable purchase) — falls back to the first available package so a
 * differently-configured offering still works.
 */
export async function getRemoveAdsOffer(): Promise<RemoveAdsOffer | null> {
  if (!(await ensureConfigured())) return null;
  const { Purchases } = await loadPurchases();
  const offerings = await Purchases.getOfferings();
  const pkg = offerings.current?.lifetime ?? offerings.current?.availablePackages[0] ?? null;
  if (!pkg) return null;

  return {
    priceString: pkg.product.priceString,
    async purchase() {
      try {
        const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
        return hasRemoveAdsEntitlement(customerInfo.entitlements)
          ? { status: "success" }
          : { status: "error", message: "Achat confirmé mais l'accès n'a pas pu être activé — réessaie « Restaurer mes achats »." };
      } catch (error) {
        return purchaseErrorOutcome(error);
      }
    },
  };
}

/** Mandatory per store review guidelines — recovers the entitlement on reinstall/new device via the Play account. */
export async function restoreRemoveAds(): Promise<PurchaseOutcome> {
  if (!(await ensureConfigured())) return { status: "error", message: "Service d'achat indisponible pour le moment." };
  const { Purchases } = await loadPurchases();
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    return hasRemoveAdsEntitlement(customerInfo.entitlements)
      ? { status: "success" }
      : { status: "error", message: "Aucun achat « Supprimer la pub » trouvé sur ce compte." };
  } catch (error) {
    return purchaseErrorOutcome(error);
  }
}
