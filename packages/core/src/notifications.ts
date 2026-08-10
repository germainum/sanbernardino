import type { DetectedEvent } from "./types.js";

export interface PushPayload {
  title: string;
  body: string;
  deeplink: string;
}

/**
 * Ported from fonctionnalites-natives-san-bernardino.md §2 (message examples) and §8
 * (payload shape incl. deeplink). The verdict message reuses decide()'s own `reason` text
 * (carried in the event payload) rather than re-deriving wording — same single-source-of-
 * truth principle as everywhere else the verdict is surfaced.
 */
export function buildPushPayload(event: DetectedEvent): PushPayload {
  const deeplink = `sanbernardino://home?dir=${event.direction}`;
  const title = "San Bernardino";

  switch (event.type) {
    case "verdict": {
      const reason = typeof event.payload.reason === "string" ? event.payload.reason : "Le meilleur itinéraire a changé.";
      return { title: "Changement d'itinéraire · San Bernardino", body: reason, deeplink };
    }
    case "col_open":
      return { title, body: "Le col du San Bernardino vient d'ouvrir.", deeplink };
    case "tunnel_closed": {
      const detail = typeof event.payload.detail === "string" ? event.payload.detail : "incident";
      return { title, body: `Tunnel fermé (${detail}). Le col reste ouvert.`, deeplink };
    }
    case "jam_threshold": {
      const delay = event.payload.delay;
      return { title, body: `Bouchon en formation au tunnel : +${delay} min.`, deeplink };
    }
    case "gothard": {
      const eta = event.payload.eta;
      return { title, body: `A13 saturé : le Gothard est plus rapide (${eta} min).`, deeplink };
    }
    case "cleared":
      return { title, body: "Le tunnel se dégage : retard < 10 min.", deeplink };
    case "restriction":
      return { title, body: "Nouvelle restriction en vigueur.", deeplink };
    default:
      return { title, body: "Mise à jour du trafic.", deeplink };
  }
}
