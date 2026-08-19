import type { RouteInfo } from "@san-bernardino/core";
import { C, STATE } from "../theme";
import { useLang, type Dictionary } from "../i18n";

type ComparedRoute = "tunnel" | "col";

interface RouteCardProps {
  route: ComparedRoute;
  name: string;
  data: RouteInfo;
  delay: number | null;
  recommended: boolean;
  distanceKm: number | null;
  altitudeM: number | null;
  cost: string;
  history: number[];
}

// Below this, "24 + 2 = 26" just restates the total and reads as stating the obvious.
const BREAKDOWN_THRESHOLD_MIN = 5;

function TunnelIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 20V11a7 7 0 0 1 14 0v9" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ColIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 19 9 8l4 5 3-4 5 10Z" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function FactRow({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ fontSize: 11.5, color: C.muted, fontWeight: 600 }}>
      <span aria-hidden="true">{icon} </span>
      {label}
    </div>
  );
}

/** Compares the window's endpoints rather than point-to-point, so a single noisy reading
 * doesn't flip the label — a small dead zone (±3 min) keeps genuinely flat series "stable". */
function trendLabel(history: number[], t: Dictionary): string {
  const diff = history[history.length - 1] - history[0];
  if (diff > 3) return t.routeCard.trendWorse;
  if (diff < -3) return t.routeCard.trendBetter;
  return t.routeCard.trendStable;
}

/** Compact sparkline (no axes/labels — "maintenant + tendance" carries the meaning, not a
 * labeled 3h history). Fixed small width so it never reads as an imposing full-width chart. */
function Sparkline({ history, color }: { history: number[]; color: string }) {
  const W = 100;
  const H = 22;
  const pad = 2;
  const max = Math.max(10, ...history);
  const min = Math.min(0, ...history);
  const range = Math.max(1, max - min);
  const stepX = (W - pad * 2) / (history.length - 1);
  const points = history.map((v, i) => `${pad + stepX * i},${H - pad - ((v - min) / range) * (H - pad * 2)}`);
  const lastX = pad + stepX * (history.length - 1);
  const lastY = H - pad - ((history[history.length - 1] - min) / range) * (H - pad * 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: "block", maxWidth: 100, marginTop: 4 }} preserveAspectRatio="none">
      <polyline points={points.join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="2.2" fill={color} />
    </svg>
  );
}

export function RouteCard({ route, name, data, delay, recommended, distanceKm, altitudeM, cost, history }: RouteCardProps) {
  const { t } = useLang();
  const st = STATE[data.state];
  // Tunnel/col share most of the same trip, so a nonzero numeric delay often just reflects
  // shared-highway traffic, not a problem specific to this crossing — only tint/attribute the
  // total to "a local issue" when the real road-status feed (state) confirms one.
  const localIssue = data.state !== "go";
  const totalColor = !localIssue ? C.ink : delay == null ? C.muted : delay < 40 ? C.amberDeep : C.coralDeep;
  const iconColor = route === "tunnel" ? C.mustard : C.muted;
  const showBreakdown = delay != null && delay > BREAKDOWN_THRESHOLD_MIN;

  return (
    <div
      style={{
        background: C.card,
        borderRadius: 22,
        padding: 14,
        border: `1.5px solid ${recommended ? C.mustard : "transparent"}`,
        boxShadow: recommended ? "0 8px 24px rgba(184,132,30,0.18)" : C.shadowCard,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {route === "tunnel" ? <TunnelIcon color={iconColor} /> : <ColIcon color={iconColor} />}
        <div style={{ fontSize: 15, fontWeight: recommended ? 800 : 700, color: C.ink, display: "flex", alignItems: "center", gap: 6 }}>
          {recommended && (
            <span
              aria-hidden="true"
              style={{
                width: 15,
                height: 15,
                borderRadius: "50%",
                background: C.mustard,
                color: C.ink,
                fontSize: 9,
                fontWeight: 800,
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✓
            </span>
          )}
          <span>{name}</span>
        </div>
      </div>

      <div style={{ fontSize: 21, fontWeight: 800, color: totalColor, lineHeight: 1.15, marginTop: 8 }}>
        {data.totalMin != null ? (
          <>
            {data.totalMin}
            <span style={{ fontSize: 11, fontWeight: 700 }}> {t.common.min}</span>
          </>
        ) : (
          "—"
        )}
      </div>
      {showBreakdown && (
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginTop: 2 }}>
          {data.baseMin} + {delay} = {data.totalMin ?? "—"} {t.common.min}
        </div>
      )}

      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
        <FactRow icon="✓" label={t.routeCard.trait[route]} />
        <FactRow icon={route === "tunnel" ? "🎫" : "🆓"} label={cost} />
        <FactRow icon={route === "tunnel" ? "📏" : "⛰"} label={route === "tunnel" ? `${distanceKm} km` : `${altitudeM} m`} />
      </div>

      <div style={{ marginTop: "auto", paddingTop: 8, borderTop: `1px solid ${C.line}` }}>
        {route === "tunnel" ? (
          <>
            <div style={{ fontSize: 11.5, color: C.muted, fontWeight: 700 }}>
              {t.routeCard.delay} {delay != null ? `+${delay} ${t.common.min}` : "—"} · {trendLabel(history, t)}
            </div>
            {history.length > 1 && <Sparkline history={history} color={st.color} />}
          </>
        ) : (
          <div style={{ fontSize: 11.5, color: C.muted, fontWeight: 700 }}>
            {/* The real OFROU detail text already self-describes openness (e.g. "Ouvert ·
                route sèche"), so prepending the state label too would repeat the word —
                only fall back to it when there's no detail text to show. */}
            {t.routeCard.stateLabel} : {data.detail || t.routeCard.colState[data.state]}
          </div>
        )}
      </div>
    </div>
  );
}
