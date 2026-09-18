// Cloudflare Pages Function for /signal — same idea as functions/detail.js,
// but for a single IFAI Signal (image + article), using its own cover image
// instead of a YouTube thumbnail.

import { rewriteMeta, truncate } from './_lib/og-meta.js';

const SUPABASE_URL = 'https://qayckglxfmtrjqtghitx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qf2j0vC_6D63ziteKUflCQ_u-rYaIgd';

export async function onRequest(context) {
  const response = await context.next();

  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  if (!id) return response;

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  let signal;
  try {
    const apiRes = await fetch(
      `${SUPABASE_URL}/rest/v1/signals?id=eq.${encodeURIComponent(id)}&select=title_en,title_id,description_en,description_id,image_url`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    const rows = await apiRes.json();
    signal = Array.isArray(rows) ? rows[0] : null;
  } catch (err) {
    return response;
  }
  if (!signal) return response;

  const title = signal.title_en || signal.title_id || 'IFAI Signals';
  const description = truncate(signal.description_en || signal.description_id || '');
  const image = signal.image_url || 'https://www.myifai.com/image/og-image.png';

  return rewriteMeta(response, {
    title: `${title} | IFAI`,
    description,
    image,
    url: `https://www.myifai.com/signal?id=${encodeURIComponent(id)}`
  });
}
