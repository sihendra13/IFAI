// Cloudflare Pages Function for /category — same idea as functions/detail.js:
// serves category.html unchanged, but when ?slug= matches a real category,
// rewrites the <title>/description/og:* tags and the visible heading to that
// category server-side, so each category has its own title in search results
// instead of the generic "IFAI — Archive" baked into the HTML file.

import { rewriteMeta } from './_lib/og-meta.js';

const SUPABASE_URL = 'https://qayckglxfmtrjqtghitx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qf2j0vC_6D63ziteKUflCQ_u-rYaIgd';

export async function onRequest(context) {
  const response = await context.next();

  const url = new URL(context.request.url);
  const slug = url.searchParams.get('slug');
  if (!slug) return response;

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  let category;
  try {
    const apiRes = await fetch(
      `${SUPABASE_URL}/rest/v1/categories?slug=eq.${encodeURIComponent(slug)}&select=name_en,name_id`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    const rows = await apiRes.json();
    category = Array.isArray(rows) ? rows[0] : null;
  } catch (err) {
    return response; // Supabase hiccup — fall back to the generic static tags
  }
  if (!category) return response;

  const name = category.name_en || category.name_id || 'Archive';

  return rewriteMeta(response, {
    title: `${name} | IFAI Archive`,
    description: `${name}: AI-driven works by Indonesian creators, curated by IFAI — Indonesia Future Arts & Intelligence.`,
    url: `https://www.myifai.com/category?slug=${encodeURIComponent(slug)}`,
    text: { '#archive-category-title': name, '#archive-category-name': name }
  });
}
