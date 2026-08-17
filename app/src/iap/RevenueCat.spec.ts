import { describe, expect, it } from "vitest";
import { hasRemoveAdsEntitlement, resolveRemoveAds } from "./RevenueCat";

describe("hasRemoveAdsEntitlement()", () => {
  it("is true when remove_ads is in the active entitlements map", () => {
    expect(hasRemoveAdsEntitlement({ active: { remove_ads: {} } })).toBe(true);
  });

  it("is false when the active map is empty", () => {
    expect(hasRemoveAdsEntitlement({ active: {} })).toBe(false);
  });

  it("is false when only a different entitlement is active", () => {
    expect(hasRemoveAdsEntitlement({ active: { some_other_entitlement: {} } })).toBe(false);
  });
});

describe("resolveRemoveAds()", () => {
  it("trusts a confirmed live true", () => {
    expect(resolveRemoveAds(true, false)).toBe(true);
  });

  it("trusts a confirmed live false, even over a stale cached true", () => {
    expect(resolveRemoveAds(false, true)).toBe(false);
  });

  it("falls back to the cache when live is unreachable (null)", () => {
    expect(resolveRemoveAds(null, true)).toBe(true);
    expect(resolveRemoveAds(null, false)).toBe(false);
  });
});
