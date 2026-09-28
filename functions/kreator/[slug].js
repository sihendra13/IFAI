// /kreator/<nama>-<id8> — a Creator Hub spotlight profile (serves creator.html).

import { creatorPath } from '../_lib/urls.js';
import { serveBySlug, fetchCreators, renderCreatorPage } from '../_lib/pages.js';

export function onRequest(context) {
  return serveBySlug(context, {
    slug: context.params.slug,
    fetchByPrefix: fetchCreators,
    pathFor: creatorPath,
    asset: '/creator',
    render: renderCreatorPage
  });
}
