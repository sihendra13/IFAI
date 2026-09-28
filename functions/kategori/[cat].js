// /kategori/<kategori> — category archive (serves category.html). The URL
// segment is the Indonesian name from functions/_lib/urls.js; an old DB-slug
// style segment (/kategori/commercial) 301s to it.

import { fetchRows } from '../_lib/supabase.js';
import { categoryDbSlug, categoryUrlSlug, categoryPath } from '../_lib/urls.js';
import { notFound, renderCategoryPage } from '../_lib/pages.js';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const dbSlug = categoryDbSlug(context.params.cat);

  const rows = await fetchRows(`categories?slug=eq.${encodeURIComponent(dbSlug)}&select=slug,name_en,name_id`);
  if (rows === null) return new Response('Service temporarily unavailable', { status: 503, headers: { 'Retry-After': '30' } });
  const category = rows[0];
  if (!category) return notFound(context);

  if (context.params.cat !== categoryUrlSlug(category.slug)) {
    return Response.redirect(new URL(categoryPath(category.slug), url.origin).toString(), 301);
  }

  const page = await context.env.ASSETS.fetch(new URL('/category', url.origin));
  return renderCategoryPage(page, category);
}
