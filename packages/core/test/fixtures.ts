import { SCENARIOS as SCENARIO_DATA } from "../src/scenarios.js";
import type { RoutesSnapshot } from "../src/types.js";

/** Flattened { name: snapshot } view of src/scenarios.ts, for concise test assertions. */
export const SCENARIOS: Record<string, RoutesSnapshot> = Object.fromEntries(
  Object.entries(SCENARIO_DATA).map(([key, value]) => [key, value.snapshot]),
);
