// Cloudflare Pages Function — POST /api/auth-session
// Exchanges a fresh Google ID token (short-lived, ~1hr, from Google Identity
// Services running client-side) for a long-lived IFAI session token (~180
// days), minted server-side via functions/_lib/session.js. Called once right
// after Google Sign-In succeeds; the returned sessionToken is what the
// client stores (localStorage) to know it's logged in.
//
// Using Google Identity Services directly (instead of Supabase's hosted
// OAuth redirect) means the "Sign in with Google" screen shows ifai.pages.dev
// as the destination, not a supabase.co subdomain.

import { verifyGoogleIdToken } from "../_lib/google-auth.js";
import { mintSessionToken } from "../_lib/session.js";

// Not a secret — Google OAuth Client IDs are meant to be embedded in
// frontend code. Must match the client_id used by google.accounts.id.initialize().
const GOOGLE_CLIENT_ID = "214234294300-jc5nboj26s1s1hkee3j70041tsg3uvgj.apps.googleusercontent.com";

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "content-type": "application/json" } });
  }

  const { idToken } = body || {};

  let payload;
  try {
    payload = await verifyGoogleIdToken(idToken, GOOGLE_CLIENT_ID);
  } catch (err) {
    return new Response(JSON.stringify({ error: "Google login is not valid, please try again." }), { status: 401, headers: { "content-type": "application/json" } });
  }

  const profile = {
    sub: payload.sub,
    email: payload.email,
    name: payload.name || payload.email,
    picture: payload.picture || null,
  };

  let sessionToken;
  try {
    sessionToken = await mintSessionToken(env, profile);
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to create a login session." }), { status: 500, headers: { "content-type": "application/json" } });
  }

  return new Response(JSON.stringify({ sessionToken, ...profile }), { headers: { "content-type": "application/json" } });
}
