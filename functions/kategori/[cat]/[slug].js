// /kategori/<kategori>/<judul>-<id8> — a work page (serves detail.html).

import { fetchWorks, renderWorkPage } from '../../_lib/work-page.js';
import { workPath } from '../../_lib/urls.js';
import { serveBySlug } from '../../_lib/pages.js';

export function onRequest(context) {
  return serveBySlug(context, {
    slug: context.params.slug,
    fetchByPrefix: fetchWorks,
    pathFor: workPath,
    asset: '/detail',
    render: renderWorkPage
  });
}
