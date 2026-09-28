// Cloudflare Pages Function for /signal — articles now live at
// /jurnal/<judul>-<id8> (functions/jurnal/[slug].js); old /signal?id= links
// permanently redirect there, and bare /signal (never a real page) goes to
// the /jurnal list. An unknown id still gets signal.html's not-found message.

import { fetchSignals } from './_lib/pages.js';
import { signalPath } from './_lib/urls.js';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  if (!id) return Response.redirect(new URL('/jurnal', url.origin).toString(), 301);

  const rows = await fetchSignals(`id=eq.${encodeURIComponent(id)}`);
  const signal = rows && rows[0];
  if (!signal) return context.next();

  return Response.redirect(new URL(signalPath(signal), url.origin).toString(), 301);
}
