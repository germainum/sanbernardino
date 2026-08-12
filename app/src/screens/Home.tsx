import { useSnapshot } from "../hooks/useSnapshot";
import { C } from "../theme";
import { DirectionSwitch } from "../components/DirectionSwitch";
import { Verdict } from "../components/Verdict";
import { Comparison } from "../components/Comparison";
import { RouteMap } from "../components/RouteMap";
import { GothardPanel } from "../components/GothardPanel";
import { ScenarioSwitcher } from "../components/ScenarioSwitcher";
import { Skeleton } from "../components/Skeleton";

interface HomeProps {
  onOpenSettings: () => void;
}

export function Home({ onOpenSettings }: HomeProps) {
  const { status, isOffline, scenarioKey, setScenarioKey, direction, setDirection, snapshot, evaluated, tunnelHistory, colHistory, updatedLabel, source, stale } =
    useSnapshot();

  if (status === "loading" || !snapshot || !evaluated) {
    return <Skeleton />;
  }

  const showGothard = !!snapshot.gothard && evaluated.saturated;
  const gothardRecommended = evaluated.verdict === "gothard";

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
              style={{ width: 42, height: 42, borderRadius: "50%", background: C.card, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: C.shadowChip }}
            >
              ⚙
            </button>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: C.dark, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13 }}>
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

        <Verdict direction={direction} evaluated={evaluated} updatedLabel={updatedLabel} source={source} stale={stale} />

        <Comparison
          snapshot={snapshot}
          evaluated={evaluated}
          tunnelHistory={tunnelHistory}
          colHistory={colHistory}
          updatedLabel={updatedLabel}
          source={source}
          stale={stale}
        />

        <RouteMap evaluated={evaluated} />

        {showGothard && snapshot.gothard && <GothardPanel gothard={snapshot.gothard} recommended={gothardRecommended} />}

        {scenarioKey && setScenarioKey && (
          <div style={{ marginTop: 20 }}>
            <ScenarioSwitcher value={scenarioKey} onChange={setScenarioKey} />
          </div>
        )}
      </div>
    </div>
  );
}
