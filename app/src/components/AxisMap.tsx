import type { Direction, EvaluatedSnapshot, RouteState } from "@san-bernardino/core";
import { C, STATE } from "../theme";

interface RouteProps {
  d: string;
  state: RouteState;
  recommended: boolean;
}

function Route({ d, state, recommended }: RouteProps) {
  const st = STATE[state];
  const animated = st.spd > 0;
  return (
    <g style={recommended ? { filter: `drop-shadow(0 0 5px ${st.color})` } : undefined}>
      <path d={d} fill="none" stroke="#DFE6D6" strokeWidth={recommended ? 9 : 7} strokeLinecap="round" />
      <path d={d} fill="none" stroke={st.color} strokeOpacity={animated ? 0.35 : 0.9} strokeWidth={recommended ? 9 : 7} strokeLinecap="round" />
      {animated && (
        <path
          d={d}
          fill="none"
          stroke={st.color}
          strokeWidth={recommended ? 5.5 : 4.5}
          strokeLinecap="round"
          strokeDasharray="0.1 15"
          style={{ animation: `flow ${st.spd}s linear infinite` }}
        />
      )}
    </g>
  );
}

interface PillProps {
  x: number;
  y: number;
  label: string;
  eta: number | null | undefined;
  color: string;
  dim?: boolean;
}

function Pill({ x, y, label, eta, color, dim }: PillProps) {
  const w = 66;
  return (
    <g opacity={dim ? 0.5 : 1}>
      <rect x={x - w / 2} y={y - 12} width={w} height={24} rx={12} fill="#fff" stroke={color} strokeWidth="1.5" />
      <text x={x} y={y + 1} textAnchor="middle" fontSize="10.5" fontWeight="800" fill={C.ink} fontFamily="Nunito, sans-serif">
        {label}
      </text>
      <text x={x} y={y + 10.5} textAnchor="middle" fontSize="8" fontWeight="700" fill={color} fontFamily="Nunito, sans-serif">
        {eta != null ? eta + " min" : "—"}
      </text>
    </g>
  );
}

interface CountryNodeProps {
  cx: number;
  cy: number;
  country: "CH" | "IT";
  label: string;
  labelY: number;
}

function CountryNode({ cx, cy, country, label, labelY }: CountryNodeProps) {
  const isCH = country === "CH";
  const uid = country + cy;
  return (
    <g>
      {isCH ? (
        <>
          <circle cx={cx} cy={cy} r={25} fill="rgba(120,150,170,0.13)" />
          <path d={`M${cx - 31},${cy + 21} L${cx - 12},${cy - 6} L${cx + 6},${cy + 21} Z`} fill="#A9B7C1" />
          <path d={`M${cx - 3},${cy + 21} L${cx + 16},${cy - 12} L${cx + 35},${cy + 21} Z`} fill="#C2CDD5" />
          <path d={`M${cx - 12},${cy - 6} L${cx - 6},${cy + 3} L${cx - 18},${cy + 3} Z`} fill="#fff" />
          <path d={`M${cx + 16},${cy - 12} L${cx + 22},${cy - 2} L${cx + 10},${cy - 2} Z`} fill="#fff" />
        </>
      ) : (
        <>
          <circle cx={cx} cy={cy} r={25} fill="rgba(240,168,58,0.20)" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
            const r = (a * Math.PI) / 180;
            return (
              <line
                key={a}
                x1={cx + Math.cos(r) * 20}
                y1={cy + Math.sin(r) * 20}
                x2={cx + Math.cos(r) * 28}
                y2={cy + Math.sin(r) * 28}
                stroke="#EFA83A"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
            );
          })}
        </>
      )}
      {isCH ? (
        <>
          <circle cx={cx} cy={cy} r={15} fill="#D8232A" />
          <rect x={cx - 2.3} y={cy - 8} width={4.6} height={16} rx={1} fill="#fff" />
          <rect x={cx - 8} y={cy - 2.3} width={16} height={4.6} rx={1} fill="#fff" />
        </>
      ) : (
        <>
          <clipPath id={`clip${uid}`}>
            <circle cx={cx} cy={cy} r={15} />
          </clipPath>
          <g clipPath={`url(#clip${uid})`}>
            <rect x={cx - 15} y={cy - 15} width={10} height={30} fill="#009246" />
            <rect x={cx - 5} y={cy - 15} width={10} height={30} fill="#F4F5F0" />
            <rect x={cx + 5} y={cy - 15} width={10} height={30} fill="#CE2B37" />
          </g>
          <circle cx={cx} cy={cy} r={15} fill="none" stroke="#fff" strokeWidth="1.6" />
        </>
      )}
      <text x={cx} y={labelY} textAnchor="middle" fontSize="11.5" fontWeight="800" fill={isCH ? C.forest : "#b9832a"} fontFamily="Nunito, sans-serif">
        {label}
      </text>
    </g>
  );
}

const PATHS = {
  tunnel: "M170,100 L170,300",
  col: "M170,100 C 248,132 250,152 234,182 C 222,206 248,228 224,252 C 210,272 186,288 170,300",
  gothard: "M170,100 C 92,132 78,168 82,214 C 86,258 108,286 170,300",
};

const DIRECTION_LABELS: Record<Direction, { top: "CH" | "IT"; bottom: "CH" | "IT"; topLabel: string; bottomLabel: string }> = {
  italie: { top: "CH", bottom: "IT", topLabel: "Départ · Suisse", bottomLabel: "Arrivée · Italie" },
  suisse: { top: "IT", bottom: "CH", topLabel: "Départ · Italie", bottomLabel: "Arrivée · Suisse" },
};

interface AxisMapProps {
  evaluated: EvaluatedSnapshot;
}

export function AxisMap({ evaluated }: AxisMapProps) {
  const { snapshot, verdict, saturated } = evaluated;
  const showGothard = !!snapshot.gothard && saturated;
  const labels = DIRECTION_LABELS[snapshot.direction];

  return (
    <div style={{ background: C.card, borderRadius: 24, padding: 6, marginBottom: 16, boxShadow: "0 4px 16px rgba(24,39,28,0.06)" }}>
      <svg viewBox="0 0 340 400" style={{ width: "100%", display: "block" }}>
        <path d="M92,232 L138,166 L166,198 L198,156 L242,232 Z" fill="#E4EAD9" />
        <path d="M138,166 L150,184 L126,184 Z" fill="#fff" opacity="0.8" />
        <path d="M198,156 L210,176 L186,176 Z" fill="#fff" opacity="0.8" />

        {showGothard && snapshot.gothard && (
          <Route d={PATHS.gothard} state={snapshot.gothard.state} recommended={verdict === "gothard"} />
        )}
        <Route d={PATHS.tunnel} state={snapshot.tunnel.state} recommended={verdict === "tunnel"} />
        <Route d={PATHS.col} state={snapshot.col.state} recommended={verdict === "col"} />

        <path d="M170,62 L170,100" stroke="#DFE6D6" strokeWidth="7" strokeLinecap="round" />
        <path d="M170,300 L170,338" stroke="#DFE6D6" strokeWidth="7" strokeLinecap="round" />

        <CountryNode cx={170} cy={40} country={labels.top} label={labels.topLabel} labelY={13} />
        <CountryNode cx={170} cy={360} country={labels.bottom} label={labels.bottomLabel} labelY={397} />

        <Pill x={170} y={128} label="Tunnel" eta={snapshot.tunnel.totalMin} color={STATE[snapshot.tunnel.state].color} />
        <Pill x={258} y={150} label="Col" eta={snapshot.col.totalMin} color={STATE[snapshot.col.state].color} />
        {showGothard && snapshot.gothard && (
          <Pill
            x={70}
            y={150}
            label="Gothard"
            eta={snapshot.gothard.totalMin}
            color={STATE[snapshot.gothard.state].color}
            dim={verdict !== "gothard"}
          />
        )}
      </svg>
    </div>
  );
}
