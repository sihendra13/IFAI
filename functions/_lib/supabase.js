// Minimal read-only Supabase REST helper for Pages Functions (public anon key,
// so it only ever sees what RLS lets any visitor see).

export const SUPABASE_URL = 'https://qayckglxfmtrjqtghitx.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_qf2j0vC_6D63ziteKUflCQ_u-rYaIgd';

// `query` is "<table>?<PostgREST filters/select>". Returns the rows, or null
// if Supabase couldn't be reached or answered with an error.
export async function fetchRows(query) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    });
    const rows = await res.json();
    return Array.isArray(rows) ? rows : null;
  } catch (err) {
    return null;
  }
}
