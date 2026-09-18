// Verifies a Google Identity Services ID token (JWT) server-side — checks
// the RS256 signature against Google's published public keys, then checks
// audience/issuer/expiry. Never trust an ID token's claims without this:
// anyone can craft a JWT with any payload they like, so the signature check
// is what actually proves Google issued it for a real signed-in account.

const GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);

function base64UrlToUint8Array(base64url) {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlDecodeJson(base64url) {
  return JSON.parse(new TextDecoder().decode(base64UrlToUint8Array(base64url)));
}

async function fetchGoogleJwks() {
  const res = await fetch(GOOGLE_CERTS_URL);
  if (!res.ok) throw new Error("Failed to fetch Google JWKS");
  const { keys } = await res.json();
  return keys;
}

// Returns the verified payload ({ sub, email, name, picture, ... }) or throws.
export async function verifyGoogleIdToken(idToken, expectedClientId) {
  if (!idToken || typeof idToken !== "string" || idToken.split(".").length !== 3) {
    throw new Error("Malformed ID token");
  }
  const [headerB64, payloadB64, signatureB64] = idToken.split(".");

  const header = base64UrlDecodeJson(headerB64);
  if (header.alg !== "RS256") throw new Error("Unexpected token algorithm");

  const jwks = await fetchGoogleJwks();
  const jwk = jwks.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error("No matching Google signing key");

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const signingInput = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = base64UrlToUint8Array(signatureB64);
  const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, signature, signingInput);
  if (!valid) throw new Error("Invalid token signature");

  const payload = base64UrlDecodeJson(payloadB64);

  if (!GOOGLE_ISSUERS.has(payload.iss)) throw new Error("Unexpected token issuer");
  if (payload.aud !== expectedClientId) throw new Error("Token audience mismatch");
  if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) throw new Error("Token expired");
  if (!payload.email_verified) throw new Error("Email not verified with Google");

  return payload;
}
