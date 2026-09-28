// /program/<judul>-<id8> — a program page (serves program-detail.html).
// /program itself is still the static program list (program.html).

import { programPath } from '../_lib/urls.js';
import { serveBySlug, fetchPrograms, renderProgramPage } from '../_lib/pages.js';

export function onRequest(context) {
  return serveBySlug(context, {
    slug: context.params.slug,
    fetchByPrefix: fetchPrograms,
    pathFor: programPath,
    asset: '/program-detail',
    render: renderProgramPage
  });
}
