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
  open: boolean;
  onToggleDetail: () => void;
  updatedLabel: string;
  source: string;
  stale: boolean;
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
  const totalColor = !localIssue ? C.ink : delay == null ? C.muted : delay < 40 ? C.amber : C.coral;
  const drawerId = `route-detail-${route}`;

  return (
    <div
      style={{
        background: C.card,
        borderRadius: 22,
        padding: 14,
        border: `1.5px solid ${recommended ? C.lime : "transparent"}`,
        boxShadow: recommended ? "0 8px 24px rgba(91,156,28,0.18)" : C.shadowCard,
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
                  background: C.lime,
                  color: "#1c3208",
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
              color: st.color,
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
            {route === "tunnel" && distanceKm != null && <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>📏 {distanceKm} km</span>}
            {route === "col" && altitudeM != null && <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>⛰ {altitudeM} m</span>}
            <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{route === "tunnel" ? "🎫 Vignette" : "🆓 Gratuit"}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
              paddingTop: 8,
              borderTop: `1px solid ${C.line}`,
              fontSize: 11,
              fontWeight: 600,
              color: stale ? C.amber : C.muted,
            }}
          >
            <span>
              {stale ? "⚠ " : "● "}
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
