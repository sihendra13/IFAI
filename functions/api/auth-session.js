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

// Not a secret either — the same project URL already hardcoded client-side
// in every page's inline Supabase client.
const SUPABASE_URL = "https://qayckglxfmtrjqtghitx.supabase.co";

// Best-effort: records this Google-based join in Supabase so it shows up
// in admin.html's Community Member tab. Google Sign-In never touches
// Supabase Auth itself (see the file-level comment above), so this is the
// only place that ever persists it. Uses the service role key — server-
// side only, bypasses RLS — since the browser never touches this table
// directly. A failure here must not block the login that already
// succeeded above.
async function recordCommunityMember(env, profile) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/community_members?on_conflict=email`, {
      method: "POST",
      headers: {
        "apikey": env.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({ email: profile.email, display_name: profile.name }),
    });
  } catch {
    // Non-fatal — the session token already succeeded.
  }
}

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

  await recordCommunityMember(env, profile);

  return new Response(JSON.stringify({ sessionToken, ...profile }), { headers: { "content-type": "application/json" } });
}
