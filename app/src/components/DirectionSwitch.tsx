import type { Direction } from "@san-bernardino/core";
import { C } from "../theme";
import { useLang } from "../i18n";

interface DirectionSwitchProps {
  direction: Direction;
  onChange: (direction: Direction) => void;
}

export function DirectionSwitch({ direction, onChange }: DirectionSwitchProps) {
  const { t } = useLang();
  const options: Array<{ id: Direction; label: string }> = [
    { id: "suisse", label: t.directionSwitch.toSwitzerland },
    { id: "italie", label: t.directionSwitch.toItaly },
  ];
  return (
    <div role="group" aria-label={t.directionSwitch.ariaLabel} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
      {options.map((o) => {
        const on = direction === o.id;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
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
              background: on ? C.mustard : C.card,
              color: on ? C.ink : C.muted,
              boxShadow: on ? "0 6px 16px rgba(227,167,47,0.3)" : "0 2px 8px rgba(24,39,28,0.05)",
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
