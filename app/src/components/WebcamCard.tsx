import { useCallback, useEffect, useRef, useState } from "react";
import { C } from "../theme";
import { API_BASE } from "../lib/env";
import { authHeaders } from "../lib/api";

// Found via GET {API_BASE}/webcam?nearby=46.492,9.190,20&include=location (col landmark
// 46.492,9.190; tunnel portal ~46.497,9.172 — no tunnel-side camera was even in the result
// set). Of the 3 real col-side candidates returned (all in the San Bernardino/Mesocco
// village on the pass road, ~4km south of the summit — nothing sits exactly at 2065m),
// this one was picked over the other two: by far the highest view count (1.1M vs ~20-40K,
// the best signal of long-term upkeep) and a wide sky view useful for assessing general
// pass weather/visibility, not just a close-up mountainside crop.
const DEFAULT_WEBCAM_ID = "1105008078"; // "Mesocco › East: Chiesa Rotonda S.Bernardino"

const REFRESH_INTERVAL_MS = 5 * 60_000; // Windy's free-tier signed image URLs expire ~10 min in.

interface WindyImages {
  current?: { preview?: string; thumbnail?: string };
}

interface WindyWebcamResponse {
  status?: string;
  title?: string;
  images?: WindyImages;
}

type WebcamState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "offline" }
  | { kind: "live"; imageUrl: string; title?: string };

interface WebcamCardProps {
  webcamId?: string;
  proxyUrl?: string;
  title?: string;
}

function imageUrlFrom(data: WindyWebcamResponse): string | null {
  return data.images?.current?.preview ?? data.images?.current?.thumbnail ?? null;
}

export function WebcamCard({ webcamId = DEFAULT_WEBCAM_ID, proxyUrl = `${API_BASE}/webcam`, title = "Webcam · Col du San Bernardino" }: WebcamCardProps) {
  const [state, setState] = useState<WebcamState>({ kind: "loading" });
  const retriedAuthRef = useRef(false);
  const retriedImageRef = useRef(false);

  const load = useCallback(
    async (isAuthRetry = false) => {
      try {
        const url = `${proxyUrl}?webcamId=${encodeURIComponent(webcamId)}&include=images,location`;
        const res = await fetch(url, { headers: authHeaders() });

        if (res.status === 401 && !isAuthRetry && !retriedAuthRef.current) {
          retriedAuthRef.current = true;
          await load(true);
          return;
        }
        if (!res.ok) {
          setState({ kind: "error", message: `Webcam indisponible (${res.status})` });
          return;
        }
        retriedAuthRef.current = false;

        const data: WindyWebcamResponse = await res.json();
        if (data.status && data.status !== "active") {
          setState({ kind: "offline" });
          return;
        }
        const imageUrl = imageUrlFrom(data);
        if (!imageUrl) {
          setState({ kind: "error", message: "Image indisponible" });
          return;
        }
        retriedImageRef.current = false;
        setState({ kind: "live", imageUrl, title: data.title });
      } catch {
        setState({ kind: "error", message: "Connexion impossible" });
      }
    },
    [proxyUrl, webcamId],
  );

  useEffect(() => {
    setState({ kind: "loading" });
    load();
    const id = setInterval(load, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  function handleImageError() {
    if (!retriedImageRef.current) {
      retriedImageRef.current = true;
      load();
    } else {
      setState({ kind: "error", message: "Image indisponible" });
    }
  }

  return (
    <div style={{ background: C.card, borderRadius: 22, padding: 14, marginBottom: 16, boxShadow: C.shadowCard }}>
      <style>{`
        @keyframes webcam-shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }
        .webcam-shimmer { animation: webcam-shimmer 1.4s ease infinite; }
        @media (prefers-reduced-motion: reduce) { .webcam-shimmer { animation: none; } }
        .webcam-retry:focus-visible { outline: 2px solid ${C.mustard}; outline-offset: 2px; }
      `}</style>

      <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 10 }}>{title}</div>

      {state.kind === "loading" && (
        <div
          className="webcam-shimmer"
          role="status"
          aria-label="Chargement de la webcam"
          style={{
            height: 180,
            borderRadius: 14,
            background: "linear-gradient(90deg, rgba(24,39,28,0.06) 25%, rgba(24,39,28,0.10) 37%, rgba(24,39,28,0.06) 63%)",
            backgroundSize: "400% 100%",
          }}
        />
      )}

      {state.kind === "offline" && (
        <div
          role="status"
          style={{
            height: 180,
            borderRadius: 14,
            background: C.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 22 }}>
            📷
          </span>
          <span style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>Webcam hors ligne</span>
        </div>
      )}

      {state.kind === "error" && (
        <div
          role="alert"
          style={{
            height: 180,
            borderRadius: 14,
            background: C.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 13, color: C.coralDeep, fontWeight: 600, textAlign: "center", padding: "0 16px" }}>{state.message}</span>
          <button
            type="button"
            className="webcam-retry"
            onClick={() => load()}
            style={{ fontSize: 13, fontWeight: 700, color: C.ink, background: C.mustard, borderRadius: 999, padding: "8px 16px" }}
          >
            Réessayer
          </button>
        </div>
      )}

      {state.kind === "live" && (
        <>
          <img
            src={state.imageUrl}
            onError={handleImageError}
            alt={`Vue webcam en direct — ${state.title ?? "col du San Bernardino"}`}
            style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 14, display: "block" }}
          />
          <div style={{ fontSize: 10.5, color: C.muted, fontWeight: 600, marginTop: 6, textAlign: "right" }}>© Windy.com</div>
        </>
      )}
    </div>
  );
}
