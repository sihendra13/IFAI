// Cloudflare Pages Function for /sitemap.xml — builds the sitemap on each
// request from Supabase, so every approved work, signal, program and creator
// is listed without anyone having to regenerate a static file. Crawlers
// can't discover these pages otherwise: their links only exist after our
// client-side JS has fetched the data.

const SUPABASE_URL = 'https://qayckglxfmtrjqtghitx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qf2j0vC_6D63ziteKUflCQ_u-rYaIgd';
const SITE = 'https://www.myifai.com';

const STATIC_PATHS = ['/', '/program', '/journal', '/signal', '/creator'];

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
    fetchRows('works?status=eq.approved&select=id,created_at&order=created_at.desc'),
    fetchRows('signals?select=id,created_at&order=created_at.desc'),
    fetchRows('programs?select=id,created_at&order=created_at.desc'),
    fetchRows('creators?select=id')
  ]);

  const entries = [
    ...STATIC_PATHS.map((p) => urlEntry(p)),
    ...categories.filter((c) => c.slug).map((c) => urlEntry(`/category?slug=${encodeURIComponent(c.slug)}`)),
    ...works.map((w) => urlEntry(`/detail?id=${encodeURIComponent(w.id)}`, w.created_at)),
    ...signals.map((s) => urlEntry(`/signal?id=${encodeURIComponent(s.id)}`, s.created_at)),
    ...programs.map((p) => urlEntry(`/program-detail?id=${encodeURIComponent(p.id)}`, p.created_at)),
    ...creators.map((c) => urlEntry(`/creator?id=${encodeURIComponent(c.id)}`))
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
