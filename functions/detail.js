// Cloudflare Pages Function for /detail — serves the static detail.html
// unchanged, but when a ?id= is present, rewrites the <title>/og:*/twitter:*
// meta tags to that specific work's real title, thumbnail and description
// server-side, so link unfurlers (WhatsApp, Facebook, Threads, etc. — none
// of which run our client-side JS) show the actual work instead of the
// generic site-wide fallback baked into the HTML file.

import { rewriteMeta, truncate } from './_lib/og-meta.js';

const SUPABASE_URL = 'https://qayckglxfmtrjqtghitx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qf2j0vC_6D63ziteKUflCQ_u-rYaIgd';

function extractYouTubeId(url) {
  const match = (url || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

export async function onRequest(context) {
  const response = await context.next();

  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  if (!id) return response;

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  let work;
  try {
    const apiRes = await fetch(
      `${SUPABASE_URL}/rest/v1/works?id=eq.${encodeURIComponent(id)}&status=eq.approved&select=title_en,title_id,description_en,description_id,youtube_url`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    const rows = await apiRes.json();
    work = Array.isArray(rows) ? rows[0] : null;
  } catch (err) {
    return response; // Supabase hiccup — fall back to the generic static tags
  }
  if (!work) return response;

  const title = work.title_en || work.title_id || 'IFAI';
  const description = truncate(work.description_en || work.description_id || '');
  const videoId = extractYouTubeId(work.youtube_url);
  const image = videoId
    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    : 'https://www.myifai.com/image/og-image.png';

  return rewriteMeta(response, {
    title: `${title} | IFAI`,
    description,
    image,
    url: `https://www.myifai.com/detail?id=${encodeURIComponent(id)}`
  });
}
