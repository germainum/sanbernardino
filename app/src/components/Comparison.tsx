import { useState } from "react";
import type { EvaluatedSnapshot, RoutesSnapshot } from "@san-bernardino/core";
import { deriveColStatus } from "@san-bernardino/core";
import { C } from "../theme";
import { RouteCard } from "./RouteCard";
import { chipsFor, closedColMessage, fasterRoute } from "../lib/comparison";

type ComparedRoute = "tunnel" | "col";

/** Physical facts, not live data — duplicated here (not threaded from Home.tsx) so this component stays self-contained. */
const ROUTE_META: Record<ComparedRoute, { distanceKm: number | null; altitudeM: number | null }> = {
  tunnel: { distanceKm: 6.6, altitudeM: null },
  col: { distanceKm: null, altitudeM: 2065 },
};

interface ComparisonProps {
  snapshot: RoutesSnapshot;
  evaluated: EvaluatedSnapshot;
  tunnelHistory: number[];
  colHistory: number[];
  updatedLabel: string;
  source: string;
  stale: boolean;
}

export function Comparison({ snapshot, evaluated, tunnelHistory, colHistory, updatedLabel, source, stale }: ComparisonProps) {
  const [openRoute, setOpenRoute] = useState<ComparedRoute | null>(null);
  const colStatus = snapshot.col.colStatus ?? deriveColStatus(snapshot.col.state);
  const faster = fasterRoute(snapshot);

  const toggle = (route: ComparedRoute) => setOpenRoute((curr) => (curr === route ? null : route));

  if (colStatus === "closed") {
    return (
      <div style={{ marginBottom: 16 }}>
        <RouteCard
          route="tunnel"
          name="Tunnel"
          data={snapshot.tunnel}
          delay={evaluated.delays.tunnel ?? null}
          recommended
          chips={chipsFor("tunnel", snapshot, null)}
          distanceKm={ROUTE_META.tunnel.distanceKm}
          altitudeM={ROUTE_META.tunnel.altitudeM}
          history={tunnelHistory}
          open={openRoute === "tunnel"}
          onToggleDetail={() => toggle("tunnel")}
          updatedLabel={updatedLabel}
          source={source}
          stale={stale}
        />
        <div
          style={{
            marginTop: 10,
            padding: "10px 14px",
            borderRadius: 14,
            background: "rgba(228,100,90,0.10)",
            color: C.coralDeep,
            fontSize: 12.5,
            fontWeight: 700,
          }}
        >
          <span aria-hidden="true">🚫 </span>
          Col fermé — {closedColMessage(snapshot.col)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginBottom: 16 }}>
      <RouteCard
        route="tunnel"
        name="Tunnel"
        data={snapshot.tunnel}
        delay={evaluated.delays.tunnel ?? null}
        recommended={evaluated.verdict === "tunnel"}
        chips={chipsFor("tunnel", snapshot, faster)}
        distanceKm={ROUTE_META.tunnel.distanceKm}
        altitudeM={ROUTE_META.tunnel.altitudeM}
        history={tunnelHistory}
        open={openRoute === "tunnel"}
        onToggleDetail={() => toggle("tunnel")}
        updatedLabel={updatedLabel}
        source={source}
        stale={stale}
      />
      <RouteCard
        route="col"
        name="Col"
        data={snapshot.col}
        delay={evaluated.delays.col ?? null}
        recommended={evaluated.verdict === "col"}
        chips={chipsFor("col", snapshot, faster)}
        distanceKm={ROUTE_META.col.distanceKm}
        altitudeM={ROUTE_META.col.altitudeM}
        history={colHistory}
        open={openRoute === "col"}
        onToggleDetail={() => toggle("col")}
        updatedLabel={updatedLabel}
        source={source}
        stale={stale}
      />
    </div>
  );
}
