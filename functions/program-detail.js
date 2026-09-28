// Cloudflare Pages Function for /program-detail — programs now live at
// /program/<judul>-<id8> (functions/program/[slug].js); old ?id= links
// permanently redirect there. Sample placeholder programs (non-uuid ids, no
// DB row) and unknown ids still get program-detail.html as before.

import { fetchPrograms } from './_lib/pages.js';
import { programPath } from './_lib/urls.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  if (!id) return Response.redirect(new URL('/program', url.origin).toString(), 301);
  if (!UUID.test(id)) return context.next();

  const rows = await fetchPrograms(`id=eq.${encodeURIComponent(id)}`);
  const program = rows && rows[0];
  if (!program) return context.next();

  return Response.redirect(new URL(programPath(program), url.origin).toString(), 301);
}
