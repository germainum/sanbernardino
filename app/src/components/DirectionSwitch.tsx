import type { Direction } from "@san-bernardino/core";
import { C } from "../theme";

const OPTIONS: Array<{ id: Direction; label: string }> = [
  { id: "suisse", label: "Vers la Suisse" },
  { id: "italie", label: "Vers l'Italie" },
];

interface DirectionSwitchProps {
  direction: Direction;
  onChange: (direction: Direction) => void;
}

export function DirectionSwitch({ direction, onChange }: DirectionSwitchProps) {
  return (
    <div role="tablist" aria-label="Direction" style={{ display: "flex", gap: 8, marginBottom: 16 }}>
      {OPTIONS.map((o) => {
        const on = direction === o.id;
        return (
          <button
            key={o.id}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.id)}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              background: on ? C.lime : C.card,
              color: on ? "#1c3208" : C.muted,
              boxShadow: on ? "0 6px 16px rgba(143,203,46,0.3)" : "0 2px 8px rgba(24,39,28,0.05)",
            }}
          >
            {on && <span aria-hidden="true">✓</span>}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
