import { Client } from "pg";
import {
  evaluate,
  normalize,
  MockViasuisseProvider,
  MockRoutesProvider,
  ScenarioSequence,
  type Direction,
  type ScenarioKey,
} from "@san-bernardino/core";

const DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const POLL_INTERVAL_MIN = 3;
const DIRECTION: Direction = "italie";

/**
 * Scripted transition sequence exercising the situations backend-san-bernardino.md's poll()
 * and packages/core/src/events.ts care about: repeated identical polls (nothing should
 * re-fire), a verdict flip with a jam-threshold crossing (fluide -> bouchon), the Gothard
 * detour becoming worthwhile then not (bouchon -> sature -> gothardKo -> sature), and a
 * resorption back to clear (bouchon -> fluide). Phase 5's poll function replays this same
 * kind of sequence live to test event detection; this script only backfills history so the
 * app has 3h of data to render/query against.
 */
const SEQUENCE: ScenarioKey[] = [
  "fluide",
  "fluide",
  "bouchon",
  "bouchon",
  "bouchon",
  "bouchon",
  "sature",
  "sature",
  "gothardKo",
  "sature",
  "sature",
  "bouchon",
  "bouchon",
  "fluide",
  "fluide",
];

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  const now = new Date();
  const startedAt = new Date(now.getTime() - (SEQUENCE.length - 1) * POLL_INTERVAL_MIN * 60_000);

  const sequence = new ScenarioSequence(SEQUENCE);
  const viasuisse = new MockViasuisseProvider(() => sequence.current());
  const routes = new MockRoutesProvider(() => sequence.current());

  for (let i = 0; i < SEQUENCE.length; i++) {
    const capturedAt = new Date(startedAt.getTime() + i * POLL_INTERVAL_MIN * 60_000);

    const [viasuisseRaw, routesRaw] = await Promise.all([
      viasuisse.fetchViasuisse(),
      routes.fetchGoogleRoutes(DIRECTION),
    ]);
    const snapshot = normalize(viasuisseRaw, routesRaw, DIRECTION, capturedAt.toISOString());
    const evaluated = evaluate(snapshot);

    await client.query(
      `insert into snapshots (
         captured_at, direction,
         tunnel_state, tunnel_total, tunnel_detail,
         col_state, col_total, col_detail, col_seasonal_open,
         gothard_state, gothard_total, gothard_detail,
         verdict, saturated, raw
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [
        capturedAt.toISOString(),
        DIRECTION,
        snapshot.tunnel.state,
        snapshot.tunnel.totalMin,
        snapshot.tunnel.detail ?? null,
        snapshot.col.state,
        snapshot.col.totalMin,
        snapshot.col.detail ?? null,
        snapshot.col.seasonal ?? null,
        snapshot.gothard?.state ?? null,
        snapshot.gothard?.totalMin ?? null,
        snapshot.gothard?.detail ?? null,
        evaluated.verdict,
        evaluated.saturated,
        JSON.stringify(snapshot),
      ],
    );

    for (const route of ["tunnel", "col", "gothard"] as const) {
      const delay = evaluated.delays[route];
      if (delay == null) continue;
      await client.query(
        `insert into delay_history (captured_at, direction, route, delay_min) values ($1,$2,$3,$4)`,
        [capturedAt.toISOString(), DIRECTION, route, delay],
      );
    }

    sequence.advance();
  }

  await client.end();
  console.log(`Seeded ${SEQUENCE.length} snapshots spanning ${(SEQUENCE.length - 1) * POLL_INTERVAL_MIN} minutes.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
