import type { RouteInfo } from "@san-bernardino/core";
import { C, STATE } from "../theme";

type ComparedRoute = "tunnel" | "col";

interface RouteCardProps {
  route: ComparedRoute;
  name: string;
  data: RouteInfo;
  delay: number | null;
  recommended: boolean;
  chips: [string, string];
  distanceKm: number | null;
  altitudeM: number | null;
  history: number[];
  open: boolean;
  onToggleDetail: () => void;
  updatedLabel: string;
  source: string;
  stale: boolean;
}

/** Compares the window's endpoints rather than point-to-point, so a single noisy reading
 * doesn't flip the label — a small dead zone (±3 min) keeps genuinely flat series "stable". */
function trendLabel(history: number[]): string {
  const diff = history[history.length - 1] - history[0];
  if (diff > 3) return "en hausse";
  if (diff < -3) return "en baisse";
  return "stable";
}

/** Compact sparkline (no axes/labels — "maintenant + tendance" carries the meaning, not a
 * labeled 3h history). Fixed small width so it never reads as an imposing full-width chart. */
function Sparkline({ history, color }: { history: number[]; color: string }) {
  const W = 120;
  const H = 40;
  const pad = 3;
  const max = Math.max(10, ...history);
  const min = Math.min(0, ...history);
  const range = Math.max(1, max - min);
  const stepX = (W - pad * 2) / (history.length - 1);
  const points = history.map((v, i) => `${pad + stepX * i},${H - pad - ((v - min) / range) * (H - pad * 2)}`);
  const lastX = pad + stepX * (history.length - 1);
  const lastY = H - pad - ((history[history.length - 1] - min) / range) * (H - pad * 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: "block", maxWidth: 120 }} preserveAspectRatio="none">
      <polyline points={points.join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="2.5" fill={color} />
    </svg>
  );
}

export function RouteCard({
  route,
  name,
  data,
  delay,
  recommended,
  chips,
  distanceKm,
  altitudeM,
  history,
  open,
  onToggleDetail,
  updatedLabel,
  source,
  stale,
}: RouteCardProps) {
  const st = STATE[data.state];
  // Tunnel/col share most of the same trip, so a nonzero numeric delay often just reflects
  // shared-highway traffic, not a problem specific to this crossing — only tint/attribute the
  // total to "a local issue" when the real road-status feed (state) confirms one.
  const localIssue = data.state !== "go";
  const totalColor = !localIssue ? C.ink : delay == null ? C.muted : delay < 40 ? C.amberDeep : C.coralDeep;
  const drawerId = `route-detail-${route}`;

  return (
    <div
      style={{
        background: C.card,
        borderRadius: 22,
        padding: 14,
        border: `1.5px solid ${recommended ? C.mustard : "transparent"}`,
        boxShadow: recommended ? "0 8px 24px rgba(184,132,30,0.18)" : C.shadowCard,
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            flexShrink: 0,
            background: st.grad,
            filter: recommended ? undefined : "grayscale(0.5) opacity(0.85)",
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
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
          <div style={{ fontSize: 21, fontWeight: 800, color: totalColor, lineHeight: 1.15, marginTop: 2 }}>
            {data.totalMin != null ? (
              <>
                {data.totalMin}
                <span style={{ fontSize: 11, fontWeight: 700 }}> min</span>
              </>
            ) : (
              "—"
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
        {chips.map((chip) => (
          <span
            key={chip}
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: st.textColor,
              background: st.soft,
              borderRadius: 999,
              padding: "3px 9px",
            }}
          >
            {chip}
          </span>
        ))}
      </div>

      <button
        type="button"
        aria-expanded={open}
        aria-controls={drawerId}
        aria-label={`Voir le détail du ${name.toLowerCase()}`}
        onClick={onToggleDetail}
        style={{
          marginTop: 10,
          fontSize: 12,
          fontWeight: 700,
          color: C.muted,
          background: "none",
          padding: 0,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        Détail {open ? "▴" : "▾"}
      </button>

      {open && (
        <div id={drawerId} style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.line}` }}>
          <div style={{ fontSize: 13, color: C.ink, fontWeight: 600 }}>
            {data.baseMin} + {delay ?? 0} = {data.totalMin ?? "—"} min
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
            {route === "tunnel" && distanceKm != null && (
              <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>
                <span aria-hidden="true">📏 </span>
                {distanceKm} km
              </span>
            )}
            {route === "col" && altitudeM != null && (
              <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>
                <span aria-hidden="true">⛰ </span>
                {altitudeM} m
              </span>
            )}
            <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>
              <span aria-hidden="true">{route === "tunnel" ? "🎫 " : "🆓 "}</span>
              {route === "tunnel" ? "Vignette" : "Gratuit"}
            </span>
          </div>
          {history.length > 1 && (
            <div style={{ marginTop: 8 }}>
              <Sparkline history={history} color={st.color} />
              <span style={{ fontSize: 11.5, color: C.muted, fontWeight: 700, display: "block", marginTop: 2 }}>
                {delay != null ? `+${delay} min` : "—"}, {trendLabel(history)}
              </span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
              paddingTop: 8,
              borderTop: `1px solid ${C.line}`,
              fontSize: 11,
              fontWeight: 600,
              color: stale ? C.amberDeep : C.muted,
            }}
          >
            <span>
              <span aria-hidden="true">{stale ? "⚠ " : "● "}</span>
              {updatedLabel}
              {stale ? " — à vérifier" : ""}
            </span>
            <span>{source}</span>
          </div>
        </div>
      )}
    </div>
  );
}
