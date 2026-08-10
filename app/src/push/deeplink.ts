import type { Direction } from "@san-bernardino/core";

/**
 * Parses "sanbernardino://home?dir=italie" into a direction, per
 * fonctionnalites-natives-san-bernardino.md §8's deeplink payload field. Returns {} for any
 * URL that isn't one of ours rather than throwing — deeplink handlers should degrade to a
 * no-op on anything unexpected, not crash the app.
 */
export function parseDeeplink(url: string): { direction?: Direction } {
  try {
    const parsed = new URL(url);
    const dir = parsed.searchParams.get("dir");
    if (dir === "suisse" || dir === "italie") return { direction: dir };
    return {};
  } catch {
    return {};
  }
}
