// Cloudflare Pages Function for /sitemap.xml — builds the sitemap on each
// request from Supabase, so every approved work, signal, program and creator
// is listed without anyone having to regenerate a static file. Crawlers
// can't discover these pages otherwise: their links only exist after our
// client-side JS has fetched the data.

import { SITE, workPath, categoryPath, signalPath, programPath, creatorPath } from './_lib/urls.js';

const SUPABASE_URL = 'https://qayckglxfmtrjqtghitx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qf2j0vC_6D63ziteKUflCQ_u-rYaIgd';

// Bare /creator is just a copy of the featured creator's /kreator/ page, so
// only the /kreator/ URL goes in.
const STATIC_PATHS = ['/', '/program', '/jurnal'];

async function fetchRows(query) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    });
    const rows = await res.json();
    return Array.isArray(rows) ? rows : [];
  } catch (err) {
    return []; // Supabase hiccup — still serve the static part of the sitemap
  }
}

function xmlEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function urlEntry(path, lastmod) {
  const loc = `<loc>${xmlEscape(SITE + path)}</loc>`;
  const mod = lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : '';
  return `  <url>${loc}${mod}</url>`;
}

export async function onRequest() {
  const [categories, works, signals, programs, creators] = await Promise.all([
    fetchRows('categories?select=slug'),
    fetchRows('works?status=eq.approved&select=id,title_id,title_en,created_at,categories(slug)&order=created_at.desc'),
    fetchRows('signals?select=id,title_id,title_en,created_at&order=created_at.desc'),
    fetchRows('programs?select=id,title_id,title_en,created_at&order=created_at.desc'),
    // Profile pages read creator_spotlights (js/creator-hub.js fetchCreator),
    // not the creators table, and only show featured + approved ones.
    fetchRows('creator_spotlights?is_featured=eq.true&status=eq.approved&select=id,name')
  ]);

  const entries = [
    ...STATIC_PATHS.map((p) => urlEntry(p)),
    ...categories.filter((c) => c.slug).map((c) => urlEntry(categoryPath(c.slug))),
    ...works.map((w) => urlEntry(workPath(w), w.created_at)),
    ...signals.map((s) => urlEntry(signalPath(s), s.created_at)),
    ...programs.map((p) => urlEntry(programPath(p), p.created_at)),
    ...creators.map((c) => urlEntry(creatorPath(c)))
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
