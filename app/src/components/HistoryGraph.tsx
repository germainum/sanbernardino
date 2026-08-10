import { C, barColor } from "../theme";

interface HistoryGraphProps {
  history: number[];
  routeLabel: string;
}

export function HistoryGraph({ history, routeLabel }: HistoryGraphProps) {
  const max = Math.max(10, ...history);
  const n = history.length;
  const W = 300;
  const H = 92;
  const pad = 6;
  const bw = ((W - pad * 2) / n) * 0.62;
  const gap = (W - pad * 2) / n;

  return (
    <div style={{ background: C.card, borderRadius: 22, padding: "16px 18px", marginBottom: 16, boxShadow: C.shadowCard }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: C.muted }}>RETARD · 3 DERNIÈRES HEURES</span>
        <span style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>{routeLabel}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        <line x1={pad} y1={H - 16} x2={W - pad} y2={H - 16} stroke={C.line} strokeWidth="1" />
        {history.map((v, i) => {
          const h = (v / max) * (H - 30);
          const x = pad + gap * i + (gap - bw) / 2;
          return <rect key={i} x={x} y={H - 16 - h} width={bw} height={Math.max(h, 2)} rx={3} fill={barColor(v)} />;
        })}
        <text x={pad} y={H - 3} fontSize="9" fontWeight="700" fill={C.muted} fontFamily="Nunito, sans-serif">
          il y a 3 h
        </text>
        <text x={W - pad} y={H - 3} textAnchor="end" fontSize="9" fontWeight="700" fill={C.muted} fontFamily="Nunito, sans-serif">
          maintenant
        </text>
      </svg>
    </div>
  );
}
