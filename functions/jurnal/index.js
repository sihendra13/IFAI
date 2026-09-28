// /jurnal — the IFAI Signals article list (serves journal.html). The newest
// article's image (the list's first card, and its LCP element) is preloaded so
// it starts downloading before the client script has fetched the list.

import { fetchRows } from '../_lib/supabase.js';
import { preloadImage } from '../_lib/pages.js';
import { rewriteMeta } from '../_lib/og-meta.js';

export async function onRequest(context) {
  const page = await context.env.ASSETS.fetch(new URL('/journal', context.request.url));
  const rows = await fetchRows('signals?select=image_url&order=created_at.desc&limit=1');
  const image = rows && rows[0] && rows[0].image_url;
  return image ? rewriteMeta(page, { headStartHtml: preloadImage(image) }) : page;
}
