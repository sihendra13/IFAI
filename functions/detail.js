// Cloudflare Pages Function for /detail — work pages now live at readable
// /karya/<slug>-<id prefix> URLs (functions/karya/[slug].js), so an old
// /detail?id=<uuid> link (already shared on WhatsApp, Instagram, etc.)
// permanently redirects there. If the work isn't found or Supabase can't be
// reached, detail.html is served as before and its client JS handles it.

import { fetchWorks } from './_lib/work-page.js';
import { workPath } from './_lib/work-url.js';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  if (!id) return context.next();

  const rows = await fetchWorks(`id=eq.${encodeURIComponent(id)}`);
  const work = rows && rows[0];
  if (!work) return context.next();

  return Response.redirect(new URL(workPath(work), url.origin).toString(), 301);
}
