// Cloudflare Pages Function for /journal — the article list moved to /jurnal.

export function onRequest(context) {
  return Response.redirect(new URL('/jurnal', context.request.url).toString(), 301);
}
