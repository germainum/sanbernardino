export const DATA_SOURCE: "mock" | "api" = import.meta.env.VITE_DATA_SOURCE === "api" ? "api" : "mock";
export const API_BASE: string = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:54321/functions/v1";
export const SUPABASE_ANON_KEY: string = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
