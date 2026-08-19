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
import type { PurchaseOutcome, RemoveAdsOffer } from "../iap/RevenueCat";
import { LANGS, LANG_NAMES, useLang } from "../i18n";

const DEFAULT_PREFS: DevicePrefs = {
  directions: ["suisse", "italie"],
  types: { verdict: true, col_open: true, tunnel_closed: true, jam_threshold: true, cleared: false, restriction: true, gothard: true },
  jam_threshold_min: 20,
  quiet_hours: { from: "22:00", to: "07:00" },
};

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.card, borderRadius: 22, padding: 18, marginBottom: 16, boxShadow: C.shadowCard }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: C.muted, marginBottom: 12 }}>{title.toUpperCase()}</div>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", cursor: "pointer" }}>
      <span style={{ fontSize: 14, color: C.ink, fontWeight: 600, paddingRight: 12 }}>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 20, height: 20, accentColor: C.successText }} />
    </label>
  );
}

interface SettingsProps {
  onBack: () => void;
  removeAds: boolean;
  offer: RemoveAdsOffer | null;
  onPurchase: () => Promise<PurchaseOutcome>;
  onRestore: () => Promise<PurchaseOutcome>;
}

export function Settings({ onBack, removeAds, offer, onPurchase, onRestore }: SettingsProps) {
  const { lang, setLang, t } = useLang();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<DevicePrefs>(DEFAULT_PREFS);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [tripDirection, setTripDirection] = useState<Direction>("italie");
  const [tripDepartAt, setTripDepartAt] = useState("");
  const [tripStatus, setTripStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [purchaseState, setPurchaseState] = useState<{ status: "idle" | "purchasing" | "error"; message?: string }>({ status: "idle" });
  const [restoreState, setRestoreState] = useState<{ status: "idle" | "restoring" | "error"; message?: string }>({ status: "idle" });

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

  async function handlePurchase() {
    setPurchaseState({ status: "purchasing" });
    const outcome: PurchaseOutcome = await onPurchase();
    setPurchaseState(outcome.status === "error" ? { status: "error", message: outcome.message } : { status: "idle" });
  }

  async function handleRestore() {
    setRestoreState({ status: "restoring" });
    const outcome: PurchaseOutcome = await onRestore();
    setRestoreState(outcome.status === "error" ? { status: "error", message: outcome.message } : { status: "idle" });
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
            style={{ background: C.card, borderRadius: 999, width: 40, height: 40, fontSize: 18, fontWeight: 800, color: C.dark, boxShadow: C.shadowChip }}
            aria-label={t.common.back}
          >
            <span aria-hidden="true">←</span>
          </button>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.ink }}>{t.settings.title}</div>
        </div>

        <SectionCard title={t.settings.languageTitle}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {LANGS.map((code) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                style={{
                  flex: "1 1 90px",
                  padding: "10px 0",
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 700,
                  background: lang === code ? C.mustard : C.bg,
                  color: lang === code ? C.ink : C.muted,
                }}
              >
                {LANG_NAMES[code]}
              </button>
            ))}
          </div>
        </SectionCard>

        {showExplanation && (
          <SectionCard title={t.settings.notificationsTitle}>
            <p style={{ fontSize: 14, lineHeight: 1.5, margin: "0 0 14px", color: C.ink }}>{t.settings.notificationsExplain}</p>
            <button
              onClick={handleEnablePush}
              style={{ width: "100%", padding: "12px 0", borderRadius: 999, background: C.mustard, color: C.ink, fontWeight: 800, fontSize: 14 }}
            >
              {t.settings.enableNotifications}
            </button>
          </SectionCard>
        )}

        {!pushEnabled && !showExplanation && (
          <SectionCard title={t.settings.notificationsTitle}>
            <button
              onClick={handleEnablePush}
              style={{ width: "100%", padding: "12px 0", borderRadius: 999, background: C.mustard, color: C.ink, fontWeight: 800, fontSize: 14 }}
            >
              {t.settings.enableNotifications}
            </button>
          </SectionCard>
        )}

        {pushEnabled && (
          <>
            <SectionCard title={t.settings.directionsTitle}>
              <Toggle label={t.directionSwitch.toSwitzerland} checked={prefs.directions.includes("suisse")} onChange={() => toggleDirection("suisse")} />
              <Toggle label={t.directionSwitch.toItaly} checked={prefs.directions.includes("italie")} onChange={() => toggleDirection("italie")} />
            </SectionCard>

            <SectionCard title={t.settings.typesTitle}>
              {(Object.keys(t.settings.types) as Array<keyof typeof t.settings.types>).map((type) => (
                <Toggle key={type} label={t.settings.types[type]} checked={prefs.types[type] ?? false} onChange={() => toggleType(type)} />
              ))}
            </SectionCard>

            <SectionCard title={t.settings.jamThresholdTitle}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={5}
                  value={prefs.jam_threshold_min}
                  onChange={(e) => void savePrefs({ ...prefs, jam_threshold_min: Number(e.target.value) })}
                  style={{ flex: 1, accentColor: C.successText }}
                />
                <span style={{ fontSize: 14, fontWeight: 800, color: C.ink, minWidth: 56, textAlign: "right" }}>
                  {prefs.jam_threshold_min} {t.common.min}
                </span>
              </div>
              <p style={{ fontSize: 12, color: C.muted, margin: "8px 0 0" }}>{t.settings.jamThresholdNote}</p>
            </SectionCard>

            <SectionCard title={t.settings.quietHoursTitle}>
              <div style={{ display: "flex", gap: 12 }}>
                <label style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{t.settings.quietHoursFrom}</div>
                  <input
                    type="time"
                    value={prefs.quiet_hours.from}
                    onChange={(e) => void savePrefs({ ...prefs, quiet_hours: { ...prefs.quiet_hours, from: e.target.value } })}
                    style={{ width: "100%", padding: 8, borderRadius: 10, border: `1px solid ${C.line}` }}
                  />
                </label>
                <label style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{t.settings.quietHoursTo}</div>
                  <input
                    type="time"
                    value={prefs.quiet_hours.to}
                    onChange={(e) => void savePrefs({ ...prefs, quiet_hours: { ...prefs.quiet_hours, to: e.target.value } })}
                    style={{ width: "100%", padding: 8, borderRadius: 10, border: `1px solid ${C.line}` }}
                  />
                </label>
              </div>
              <p style={{ fontSize: 12, color: C.muted, margin: "8px 0 0" }}>{t.settings.quietHoursNote}</p>
            </SectionCard>

            <SectionCard title={t.settings.plannedTripTitle}>
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
                      background: tripDirection === d ? C.mustard : C.bg,
                      color: tripDirection === d ? C.ink : C.muted,
                    }}
                  >
                    {d === "suisse" ? t.directionSwitch.toSwitzerland : t.directionSwitch.toItaly}
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
                style={{ width: "100%", padding: "10px 0", borderRadius: 999, background: tripDepartAt ? C.dark : C.line, color: "#fff", fontWeight: 700, fontSize: 13 }}
              >
                {t.settings.plannedTripButton}
              </button>
              {tripStatus === "saved" && <p style={{ fontSize: 12, color: C.successText, margin: "8px 0 0" }}>{t.settings.plannedTripSaved}</p>}
              {tripStatus === "error" && <p style={{ fontSize: 12, color: C.coralDeep, margin: "8px 0 0" }}>{t.settings.plannedTripError}</p>}
            </SectionCard>

    {saveStatus === "error" && (
              <p style={{ fontSize: 12, color: C.coralDeep, textAlign: "center" }}>{t.settings.saveError}</p>
            )}
          </>
        )}

        <SectionCard title={t.settings.adsTitle}>
          {removeAds ? (
            <p style={{ fontSize: 14, color: C.successText, fontWeight: 700, margin: 0 }}>{t.settings.adsRemoved}</p>
          ) : (
            <>
              <p style={{ fontSize: 14, lineHeight: 1.5, margin: "0 0 14px", color: C.ink }}>{t.settings.adsDescription}</p>
              <button
                onClick={handlePurchase}
                disabled={!offer || purchaseState.status === "purchasing"}
                style={{
                  width: "100%",
                  padding: "12px 0",
                  borderRadius: 999,
                  background: offer ? C.mustard : C.line,
                  color: offer ? C.ink : C.muted,
                  fontWeight: 800,
                  fontSize: 14,
                  marginBottom: 10,
                }}
              >
                {purchaseState.status === "purchasing"
                  ? t.settings.adsBuying
                  : offer
                    ? t.settings.adsBuy(offer.priceString)
                    : t.settings.adsUnavailable}
              </button>
              <button
                onClick={handleRestore}
                disabled={restoreState.status === "restoring"}
                style={{ width: "100%", padding: "10px 0", borderRadius: 999, background: "transparent", color: C.muted, fontWeight: 700, fontSize: 13 }}
              >
                {restoreState.status === "restoring" ? t.settings.adsRestoring : t.settings.adsRestore}
              </button>
            </>
          )}
          {purchaseState.status === "error" && <p style={{ fontSize: 12, color: C.coralDeep, margin: "8px 0 0" }}>{purchaseState.message}</p>}
          {restoreState.status === "error" && <p style={{ fontSize: 12, color: C.coralDeep, margin: "8px 0 0" }}>{restoreState.message}</p>}
        </SectionCard>

        <p style={{ fontSize: 11, color: C.muted, textAlign: "center", lineHeight: 1.6, margin: "24px 0 0" }}>
          {t.settings.footerSource}{" "}
          <a href="https://opentransportdata.swiss" target="_blank" rel="noreferrer" style={{ color: C.muted }}>
            {t.settings.footerSourceLink}
          </a>
          .
          <br />
          {t.settings.footerTravelTime}
          <br />
          {t.settings.footerDisclaimer}
        </p>
      </div>
    </div>
  );
}
