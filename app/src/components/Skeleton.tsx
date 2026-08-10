import { C } from "../theme";

function Block({ height, radius = 22, marginBottom = 16 }: { height: number; radius?: number; marginBottom?: number }) {
  return (
    <div
      style={{
        height,
        borderRadius: radius,
        marginBottom,
        background: "linear-gradient(90deg, rgba(24,39,28,0.06) 25%, rgba(24,39,28,0.10) 37%, rgba(24,39,28,0.06) 63%)",
        backgroundSize: "400% 100%",
        animation: "skeleton-shimmer 1.4s ease infinite",
      }}
    />
  );
}

/** Shown while the first /api/state fetch is in flight and no cached last-known state exists yet. */
export function Skeleton() {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "18px 16px 36px" }}>
      <style>{`@keyframes skeleton-shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }`}</style>
      <div style={{ maxWidth: 440, margin: "0 auto" }}>
        <Block height={40} marginBottom={18} radius={12} />
        <Block height={44} marginBottom={16} radius={999} />
        <Block height={220} />
        <Block height={90} />
        <Block height={360} />
        <Block height={90} />
        <Block height={90} />
      </div>
    </div>
  );
}
