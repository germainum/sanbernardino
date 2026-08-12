import { SCENARIOS } from "@san-bernardino/core";
import { C } from "../theme";
import type { ScenarioKey } from "../hooks/useSnapshot";

interface ScenarioSwitcherProps {
  value: ScenarioKey;
  onChange: (key: ScenarioKey) => void;
}

/** Dev-only tool for manually exercising the 6 known traffic scenarios; not shown in production. */
export function ScenarioSwitcher({ value, onChange }: ScenarioSwitcherProps) {
  return (
    <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", color: C.muted, marginBottom: 10 }}>TESTER UNE SITUATION</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {Object.entries(SCENARIOS).map(([key, scenario]) => {
          const on = value === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key as ScenarioKey)}
              style={{
                fontSize: 12.5,
                padding: "8px 13px",
                borderRadius: 999,
                fontWeight: 700,
                background: on ? C.dark : C.card,
                color: on ? "#fff" : C.muted,
                boxShadow: on ? "none" : "0 2px 8px rgba(24,39,28,0.05)",
              }}
            >
              {scenario.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
