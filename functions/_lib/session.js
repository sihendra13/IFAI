// Mints and verifies our own long-lived session tokens (HMAC-SHA256,
// hand-rolled JWT-like format — same Web Crypto approach as
// functions/_lib/google-auth.js, just symmetric instead of RS256) so users
// don't have to redo Google Sign-In every time Google's own ID token expires
// (~1 hour). A session token is minted once, right after a successful Google
// Sign-In, by /api/auth-session, and from then on is the credential the
// client keeps (in localStorage) to know it's logged in.

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 180; // ~180 days

function base64UrlEncode(bytes) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToUint8Array(base64url) {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

// payload: { sub, email, name, picture } — same field names as a verified
// Google ID token payload, so downstream code (tongkrongan.js/comments.js)
// doesn't need to care which kind of token it got.
export async function mintSessionToken(env, payload) {
  if (!env.SESSION_SECRET) throw new Error("SESSION_SECRET not configured");

  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now, exp: now + SESSION_TTL_SECONDS };

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(fullPayload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await hmacKey(env.SESSION_SECRET);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput));

  return `${signingInput}.${base64UrlEncode(new Uint8Array(signature))}`;
}

// Returns the verified payload or throws.
export async function verifySessionToken(env, token) {
  if (!env.SESSION_SECRET) throw new Error("SESSION_SECRET not configured");
  if (!token || typeof token !== "string" || token.split(".").length !== 3) {
    throw new Error("Malformed session token");
  }

  const [headerB64, payloadB64, signatureB64] = token.split(".");
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await hmacKey(env.SESSION_SECRET);
  const signature = base64UrlToUint8Array(signatureB64);
  const valid = await crypto.subtle.verify("HMAC", key, signature, new TextEncoder().encode(signingInput));
  if (!valid) throw new Error("Invalid session token signature");

  const payload = JSON.parse(new TextDecoder().decode(base64UrlToUint8Array(payloadB64)));
  if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) throw new Error("Session expired");

  return payload;
}
