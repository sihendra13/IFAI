// Minimal read-only Supabase REST helper for Pages Functions (public anon key,
// so it only ever sees what RLS lets any visitor see).

export const SUPABASE_URL = 'https://qayckglxfmtrjqtghitx.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_qf2j0vC_6D63ziteKUflCQ_u-rYaIgd';

// How long Cloudflare's edge keeps a Supabase answer before asking again.
// Server-rendered pages wait on this lookup before sending any HTML, so a
// cached answer cuts their time-to-first-byte; the trade-off is that an edit
// in admin can take up to this long to show on those pages.
const EDGE_CACHE_SECONDS = 60;

// `query` is "<table>?<PostgREST filters/select>". Returns the rows, or null
// if Supabase couldn't be reached or answered with an error.
export async function fetchRows(query) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      cf: { cacheTtl: EDGE_CACHE_SECONDS, cacheEverything: true }
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) ? rows : null;
  } catch (err) {
    return null;
  }
}
