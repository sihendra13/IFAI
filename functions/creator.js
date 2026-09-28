// Cloudflare Pages Function for /creator — spotlight profiles now live at
// /kreator/<nama>-<id8> (functions/kreator/[slug].js); old ?id= links
// permanently redirect there. Bare /creator (the featured creator, or the
// sample placeholder) and unknown ids get creator.html as before.

import { fetchCreators } from './_lib/pages.js';
import { creatorPath } from './_lib/urls.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  if (!id || !UUID.test(id)) return context.next();

  const rows = await fetchCreators(`id=eq.${encodeURIComponent(id)}`);
  const creator = rows && rows[0];
  if (!creator) return context.next();

  return Response.redirect(new URL(creatorPath(creator), url.origin).toString(), 301);
}
