import type { DecideResult, RoutesSnapshot } from "./types.js";

/**
 * Ported verbatim from san-bernardino-decision.jsx's decide(). Non-negotiable rules
 * (prompt-implementation-san-bernardino.md §5):
 *  1. Gothard is only proposed if the A13 axis is saturated AND its total time (detour
 *     included) is strictly less than the best available A13 time.
 *  2. If everything is saturated and Gothard doesn't help, verdict is "attente".
 *  3. "Shortest" is always computed toward the real destination — callers must pass a
 *     snapshot whose totalMin values already reflect the user's actual destination.
 */
export function decide(snapshot: RoutesSnapshot): DecideResult {
  const { tunnel, col, gothard } = snapshot;
  const tunnelBlocked = tunnel.state === "stop";
  const colBlocked = col.state === "stop";

  const options: Array<{ route: "tunnel" | "col"; t: number }> = [];
  if (!tunnelBlocked && tunnel.totalMin != null) options.push({ route: "tunnel", t: tunnel.totalMin });
  if (!colBlocked && col.totalMin != null) options.push({ route: "col", t: col.totalMin });

  const saturated = options.length === 0;

  if (saturated) {
    const bestA13 = Math.min(tunnel.totalMin ?? Infinity, col.totalMin ?? Infinity);
    const bestText = Number.isFinite(bestA13) ? `${bestA13} min` : "l'attente";

    if (gothard && gothard.totalMin != null && gothard.totalMin < bestA13) {
      return {
        verdict: "gothard",
        saturated,
        reason: `Axe A13 saturé. Le Gothard est plus court : ${gothard.totalMin} min contre ${bestText}. Bascule sur l'A2.`,
      };
    }
    return {
      verdict: "attente",
      saturated,
      reason: gothard && gothard.totalMin != null
        ? `Tout est saturé, Gothard compris (${gothard.totalMin} min, plus long). Aucune déviation ne fait gagner de temps : patiente.`
        : `Axe A13 saturé et aucune alternative plus rapide. Mieux vaut patienter.`,
    };
  }

  options.sort((a, b) => a.t - b.t);
  const best = options[0];

  if (best.route === "tunnel") {
    return {
      verdict: "tunnel",
      saturated,
      reason: colBlocked
        ? "Le tunnel est ouvert et fluide ; le col est fermé de toute façon."
        : `Le tunnel reste le plus rapide (${tunnel.totalMin} min). Le col n'apporte rien.`,
    };
  }
  return {
    verdict: "col",
    saturated,
    reason: tunnelBlocked
      ? `Tunnel fermé. Le col est ouvert et te fait passer en ${col.totalMin} min.`
      : `Bouchon au tunnel. Le col est plus court aujourd'hui : ${col.totalMin} contre ${tunnel.totalMin} min.`,
  };
}
