import { deriveColStatus } from "@san-bernardino/core";
import { useSnapshot } from "../hooks/useSnapshot";
import { C } from "../theme";
import { DirectionSwitch } from "../components/DirectionSwitch";
import { ColStatusBadge } from "../components/ColStatusBadge";
import { VerdictHero } from "../components/VerdictHero";
import { DelayHeadline } from "../components/DelayHeadline";
import { AxisMap } from "../components/AxisMap";
import { RouteCard } from "../components/RouteCard";
import { GothardPanel } from "../components/GothardPanel";
import { Breakdown, type BreakdownRow } from "../components/Breakdown";
import { HistoryGraph } from "../components/HistoryGraph";
import { ScenarioSwitcher } from "../components/ScenarioSwitcher";
import { Skeleton } from "../components/Skeleton";

interface HomeProps {
  onOpenSettings: () => void;
}

export function Home({ onOpenSettings }: HomeProps) {
  const { status, isOffline, scenarioKey, setScenarioKey, direction, setDirection, snapshot, evaluated, history, updatedLabel, source, stale } =
    useSnapshot();

  if (status === "loading" || !snapshot || !evaluated) {
    return <Skeleton />;
  }

  const showGothard = !!snapshot.gothard && evaluated.saturated;
  const gothardRecommended = evaluated.verdict === "gothard";

  const primaryRoute: "tunnel" | "col" =
    evaluated.verdict === "tunnel" || evaluated.verdict === "col"
      ? evaluated.verdict
      : snapshot.tunnel.totalMin != null
        ? "tunnel"
        : "col";
  const primaryDelay = evaluated.delays[primaryRoute] ?? null;

  const rows: BreakdownRow[] = [
    { name: "Tunnel", base: snapshot.tunnel.baseMin, delay: evaluated.delays.tunnel ?? null, total: snapshot.tunnel.totalMin, recommended: evaluated.verdict === "tunnel" },
    { name: "Col", base: snapshot.col.baseMin, delay: evaluated.delays.col ?? null, total: snapshot.col.totalMin, recommended: evaluated.verdict === "col" },
    ...(showGothard && snapshot.gothard
      ? [{ name: "Gothard", base: snapshot.gothard.baseMin, delay: evaluated.delays.gothard ?? null, total: snapshot.gothard.totalMin, recommended: gothardRecommended }]
      : []),
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: "'Nunito', system-ui, -apple-system, sans-serif", padding: "18px 16px 36px" }}>
      <div style={{ maxWidth: 440, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, letterSpacing: "0.04em" }}>PASSAGE ALPIN</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.ink, lineHeight: 1.1 }}>San Bernardino</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={onOpenSettings}
              aria-label="Réglages"
              style={{ width: 42, height: 42, borderRadius: "50%", background: C.card, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "0 2px 8px rgba(24,39,28,0.08)" }}
            >
              ⚙
            </button>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: C.forest, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13 }}>
              A13
            </div>
          </div>
        </div>

        {isOffline && (
          <div
            style={{
              background: C.coral,
              color: "#fff",
              borderRadius: 14,
              padding: "10px 14px",
              marginBottom: 16,
              fontSize: 12.5,
              fontWeight: 700,
            }}
          >
            Hors ligne — dernier état connu affiché ci-dessous
          </div>
        )}

        <DirectionSwitch direction={direction} onChange={setDirection} />

        <ColStatusBadge status={snapshot.col.colStatus ?? deriveColStatus(snapshot.col.state)} detail={snapshot.col.detail} />

        <VerdictHero direction={direction} verdict={evaluated.verdict} reason={evaluated.reason} />

        <DelayHeadline
          route={primaryRoute}
          state={snapshot[primaryRoute].state}
          delay={primaryDelay}
          totalMin={snapshot[primaryRoute].totalMin}
          updatedLabel={updatedLabel}
          source={source}
          stale={stale}
        />

        <AxisMap evaluated={evaluated} />

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          <RouteCard name="Le Tunnel du San Bernardino" meta="6,6 km · vignette" thumbLabel="TUNNEL" data={snapshot.tunnel} delay={evaluated.delays.tunnel ?? null} recommended={evaluated.verdict === "tunnel"} />
          <RouteCard name="La Route du Col du San Bernardino" meta="Passo del San Bernardino · 2065 m · gratuit" thumbLabel="COL" data={snapshot.col} delay={evaluated.delays.col ?? null} recommended={evaluated.verdict === "col"} />
        </div>

        {showGothard && snapshot.gothard && <GothardPanel gothard={snapshot.gothard} recommended={gothardRecommended} />}

        <Breakdown rows={rows} />
        <HistoryGraph history={history} routeLabel={primaryRoute === "tunnel" ? "Tunnel" : "Col"} />

        {scenarioKey && setScenarioKey && (
          <div style={{ marginTop: 20 }}>
            <ScenarioSwitcher value={scenarioKey} onChange={setScenarioKey} />
          </div>
        )}
      </div>
    </div>
  );
}
