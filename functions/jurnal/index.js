// /jurnal — the IFAI Signals article list (serves journal.html).

export function onRequest(context) {
  return context.env.ASSETS.fetch(new URL('/journal', context.request.url));
}
