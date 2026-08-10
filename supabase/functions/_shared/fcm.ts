/**
 * Sends Android push notifications via FCM's HTTP v1 API using a Firebase service account
 * (no external library — Deno's native Web Crypto covers the RS256 JWT signing FCM's OAuth2
 * service-account flow needs). iOS/APNs is a separate, not-yet-built path
 * (fonctionnalites-natives-san-bernardino.md §6) — this project is Android/Play-first.
 */

export interface FirebaseServiceAccount {
  client_email: string;
  private_key: string;
  project_id: string;
  token_uri: string;
}

function base64url(input: string | Uint8Array): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const b64 = pem.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
}

// Module-level cache: reused across warm invocations of the same Edge Function isolate as a
// bonus (avoids re-minting a token on every push in a fan-out batch); correctness doesn't
// depend on the cache surviving a cold start, since a miss just re-mints one.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(sa: FirebaseServiceAccount): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const now = Math.floor(Date.now() / 1000);
  const headerB64 = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payloadB64 = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: sa.token_uri,
      iat: now,
      exp: now + 3600,
    }),
  );
  const signingInput = `${headerB64}.${payloadB64}`;
  const key = await importPrivateKey(sa.private_key);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(signingInput));
  const jwt = `${signingInput}.${base64url(new Uint8Array(signature))}`;

  const res = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  if (!res.ok) throw new Error(`FCM token exchange failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

export async function sendFcmPush(
  sa: FirebaseServiceAccount,
  deviceToken: string,
  payload: { title: string; body: string; deeplink: string },
): Promise<{ ok: boolean; error?: string }> {
  let accessToken: string;
  try {
    accessToken = await getAccessToken(sa);
  } catch (err) {
    return { ok: false, error: `token exchange: ${err instanceof Error ? err.message : String(err)}` };
  }

  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      message: {
        token: deviceToken,
        notification: { title: payload.title, body: payload.body },
        data: { deeplink: payload.deeplink },
      },
    }),
  });
  if (!res.ok) return { ok: false, error: await res.text() };
  return { ok: true };
}
