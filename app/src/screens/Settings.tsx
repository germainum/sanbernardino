import { useEffect, useState } from "react";
import type { Direction } from "@san-bernardino/core";
import { C } from "../theme";
import {
  getStoredDeviceId,
  hasSeenPushExplanation,
  markPushExplanationSeen,
  requestPushPermissionAndRegister,
} from "../push/register";
import { fetchDevice, schedulePlannedTrip, updateDevicePrefs, type DevicePrefs } from "../lib/deviceApi";

const TYPE_LABELS: Record<string, string> = {
  verdict: "Changement d'itinéraire recommandé",
  col_open: "Ouverture du col",
  tunnel_closed: "Fermeture du tunnel / incident",
  jam_threshold: "Seuil de bouchon franchi",
  gothard: "Déviation Gothard pertinente",
  cleared: "Résorption d'un bouchon",
  restriction: "Nouvelle restriction (chaînes, tonnage...)",
};

const DEFAULT_PREFS: DevicePrefs = {
  directions: ["suisse", "italie"],
  types: { verdict: true, col_open: true, tunnel_closed: true, jam_threshold: true, cleared: false, restriction: true, gothard: true },
  jam_threshold_min: 20,
  quiet_hours: { from: "22:00", to: "07:00" },
};

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.card, borderRadius: 22, padding: 18, marginBottom: 16, boxShadow: "0 4px 16px rgba(24,39,28,0.06)" }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: C.muted, marginBottom: 12 }}>{title.toUpperCase()}</div>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", cursor: "pointer" }}>
      <span style={{ fontSize: 14, color: C.ink, fontWeight: 600, paddingRight: 12 }}>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 20, height: 20, accentColor: C.limeDeep }} />
    </label>
  );
}

interface SettingsProps {
  onBack: () => void;
}

export function Settings({ onBack }: SettingsProps) {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<DevicePrefs>(DEFAULT_PREFS);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [tripDirection, setTripDirection] = useState<Direction>("italie");
  const [tripDepartAt, setTripDepartAt] = useState("");
  const [tripStatus, setTripStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    (async () => {
      const id = await getStoredDeviceId();
      if (!id) {
        setShowExplanation(!(await hasSeenPushExplanation()));
        return;
      }
      setDeviceId(id);
      setPushEnabled(true);
      try {
        const device = await fetchDevice(id);
        setPrefs(device.prefs);
      } catch {
        // keep defaults — the device row still exists server-side, just couldn't fetch it now
      }
    })();
  }, []);

  async function handleEnablePush() {
    await markPushExplanationSeen();
    setShowExplanation(false);
    const result = await requestPushPermissionAndRegister();
    if (result.granted && result.deviceId) {
      setDeviceId(result.deviceId);
      setPushEnabled(true);
    }
  }

  async function savePrefs(next: DevicePrefs) {
    setPrefs(next);
    if (!deviceId) return;
    setSaveStatus("saving");
    try {
      await updateDevicePrefs(deviceId, next);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }

  function toggleDirection(direction: Direction) {
    const has = prefs.directions.includes(direction);
    const directions = has ? prefs.directions.filter((d) => d !== direction) : [...prefs.directions, direction];
    void savePrefs({ ...prefs, directions });
  }

  function toggleType(type: string) {
    void savePrefs({ ...prefs, types: { ...prefs.types, [type]: !prefs.types[type] } });
  }

  async function handleSchedulePlannedTrip() {
    if (!deviceId || !tripDepartAt) return;
    setTripStatus("saving");
    try {
      await schedulePlannedTrip(deviceId, tripDirection, new Date(tripDepartAt).toISOString());
      setTripStatus("saved");
      setTripDepartAt("");
    } catch {
      setTripStatus("error");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: "'Nunito', system-ui, -apple-system, sans-serif", padding: "18px 16px 36px" }}>
      <div style={{ maxWidth: 440, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <button
            onClick={onBack}
            style={{ background: C.card, borderRadius: 999, width: 40, height: 40, fontSize: 18, fontWeight: 800, color: C.forest, boxShadow: "0 2px 8px rgba(24,39,28,0.08)" }}
            aria-label="Retour"
          >
            ←
          </button>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.ink }}>Réglages</div>
        </div>

        {showExplanation && (
          <SectionCard title="Notifications">
            <p style={{ fontSize: 14, lineHeight: 1.5, margin: "0 0 14px", color: C.ink }}>
              Sois prévenu quand le col ouvre, qu'un bouchon se forme, ou que le meilleur itinéraire change — sans avoir à rouvrir l'app.
            </p>
            <button
              onClick={handleEnablePush}
              style={{ width: "100%", padding: "12px 0", borderRadius: 999, background: C.lime, color: "#1c3208", fontWeight: 800, fontSize: 14 }}
            >
              Activer les notifications
            </button>
          </SectionCard>
        )}

        {!pushEnabled && !showExplanation && (
          <SectionCard title="Notifications">
            <button
              onClick={handleEnablePush}
              style={{ width: "100%", padding: "12px 0", borderRadius: 999, background: C.lime, color: "#1c3208", fontWeight: 800, fontSize: 14 }}
            >
              Activer les notifications
            </button>
          </SectionCard>
        )}

        {pushEnabled && (
          <>
            <SectionCard title="Directions suivies">
              <Toggle label="Vers la Suisse" checked={prefs.directions.includes("suisse")} onChange={() => toggleDirection("suisse")} />
              <Toggle label="Vers l'Italie" checked={prefs.directions.includes("italie")} onChange={() => toggleDirection("italie")} />
            </SectionCard>

            <SectionCard title="Types de notifications">
              {Object.entries(TYPE_LABELS).map(([type, label]) => (
                <Toggle key={type} label={label} checked={prefs.types[type] ?? false} onChange={() => toggleType(type)} />
              ))}
            </SectionCard>

            <SectionCard title="Seuil de bouchon">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={5}
                  value={prefs.jam_threshold_min}
                  onChange={(e) => void savePrefs({ ...prefs, jam_threshold_min: Number(e.target.value) })}
                  style={{ flex: 1, accentColor: C.limeDeep }}
                />
                <span style={{ fontSize: 14, fontWeight: 800, color: C.ink, minWidth: 56, textAlign: "right" }}>{prefs.jam_threshold_min} min</span>
              </div>
              <p style={{ fontSize: 12, color: C.muted, margin: "8px 0 0" }}>Ne me prévenir qu'au-delà de ce retard.</p>
            </SectionCard>

            <SectionCard title="Heures silencieuses">
              <div style={{ display: "flex", gap: 12 }}>
                <label style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>De</div>
                  <input
                    type="time"
                    value={prefs.quiet_hours.from}
                    onChange={(e) => void savePrefs({ ...prefs, quiet_hours: { ...prefs.quiet_hours, from: e.target.value } })}
                    style={{ width: "100%", padding: 8, borderRadius: 10, border: `1px solid ${C.line}` }}
                  />
                </label>
                <label style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>À</div>
                  <input
                    type="time"
                    value={prefs.quiet_hours.to}
                    onChange={(e) => void savePrefs({ ...prefs, quiet_hours: { ...prefs.quiet_hours, to: e.target.value } })}
                    style={{ width: "100%", padding: 8, borderRadius: 10, border: `1px solid ${C.line}` }}
                  />
                </label>
              </div>
              <p style={{ fontSize: 12, color: C.muted, margin: "8px 0 0" }}>Sauf incident majeur (fermeture).</p>
            </SectionCard>

            <SectionCard title="Trajet planifié">
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                {(["suisse", "italie"] as Direction[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setTripDirection(d)}
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 700,
                      background: tripDirection === d ? C.lime : C.bg,
                      color: tripDirection === d ? "#1c3208" : C.muted,
                    }}
                  >
                    {d === "suisse" ? "Vers la Suisse" : "Vers l'Italie"}
                  </button>
                ))}
              </div>
              <input
                type="datetime-local"
                value={tripDepartAt}
                onChange={(e) => setTripDepartAt(e.target.value)}
                style={{ width: "100%", padding: 8, borderRadius: 10, border: `1px solid ${C.line}`, marginBottom: 10 }}
              />
              <button
                onClick={handleSchedulePlannedTrip}
                disabled={!tripDepartAt}
                style={{ width: "100%", padding: "10px 0", borderRadius: 999, background: tripDepartAt ? C.forest : C.line, color: "#fff", fontWeight: 700, fontSize: 13 }}
              >
                Programmer le rappel (T-30 min)
              </button>
              {tripStatus === "saved" && <p style={{ fontSize: 12, color: C.limeDeep, margin: "8px 0 0" }}>Rappel programmé.</p>}
              {tripStatus === "error" && <p style={{ fontSize: 12, color: C.coral, margin: "8px 0 0" }}>Échec — réessaie plus tard.</p>}
            </SectionCard>

    {saveStatus === "error" && (
              <p style={{ fontSize: 12, color: C.coral, textAlign: "center" }}>Échec de l'enregistrement — vérifie ta connexion.</p>
            )}
          </>
        )}

        <p style={{ fontSize: 11, color: C.muted, textAlign: "center", lineHeight: 1.6, margin: "24px 0 0" }}>
          Données trafic : Office fédéral des routes (OFROU) — Traffic Data Platform.
          <br />
          Temps de trajet : Google Routes.
        </p>
      </div>
    </div>
  );
}
