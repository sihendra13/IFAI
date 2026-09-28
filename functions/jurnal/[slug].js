// /jurnal/<judul>-<id8> — an IFAI Signal article (serves signal.html).

import { signalPath } from '../_lib/urls.js';
import { serveBySlug, fetchSignals, renderSignalPage } from '../_lib/pages.js';

export function onRequest(context) {
  return serveBySlug(context, {
    slug: context.params.slug,
    fetchByPrefix: fetchSignals,
    pathFor: signalPath,
    asset: '/signal',
    render: renderSignalPage
  });
}
