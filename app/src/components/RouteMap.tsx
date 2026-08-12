import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Direction, EvaluatedSnapshot, RouteState } from "@san-bernardino/core";
import { C, STATE } from "../theme";
import { decodePolyline } from "../lib/polyline";

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
  state: RouteState;
  recommended: boolean;
}

function RouteLine({ coords, state, recommended }: RouteLineProps) {
  if (coords.length < 2) return null;
  const st = STATE[state];
  const animated = st.spd > 0;
  return (
    <>
      {/* Pale wide underlay + saturated stroke on top reproduces AxisMap's old drop-shadow
          glow without needing SVG filters through react-leaflet's pathOptions. */}
      <Polyline positions={coords} pathOptions={{ color: st.color, weight: recommended ? 13 : 9, opacity: 0.3 }} />
      <Polyline
        positions={coords}
        pathOptions={{
          color: st.color,
          weight: recommended ? 9 : 7,
          opacity: animated ? 0.55 : 0.9,
          className: animated ? `route-flow-${state}` : undefined,
        }}
      />
    </>
  );
}

/** Re-fits the map to whichever routes are currently visible whenever their geometry changes. */
function FitBounds({ segments }: { segments: [number, number][][] }) {
  const map = useMap();
  const flatKey = segments.map((s) => s.length).join(",");

  useEffect(() => {
    const flat = segments.flat();
    if (flat.length === 0) return;
    // Extra vertical padding leaves room for the permanent endpoint tooltips (pointing up
    // from the north marker, down from the south one) so they don't clip against the map's
    // own rounded/overflow-hidden edge.
    map.fitBounds(L.latLngBounds(flat), { paddingTopLeft: [28, 50], paddingBottomRight: [28, 50] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, flatKey]);

  return null;
}

interface RouteMapProps {
  evaluated: EvaluatedSnapshot;
}

export function RouteMap({ evaluated }: RouteMapProps) {
  const { snapshot, verdict, saturated } = evaluated;
  const showGothard = !!snapshot.gothard && saturated;
  const labels = DIRECTION_LABELS[snapshot.direction];

  const tunnelCoords = useMemo(() => (snapshot.tunnel.polyline ? decodePolyline(snapshot.tunnel.polyline) : []), [snapshot.tunnel.polyline]);
  const colCoords = useMemo(() => (snapshot.col.polyline ? decodePolyline(snapshot.col.polyline) : []), [snapshot.col.polyline]);
  const gothardCoords = useMemo(
    () => (showGothard && snapshot.gothard?.polyline ? decodePolyline(snapshot.gothard.polyline) : []),
    [showGothard, snapshot.gothard?.polyline],
  );

  const hasRealGeometry = tunnelCoords.length > 1 || colCoords.length > 1;
  const northEnd = tunnelCoords[0] ?? colCoords[0] ?? FALLBACK_NORTH;
  const southEnd = tunnelCoords[tunnelCoords.length - 1] ?? colCoords[colCoords.length - 1] ?? FALLBACK_SOUTH;

  return (
    <div style={{ borderRadius: 24, overflow: "hidden", marginBottom: 16, boxShadow: C.shadowCard, height: 340 }}>
      <MapContainer center={northEnd} zoom={11} scrollWheelZoom={false} style={{ width: "100%", height: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />

        {hasRealGeometry && (
          <>
            {showGothard && snapshot.gothard && <RouteLine coords={gothardCoords} state={snapshot.gothard.state} recommended={verdict === "gothard"} />}
            <RouteLine coords={tunnelCoords} state={snapshot.tunnel.state} recommended={verdict === "tunnel"} />
            <RouteLine coords={colCoords} state={snapshot.col.state} recommended={verdict === "col"} />
          </>
        )}
        {/* Always fit both endpoint markers into view, even in mock/dev mode with no real
            route geometry to fit to. */}
        <FitBounds segments={[[northEnd, southEnd], tunnelCoords, colCoords, ...(showGothard ? [gothardCoords] : [])]} />

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
    </div>
  );
}
