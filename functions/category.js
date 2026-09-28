// Cloudflare Pages Function for /category — category archives now live at
// /kategori/<kategori> (functions/kategori/[cat].js); old /category?slug=
// links permanently redirect there (no slug showed Film, so that goes there).

import { categoryPath } from './_lib/urls.js';

export function onRequest(context) {
  const url = new URL(context.request.url);
  const slug = url.searchParams.get('slug') || 'film';
  return Response.redirect(new URL(categoryPath(slug), url.origin).toString(), 301);
}
