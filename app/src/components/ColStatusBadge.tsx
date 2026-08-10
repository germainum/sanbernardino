import type { ColStatus } from "@san-bernardino/core";
import { C, STATE } from "../theme";

/**
 * Maps onto the same go/caution/stop palette as STATE, rather than a new color — col
 * open/closed/restricted is a state signal, not a distinct visual identity.
 */
const STATUS_META: Record<ColStatus, { label: string; stateKey: "go" | "caution" | "stop" }> = {
  open: { label: "Col ouvert", stateKey: "go" },
  restricted: { label: "Col restreint", stateKey: "caution" },
  closed: { label: "Col fermé", stateKey: "stop" },
};

interface ColStatusBadgeProps {
  status: ColStatus;
  detail?: string;
}

/** Rendered before any time comparison so the col's basic passability is never buried under numbers. */
export function ColStatusBadge({ status, detail }: ColStatusBadgeProps) {
  const meta = STATUS_META[status];
  const st = STATE[meta.stateKey];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: st.soft,
        borderRadius: 14,
        padding: "10px 14px",
        marginBottom: 16,
      }}
    >
      <span style={{ width: 9, height: 9, borderRadius: 2, background: st.color, flexShrink: 0 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: st.color }}>{meta.label}</span>
        {detail && <span style={{ fontSize: 11.5, color: C.muted }}>{detail}</span>}
      </div>
    </div>
  );
}
