import { useMemo } from "react";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Direction, EvaluatedSnapshot } from "@san-bernardino/core";
import { C } from "../theme";
import { decodePolyline } from "../lib/polyline";

// The map is an orientation landmark, not a decision tool (StatusLine/Verdict/Comparison
// already carry live traffic state) — so route lines here encode only "which one is
// recommended" via a fixed accent/secondary duality, not per-state color.
const ACCENT = C.mustard;
const SECONDARY = C.muted;

// Illustrative-only fallback for mock/dev scenarios, which have no real Google Routes
// polyline data. Not the same coordinates RealRoutesProvider uses server-side — just close
// enough to frame a sensible default view of the corridor (mirrors Comparison.tsx's
// ROUTE_META precedent: small physical/geographic facts duplicated locally on purpose).
const FALLBACK_NORTH: [number, number] = [46.62, 9.2];
const FALLBACK_SOUTH: [number, number] = [46.39, 9.23];

const DIRECTION_LABELS: Record<Direction, { top: "CH" | "IT"; bottom: "CH" | "IT"; topLabel: string; bottomLabel: string }> = {
  italie: { top: "CH", bottom: "IT", topLabel: "Départ · Suisse", bottomLabel: "Arrivée · Italie" },
  suisse: { top: "IT", bottom: "CH", topLabel: "Départ · Italie", bottomLabel: "Arrivée · Suisse" },
};

/** Ported from AxisMap.tsx's old CountryNode SVG artwork, recentered into a standalone 50x50 marker. */
function countryMarkerSvg(country: "CH" | "IT"): string {
  if (country === "CH") {
    return `<svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
      <circle cx="25" cy="25" r="25" fill="rgba(120,150,170,0.13)" />
      <path d="M-6,46 L13,19 L31,46 Z" fill="#A9B7C1" />
      <path d="M22,46 L41,13 L60,46 Z" fill="#C2CDD5" />
      <path d="M13,19 L19,28 L7,28 Z" fill="#fff" />
      <path d="M41,13 L47,23 L35,23 Z" fill="#fff" />
      <circle cx="25" cy="25" r="15" fill="#D8232A" />
      <rect x="22.7" y="17" width="4.6" height="16" rx="1" fill="#fff" />
      <rect x="17" y="22.7" width="16" height="4.6" rx="1" fill="#fff" />
    </svg>`;
  }
  const rays = [0, 45, 90, 135, 180, 225, 270, 315]
    .map((a) => {
      const r = (a * Math.PI) / 180;
      const x1 = 25 + Math.cos(r) * 20;
      const y1 = 25 + Math.sin(r) * 20;
      const x2 = 25 + Math.cos(r) * 28;
      const y2 = 25 + Math.sin(r) * 28;
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#EFA83A" stroke-width="2.6" stroke-linecap="round" />`;
    })
    .join("");
  return `<svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
    <circle cx="25" cy="25" r="25" fill="rgba(240,168,58,0.20)" />
    ${rays}
    <clipPath id="itFlagClip"><circle cx="25" cy="25" r="15" /></clipPath>
    <g clip-path="url(#itFlagClip)">
      <rect x="10" y="10" width="10" height="30" fill="#009246" />
      <rect x="20" y="10" width="10" height="30" fill="#F4F5F0" />
      <rect x="30" y="10" width="10" height="30" fill="#CE2B37" />
    </g>
    <circle cx="25" cy="25" r="15" fill="none" stroke="#fff" stroke-width="1.6" />
  </svg>`;
}

// Deliberately never uses Leaflet's default Marker icon (whose bundled PNG paths break
// under Vite) — every marker here is an explicit divIcon built from inline SVG.
function countryDivIcon(country: "CH" | "IT") {
  return L.divIcon({
    className: "route-map-country-icon",
    html: countryMarkerSvg(country),
    iconSize: [50, 50],
    iconAnchor: [25, 25],
  });
}

interface RouteLineProps {
  coords: [number, number][];
  accent: boolean;
}

function RouteLine({ coords, accent }: RouteLineProps) {
  if (coords.length < 2) return null;
  const color = accent ? ACCENT : SECONDARY;
  return (
    <Polyline
      positions={coords}
      pathOptions={{
        color,
        weight: accent ? 5 : 3,
        opacity: accent ? 0.95 : 0.65,
        dashArray: accent ? undefined : "6 8",
      }}
    />
  );
}

interface RouteMapProps {
  evaluated: EvaluatedSnapshot;
}

export function RouteMap({ evaluated }: RouteMapProps) {
  const { snapshot, verdict } = evaluated;
  const labels = DIRECTION_LABELS[snapshot.direction];

  const tunnelCoords = useMemo(() => (snapshot.tunnel.polyline ? decodePolyline(snapshot.tunnel.polyline) : []), [snapshot.tunnel.polyline]);
  const colCoords = useMemo(() => (snapshot.col.polyline ? decodePolyline(snapshot.col.polyline) : []), [snapshot.col.polyline]);

  // Tunnel is the accent/emphasized trace unless col is specifically the recommended one —
  // fixed per current verdict, not tied to live traffic state (see ACCENT/SECONDARY above).
  const tunnelAccent = verdict !== "col";
  const colAccent = verdict === "col";
  const tunnelColor = tunnelAccent ? ACCENT : SECONDARY;
  const colColor = colAccent ? ACCENT : SECONDARY;

  const northEnd = tunnelCoords[0] ?? colCoords[0] ?? FALLBACK_NORTH;
  const southEnd = tunnelCoords[tunnelCoords.length - 1] ?? colCoords[colCoords.length - 1] ?? FALLBACK_SOUTH;

  // Recomputed only when the direction flips (the endpoints/geometry genuinely change) —
  // not on every poll refresh within the same direction, so the map still fits once and
  // stays put per direction rather than jumping around every 60s.
  const bounds = useMemo(() => {
    const points = [...tunnelCoords, ...colCoords, northEnd, southEnd];
    return L.latLngBounds(points);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot.direction]);

  return (
    <div style={{ borderRadius: 24, overflow: "hidden", marginBottom: 16, boxShadow: C.shadowCard, height: 190, position: "relative" }}>
      <MapContainer
        // MapContainer only applies `bounds` once, at creation (react-leaflet treats it as
        // an initial-view prop, not a controlled one) — keying on direction forces a remount
        // exactly when the route reverses, so the view re-fits instead of staying frozen on
        // the previous direction's framing.
        key={snapshot.direction}
        bounds={bounds}
        boundsOptions={{ padding: [20, 40] }}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        zoomControl={false}
        keyboard={false}
        boxZoom={false}
        // No `tap` prop: Leaflet 1.9.4 dropped the old tap-emulation handler this option
        // used to toggle (modern touch browsers fire click events natively) — dragging +
        // touchZoom + boxZoom already cover every touch-driven pan/zoom path.
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />

        {/* Secondary route drawn first, accent route last — Leaflet's SVG renderer stacks
            paths in DOM order, so the emphasized/recommended trace must paint on top or its
            thinner dashed sibling would overdraw it along their ~95%-shared corridor. */}
        {tunnelAccent ? (
          <>
            <RouteLine coords={colCoords} accent={false} />
            <RouteLine coords={tunnelCoords} accent={true} />
          </>
        ) : (
          <>
            <RouteLine coords={tunnelCoords} accent={false} />
            <RouteLine coords={colCoords} accent={true} />
          </>
        )}

        <Marker position={northEnd} icon={countryDivIcon(labels.top)}>
          <Tooltip permanent direction="top" offset={[0, -20]} className="route-map-label">
            {labels.topLabel}
          </Tooltip>
        </Marker>
        <Marker position={southEnd} icon={countryDivIcon(labels.bottom)}>
          <Tooltip permanent direction="bottom" offset={[0, 20]} className="route-map-label">
            {labels.bottomLabel}
          </Tooltip>
        </Marker>
      </MapContainer>

      {/* Route identity legend, overlaid outside Leaflet's own panes (z-index up to ~700). */}
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          zIndex: 1000,
          display: "flex",
          gap: 10,
          padding: "5px 10px",
          borderRadius: 10,
          background: "rgba(255,255,255,0.92)",
          boxShadow: C.shadowChip,
          pointerEvents: "none",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: C.ink }}>
          <span style={{ width: 14, height: tunnelAccent ? 4 : 2, borderRadius: 2, background: tunnelColor, opacity: tunnelAccent ? 1 : 0.7 }} />
          Tunnel
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: C.ink }}>
          <span style={{ width: 14, height: colAccent ? 4 : 2, borderRadius: 2, background: colColor, opacity: colAccent ? 1 : 0.7 }} />
          Col
        </span>
      </div>
    </div>
  );
}
