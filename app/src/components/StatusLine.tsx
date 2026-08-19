import type { ColStatus } from "@san-bernardino/core";
import { STATE } from "../theme";
import { useLang } from "../i18n";

const STATE_KEY_BY_STATUS: Record<ColStatus, "go" | "caution" | "stop"> = {
  open: "go",
  restricted: "caution",
  closed: "stop",
};

interface StatusLineProps {
  colStatus: ColStatus;
  conditionWord: string;
  updatedLabel: string;
  source: string;
  stale: boolean;
}

/**
 * The merged status row for the hero. Sits on the hero's solid near-black background
 * (`C.dark`), so text uses white/translucent-white — never the light-mode STATE colors
 * meant for white cards. The dot can keep STATE's color since it's a small decorative
 * indicator, not text, so text-contrast rules don't apply the same way to it.
 */
export function StatusLine({ colStatus, conditionWord, updatedLabel, source, stale }: StatusLineProps) {
  const { t } = useLang();
  const label = { open: t.statusLine.colOpen, restricted: t.statusLine.colRestricted, closed: t.statusLine.colClosed }[colStatus];
  const dotColor = STATE[STATE_KEY_BY_STATUS[colStatus]].color;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <span style={{ width: 7, height: 7, borderRadius: 2, background: dotColor, flexShrink: 0 }} aria-hidden="true" />
      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#fff" }}>{label}</span>
      <span style={{ color: "rgba(255,255,255,0.5)" }}>·</span>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{conditionWord}</span>
      <span style={{ color: "rgba(255,255,255,0.5)" }}>·</span>
      <span style={{ fontSize: 12.5, fontWeight: stale ? 800 : 600, color: "#fff" }}>
        {stale && <span aria-hidden="true">⚠ </span>}
        {updatedLabel}
        {stale ? t.statusLine.staleSuffix : ""}
      </span>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>· {source}</span>
    </div>
  );
}
