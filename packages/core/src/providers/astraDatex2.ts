import type { RouteState, ViasuisseRaw } from "../types.js";
import { JAM_GO_MAX_MIN, JAM_STOP_MIN } from "../constants.js";

/**
 * Parses the DATEX II "Traffic Situations" feed from opentransportdata.swiss (ASTRA/FEDRO's
 * official open-data platform — see reference_san_bernardino_supabase.md memory) into the
 * San Bernardino corridor's ViasuisseRaw shape.
 *
 * Why this exists instead of calling the Viasuisse API directly: the SRG SSR developer
 * portal's Viasuisse product was removed, and a direct commercial Viasuisse account was
 * refused. ASTRA's platform republishes the same underlying data as free, self-serve open
 * government data (confirmed live: situation records carry
 * `<providerIdentifier><provider>Viasuisse</provider>...`), so this is the real data source,
 * just reached through a different door.
 *
 * The feed is national (~20k+ situations, ~23MB per full pull) with no server-side filter
 * for a specific road — this module does the filtering. It's a full-file text scan rather
 * than an XML DOM parse: Deno's edge runtime + this package's isomorphic (browser/Node/Deno)
 * target make a full DOMParser dependency awkward, and DATEX II's structure is regular
 * enough that scoped regexes over per-record chunks are reliable in practice.
 */

const SITUATION_SPLIT = /(?=<dx223:situation xsi:type)/g;
const SITUATION_CLOSE = "</dx223:situation>";

interface ParsedSituation {
  /** Whether ASTRA currently considers this bulletin valid (NOT whether it's happening this second — see isCurrentlyInEffect). */
  validityStatus: string | null;
  causeType: string | null;
  /** Meters, from dx223:lengthAffected. */
  lengthAffected: number | null;
  /** Minutes of delay, from the "Zeitverlust Anz. [min]" figure some AbnormalTraffic/congestion records carry. */
  timeLossMin: number | null;
  overallStartTime: Date | null;
  validPeriodStart: Date | null;
  validPeriodEnd: Date | null;
  /** The "description"-type generalPublicComment, per language, e.g. { "de-CH": "...", "fr-CH": "..." }. */
  commentByLang: Record<string, string>;
  /** Raw chunk, kept only for keyword matching (road/junction names live in the comment text, not a structured field here). */
  raw: string;
}

function extractTag(chunk: string, tag: string): string | null {
  const m = chunk.match(new RegExp(`<dx223:${tag}[^>]*>([^<]*)<`));
  return m ? m[1] : null;
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Extracts the "description"-type generalPublicComment block's per-language values. */
function extractDescriptionComments(chunk: string): Record<string, string> {
  const blocks = chunk.split("<dx223:generalPublicComment").slice(1);
  const descriptionBlock = blocks.map((b) => "<dx223:generalPublicComment" + b).find((b) => />description</.test(b));
  if (!descriptionBlock) return {};
  const out: Record<string, string> = {};
  const valueRe = /<dx223:value[^>]*lang="([^"]+)"[^>]*>([^<]*)</g;
  let m: RegExpExecArray | null;
  while ((m = valueRe.exec(descriptionBlock))) {
    out[m[1]] = m[2].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  }
  return out;
}

function parseSituation(rawChunk: string): ParsedSituation {
  const closeIdx = rawChunk.indexOf(SITUATION_CLOSE);
  const chunk = closeIdx === -1 ? rawChunk : rawChunk.slice(0, closeIdx + SITUATION_CLOSE.length);

  const lengthText = extractTag(chunk, "lengthAffected");
  const timeLossMatch = chunk.match(/Zeitverlust Anz\. \[min\]\s*([\d.]+)/);

  return {
    validityStatus: extractTag(chunk, "validityStatus"),
    causeType: extractTag(chunk, "causeType"),
    lengthAffected: lengthText ? Number.parseFloat(lengthText) : null,
    timeLossMin: timeLossMatch ? Number.parseFloat(timeLossMatch[1]) : null,
    overallStartTime: parseDate(extractTag(chunk, "overallStartTime")),
    validPeriodStart: parseDate(extractTag(chunk, "startOfPeriod")),
    validPeriodEnd: parseDate(extractTag(chunk, "endOfPeriod")),
    commentByLang: extractDescriptionComments(chunk),
    raw: chunk,
  };
}

/**
 * A published bulletin (validityStatus=active) can describe a future or past scheduled
 * window (e.g. "nights of Aug 18-19"), not necessarily right now — this is the check that
 * actually answers "is this affecting the road at `now`".
 */
function isCurrentlyInEffect(s: ParsedSituation, now: Date): boolean {
  if (s.validityStatus !== "active") return false;
  const start = s.validPeriodStart ?? s.overallStartTime;
  if (start && start.getTime() > now.getTime()) return false;
  if (s.validPeriodEnd && s.validPeriodEnd.getTime() < now.getTime()) return false;
  return true;
}

type Severity = 0 | 1 | 2 | 3; // 0 none, 1 minor caution, 2 caution, 3 stop

function classify(s: ParsedSituation): { severity: Severity; label: string } {
  const de = s.commentByLang["de-CH"] ?? "";
  const closed = /Tunnel gesperrt|Strecke gesperrt/.test(de);
  if (closed) return { severity: 3, label: /Tunnel gesperrt/.test(de) ? "tunnel_closed" : "route_closed" };

  if (s.causeType === "congestion" || /\bStau\b/.test(de)) {
    const min = s.timeLossMin ?? (s.lengthAffected != null ? (s.lengthAffected / 1000) * 2 : null); // rough fallback: ~2min/km if no explicit time loss
    if (min != null && min > JAM_STOP_MIN) return { severity: 3, label: "jam" };
    if (min == null || min > JAM_GO_MAX_MIN) return { severity: 2, label: "jam" };
    return { severity: 1, label: "jam" };
  }

  if (/stockender Verkehr/.test(de)) return { severity: 2, label: "slow" };
  if (/Ausfahrt gesperrt|Einfahrt gesperrt/.test(de)) return { severity: 1, label: "ramp_closed" }; // localized, doesn't block through-traffic
  if (/Verkehrsbehinderung|Baustelle/.test(de)) return { severity: 1, label: "roadworks" };
  return { severity: 0, label: "none" };
}

function toDetail(s: ParsedSituation, label: string): string {
  const fr = s.commentByLang["fr-CH"];
  const lengthKm = s.lengthAffected != null ? Math.round((s.lengthAffected / 1000) * 10) / 10 : null;
  if (label === "tunnel_closed") return "Tunnel fermé";
  if (label === "route_closed") return "Route fermée" + (lengthKm != null ? ` · ${lengthKm} km` : "");
  if (label === "jam") {
    const min = s.timeLossMin != null ? Math.round(s.timeLossMin) : null;
    return `Bouchon${lengthKm != null ? ` ${lengthKm} km` : ""}${min != null ? ` · ~${min} min` : ""}`;
  }
  if (label === "slow") return "Trafic ralenti" + (lengthKm != null ? ` · ${lengthKm} km` : "");
  if (label === "roadworks") return "Chantier" + (lengthKm != null ? ` · ${lengthKm} km` : "");
  return fr ?? "Perturbation";
}

const SEVERITY_TO_STATE: Record<Severity, RouteState> = { 0: "go", 1: "caution", 2: "caution", 3: "stop" };

/**
 * Location keyword sets, scoped to junction/structure names specific to each crossing —
 * NOT bare "San Bernardino"/"Gotthard", which ASTRA uses as direction labels for the whole
 * ~130km A13 (Bellinzona<->Chur) and ~100km A2 (Chiasso<->Basel) corridors respectively, far
 * beyond the actual pass/tunnel. Best-effort against real live data inspected 2026-08-10;
 * the exact tunnel-closure wording couldn't be verified against a real example (San
 * Bernardino tunnel had no active closure at inspection time) — the Gotthard tunnel pattern
 * (confirmed live: "Tunnel Gotthard-Tunnel ... Sachlage: Tunnel gesperrt") is the template
 * this mirrors for San Bernardino's own tunnel/pass naming.
 */
const TUNNEL_KEYWORDS = [/San[\s-]?Bernardino[\s-]?Tunnel/i, /Tunnel[^.]{0,20}San[\s-]?Bernardino/i, /Galleria[^.]{0,20}San Bernardino/i];
const PASS_KEYWORDS = [/Passstrasse/i, /San[\s-]?Bernardino[\s-]?Pass/i, /Pass[^.]{0,10}San Bernardino/i, /Pian San Giacomo/i, /Passh(ö|oe)he/i];
const GOTTHARD_KEYWORDS = [/Gotthard[\s-]?Tunnel/i, /Galleria[^.]{0,20}Gottardo/i];

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

/** Picks the worst-severity currently-in-effect situation matching the given keyword set, or null if none. */
function worstMatch(situations: ParsedSituation[], now: Date, keywords: RegExp[]): { severity: Severity; label: string; situation: ParsedSituation } | null {
  let best: { severity: Severity; label: string; situation: ParsedSituation } | null = null;
  for (const s of situations) {
    if (!isCurrentlyInEffect(s, now)) continue;
    if (!matchesAny(s.raw, keywords)) continue;
    const { severity, label } = classify(s);
    if (!best || severity > best.severity) best = { severity, label, situation: s };
  }
  return best;
}

export function parseAstraTrafficSituations(xml: string, now: Date = new Date()): ViasuisseRaw {
  const chunks = xml.split(SITUATION_SPLIT).filter((c) => c.includes("Bernardino") || c.includes("Gotthard") || c.includes("Gottardo"));
  const situations = chunks.map(parseSituation);

  const tunnelMatch = worstMatch(situations, now, TUNNEL_KEYWORDS);
  const passMatch = worstMatch(situations, now, PASS_KEYWORDS);
  const gothardMatch = worstMatch(situations, now, GOTTHARD_KEYWORDS);

  return {
    tunnel: {
      state: tunnelMatch ? SEVERITY_TO_STATE[tunnelMatch.severity] : "go",
      detail: tunnelMatch ? toDetail(tunnelMatch.situation, tunnelMatch.label) : undefined,
    },
    col: {
      state: passMatch ? SEVERITY_TO_STATE[passMatch.severity] : "go",
      detail: passMatch ? toDetail(passMatch.situation, passMatch.label) : undefined,
      // The pass is always seasonally closed roughly Nov-May regardless of today's live
      // bulletins (constants.md/prompt-implementation §3.1) — a real winter closure bulletin
      // would additionally push state to "stop" above via the same matching.
      seasonal: true,
    },
    gothard: {
      state: gothardMatch ? SEVERITY_TO_STATE[gothardMatch.severity] : "go",
      detail: gothardMatch ? toDetail(gothardMatch.situation, gothardMatch.label) : undefined,
    },
  };
}
