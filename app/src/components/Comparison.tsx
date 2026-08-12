import type { EvaluatedSnapshot, RoutesSnapshot } from "@san-bernardino/core";
import { deriveColStatus } from "@san-bernardino/core";
import { C } from "../theme";
import { RouteCard } from "./RouteCard";
import { closedColMessage } from "../lib/comparison";

type ComparedRoute = "tunnel" | "col";

/** Physical/policy facts, not live data — duplicated here (not threaded from Home.tsx) so
 * this component stays self-contained. Vignette price is the real fixed annual Swiss rate. */
const ROUTE_META: Record<ComparedRoute, { distanceKm: number | null; altitudeM: number | null; cost: string }> = {
  tunnel: { distanceKm: 6.6, altitudeM: null, cost: "Vignette · CHF 40/an" },
  col: { distanceKm: null, altitudeM: 2065, cost: "Gratuit" },
};

interface ComparisonProps {
  snapshot: RoutesSnapshot;
  evaluated: EvaluatedSnapshot;
  tunnelHistory: number[];
  colHistory: number[];
}

export function Comparison({ snapshot, evaluated, tunnelHistory, colHistory }: ComparisonProps) {
  const colStatus = snapshot.col.colStatus ?? deriveColStatus(snapshot.col.state);

  if (colStatus === "closed") {
    return (
      <div style={{ marginBottom: 16 }}>
        <RouteCard
          route="tunnel"
          name="Tunnel"
          data={snapshot.tunnel}
          delay={evaluated.delays.tunnel ?? null}
          recommended
          distanceKm={ROUTE_META.tunnel.distanceKm}
          altitudeM={ROUTE_META.tunnel.altitudeM}
          cost={ROUTE_META.tunnel.cost}
          history={tunnelHistory}
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
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginBottom: 16, alignItems: "stretch" }}>
      <RouteCard
        route="tunnel"
        name="Tunnel"
        data={snapshot.tunnel}
        delay={evaluated.delays.tunnel ?? null}
        recommended={evaluated.verdict === "tunnel"}
        distanceKm={ROUTE_META.tunnel.distanceKm}
        altitudeM={ROUTE_META.tunnel.altitudeM}
        cost={ROUTE_META.tunnel.cost}
        history={tunnelHistory}
      />
      <RouteCard
        route="col"
        name="Col"
        data={snapshot.col}
        delay={evaluated.delays.col ?? null}
        recommended={evaluated.verdict === "col"}
        distanceKm={ROUTE_META.col.distanceKm}
        altitudeM={ROUTE_META.col.altitudeM}
        cost={ROUTE_META.col.cost}
        history={colHistory}
      />
    </div>
  );
}
