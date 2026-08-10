import type { Direction, RoutesRaw, ViasuisseRaw } from "../types.js";

/**
 * The swap seam (see plan-the-buidling-of-sparkling-clock.md "Architecture decisions"):
 * decide()/normalize()/detectEvents() only ever see normalized shapes, never a provider's
 * raw payload. Swapping Mock -> Real here changes zero lines of decision logic or UI.
 */
export interface ViasuisseProvider {
  fetchViasuisse(): Promise<ViasuisseRaw>;
}

export interface RoutesProvider {
  fetchGoogleRoutes(direction: Direction): Promise<RoutesRaw>;
}
