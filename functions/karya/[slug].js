// Cloudflare Pages Function for /karya/<slug>-<id prefix> — the readable work
// page URL (see functions/_lib/work-url.js). Looks the work up by the 8-char
// id prefix at the end, 301s to the current slug if the title has changed
// since the link was shared, and otherwise serves detail.html with that
// work's meta tags, title, synopsis and structured data filled in.

import { fetchWorks, renderWorkPage } from '../_lib/work-page.js';
import { workPath, idPrefixFromSlug } from '../_lib/work-url.js';

async function notFound(context, url) {
  const page = await context.env.ASSETS.fetch(new URL('/404', url.origin));
  return new Response(page.body, { status: 404, headers: page.headers });
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const prefix = idPrefixFromSlug(context.params.slug);
  if (!prefix) return notFound(context, url);

  // uuids can't be LIKE-matched in PostgREST, but every uuid starting with
  // this prefix sorts between these two bounds.
  const rows = await fetchWorks(
    `id=gte.${prefix}-0000-0000-0000-000000000000&id=lte.${prefix}-ffff-ffff-ffff-ffffffffffff`
  );
  if (rows === null) {
    return new Response('Service temporarily unavailable', { status: 503, headers: { 'Retry-After': '30' } });
  }
  const work = rows[0];
  if (!work) return notFound(context, url);

  const canonicalPath = workPath(work);
  if (url.pathname !== canonicalPath) {
    return Response.redirect(new URL(canonicalPath, url.origin).toString(), 301);
  }

  const page = await context.env.ASSETS.fetch(new URL('/detail', url.origin));
  return renderWorkPage(page, work);
}
