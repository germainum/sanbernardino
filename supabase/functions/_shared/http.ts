export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
};

export function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "content-type": "application/json", ...CORS_HEADERS, ...(init.headers ?? {}) },
  });
}

export function handleOptions(req) {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  return null;
}
