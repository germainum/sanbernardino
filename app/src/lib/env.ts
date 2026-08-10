export const DATA_SOURCE: "mock" | "api" = import.meta.env.VITE_DATA_SOURCE === "api" ? "api" : "mock";
export const API_BASE: string = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:54321/functions/v1";
export const SUPABASE_ANON_KEY: string = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

// Real AdMob IDs, set only in .env.production — see placement.ts's getAdIds() for the
// test/live switch this feeds (unset here -> the build falls back to Google's test IDs).
export const ADMOB_APP_ID: string | undefined = import.meta.env.VITE_ADMOB_APP_ID;
export const ADMOB_BANNER_ID: string | undefined = import.meta.env.VITE_ADMOB_BANNER_ID;
export const ADMOB_INTERSTITIAL_ID: string | undefined = import.meta.env.VITE_ADMOB_INTERSTITIAL_ID;
