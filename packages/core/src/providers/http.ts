import type { Direction, RoutesRaw, ViasuisseRaw } from "../types.js";
import type { RoutesProvider, ViasuisseProvider } from "./types.js";

export interface ViasuisseHttpConfig {
  /**
   * Reads the latest parsed road-status snapshot. Injected rather than fetched here directly:
   * the real upstream feed (ASTRA/opentransportdata.swiss's DATEX II Traffic Situations
   * export — see astraDatex2.ts) is a ~23MB national dump with no server-side filter, so
   * fetching it on every 3-min poll would be hundreds of GB/month. Instead a separate,
   * slower-cadence Edge Function (`refresh-road-status`, every ~30min) fetches + parses it
   * via parseAstraTrafficSituations() and upserts the result into a `road_status_cache` table;
   * this provider just reads that cache. See reference_san_bernardino_supabase.md memory for
   * why the original Viasuisse-direct/SRG-SSR-portal auth plan (VIASUISSE_TOKEN_URL etc.)
   * was abandoned — both access paths turned out to be dead ends.
   */
  readCache: () => Promise<ViasuisseRaw>;
}

export class RealViasuisseProvider implements ViasuisseProvider {
  private readonly config: ViasuisseHttpConfig;

  constructor(config: ViasuisseHttpConfig) {
    this.config = config;
  }

  async fetchViasuisse(): Promise<ViasuisseRaw> {
    return this.config.readCache();
  }
}

export interface RoutesHttpConfig {
  apiKey: string;
  /** Overridable for tests; defaults to the real Google Routes endpoint. */
  endpoint?: string;
}

interface LatLng {
  latitude: number;
  longitude: number;
}

// v1 default destinations per prompt-implementation-san-bernardino.md §3.2/§9.5:
// Coire (Chur) <-> Bellinzone. Free-text origin/destination is v1.1.
const CHUR: LatLng = { latitude: 46.8508, longitude: 9.532 };
const BELLINZONA: LatLng = { latitude: 46.1944, longitude: 9.0175 };

// "Via" waypoints used purely to steer computeRoutes onto one specific alpine crossing
// instead of whichever Google judges fastest overall. No stopover is requested, so these
// don't appear as legs in the result, only shape which road the route takes.
// - Passo San Bernardino (pass summit, ~2065m): only reachable via the col road, never the
//   tunnel or the Gotthard corridor — an unambiguous "force the col" waypoint.
// - Airolo (south portal town of the Gotthard road tunnel, A2): forces the Gotthard detour
//   corridor instead of the San Bernardino axis.
// - Tunnel needs no forcing waypoint: San Bernardino is the shorter of Chur<->Bellinzona's
//   two year-round routes, so it's what computeRoutes returns by default when open — exactly
//   the assumption this app's whole verdict logic (tunnel is the default recommendation)
//   already rests on.
const SAN_BERNARDINO_PASS: LatLng = { latitude: 46.4699, longitude: 9.1783 };
const GOTTHARD_TUNNEL_SOUTH: LatLng = { latitude: 46.5286, longitude: 8.6106 };

const ROUTES_ENDPOINT = "https://routes.googleapis.com/directions/v2:computeRoutes";

function endpointsFor(direction: Direction): { origin: LatLng; destination: LatLng } {
  return direction === "italie" ? { origin: CHUR, destination: BELLINZONA } : { origin: BELLINZONA, destination: CHUR };
}

function parseDurationMinutes(duration: unknown): number | null {
  if (typeof duration !== "string" || !duration.endsWith("s")) return null;
  const seconds = Number.parseInt(duration.slice(0, -1), 10);
  return Number.isFinite(seconds) ? Math.round(seconds / 60) : null;
}

/**
 * Phase 11 fill-in. Wires Google Routes `computeRoutes` (TRAFFIC_AWARE, departureTime=now)
 * per prompt-implementation-san-bernardino.md §3.2, computing tunnel/col/gothard travel
 * times toward the app's default destination pair (Coire/Bellinzone — see endpointsFor()).
 * Each route is requested independently so one closed/impassable leg (e.g. the col in
 * winter, which Google may report as ZERO_RESULTS/no route) degrades to `null` for that
 * route only, instead of failing the whole poll.
 */
export class RealRoutesProvider implements RoutesProvider {
  private readonly config: RoutesHttpConfig;

  constructor(config: RoutesHttpConfig) {
    this.config = config;
  }

  /**
   * Requests both the live (traffic-aware) duration and Google's `staticDuration` (its
   * traffic-free baseline for the same route) in one call. `staticDuration`, not
   * constants.BASE, is what normalize() uses as this route's baseMin — BASE's short figures
   * (8/34/42 min) are calibrated for the local crossing alone and would make
   * delay = total - base meaningless once totalMin is a real end-to-end trip (~100+ min for
   * Coire<->Bellinzone), see types.ts RoutesRaw.
   */
  private async computeMinutes(origin: LatLng, destination: LatLng, via?: LatLng): Promise<{ totalMin: number | null; baseMin: number | null }> {
    const body: Record<string, unknown> = {
      origin: { location: { latLng: origin } },
      destination: { location: { latLng: destination } },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
    };
    if (via) body.intermediates = [{ location: { latLng: via } }];

    let res: Response;
    try {
      res = await fetch(this.config.endpoint ?? ROUTES_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.config.apiKey,
          "X-Goog-FieldMask": "routes.duration,routes.staticDuration",
        },
        body: JSON.stringify(body),
      });
    } catch {
      return { totalMin: null, baseMin: null }; // network failure — degrade this route only
    }
    if (!res.ok) return { totalMin: null, baseMin: null }; // e.g. NOT_FOUND/ZERO_RESULTS when a crossing is impassable
    const data = await res.json().catch(() => null);
    return {
      totalMin: parseDurationMinutes(data?.routes?.[0]?.duration),
      baseMin: parseDurationMinutes(data?.routes?.[0]?.staticDuration),
    };
  }

  async fetchGoogleRoutes(direction: Direction): Promise<RoutesRaw> {
    const { origin, destination } = endpointsFor(direction);
    const [tunnel, col, gothard] = await Promise.all([
      this.computeMinutes(origin, destination),
      this.computeMinutes(origin, destination, SAN_BERNARDINO_PASS),
      this.computeMinutes(origin, destination, GOTTHARD_TUNNEL_SOUTH),
    ]);

    const bestA13 = [tunnel.totalMin, col.totalMin].filter((m): m is number => m != null);
    const gothardDetourMin = gothard.totalMin != null && bestA13.length > 0 ? Math.max(0, gothard.totalMin - Math.min(...bestA13)) : undefined;

    return {
      tunnelMin: tunnel.totalMin,
      colMin: col.totalMin,
      gothardMin: gothard.totalMin,
      gothardDetourMin,
      tunnelBaseMin: tunnel.baseMin ?? undefined,
      colBaseMin: col.baseMin ?? undefined,
      gothardBaseMin: gothard.baseMin ?? undefined,
    };
  }
}
