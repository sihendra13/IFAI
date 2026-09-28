// Cloudflare Pages Function for /detail — serves the static detail.html
// unchanged, but when a ?id= is present, rewrites the <title>/og:*/twitter:*
// meta tags to that specific work's real title, thumbnail and description
// server-side, so link unfurlers (WhatsApp, Facebook, Threads, etc. — none
// of which run our client-side JS) show the actual work instead of the
// generic site-wide fallback baked into the HTML file.

import { rewriteMeta, truncate, escapeHtml } from './_lib/og-meta.js';

const SUPABASE_URL = 'https://qayckglxfmtrjqtghitx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qf2j0vC_6D63ziteKUflCQ_u-rYaIgd';

// "1:48" / "1:02:30" (as entered in admin) -> ISO 8601 "PT1M48S"; null if unparseable.
function toIsoDuration(value) {
  const parts = String(value || '').trim().split(':').map(Number);
  if (!parts.length || parts.length > 3 || parts.some((n) => !Number.isFinite(n) || n < 0)) return null;
  const [h, m, sec] = parts.length === 3 ? parts : parts.length === 2 ? [0, ...parts] : [0, 0, parts[0]];
  if (!h && !m && !sec) return null;
  return 'PT' + (h ? h + 'H' : '') + (m ? m + 'M' : '') + (sec ? sec + 'S' : '');
}

function extractYouTubeId(url) {
  const match = (url || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

export async function onRequest(context) {
  const response = await context.next();

  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  if (!id) return response;

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  let work;
  try {
    const apiRes = await fetch(
      `${SUPABASE_URL}/rest/v1/works?id=eq.${encodeURIComponent(id)}&status=eq.approved&select=title_en,title_id,description_en,description_id,youtube_url,duration,created_at,creators(name)`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    const rows = await apiRes.json();
    work = Array.isArray(rows) ? rows[0] : null;
  } catch (err) {
    return response; // Supabase hiccup — fall back to the generic static tags
  }
  if (!work) return response;

  const title = work.title_en || work.title_id || 'IFAI';
  const description = truncate(work.description_en || work.description_id || '');
  const videoId = extractYouTubeId(work.youtube_url);
  const image = videoId
    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    : 'https://www.myifai.com/image/og-image.png';

  // Same paragraph markup detail.html's client JS renders, so there's no
  // visible jump when it takes over.
  const fullDescription = work.description_en || work.description_id || '';
  const descriptionHtml = fullDescription
    .split('\n')
    .filter((p) => p.trim())
    .map((p) => `<p class="text-[14px] leading-relaxed text-on-surface-variant leading-relaxed">${escapeHtml(p)}</p>`)
    .join('');

  const pageUrl = `https://www.myifai.com/detail?id=${encodeURIComponent(id)}`;

  // schema.org VideoObject so Google can show the work as a video result
  // (thumbnail, duration, creator). Only when there's a playable YouTube video.
  let jsonLd;
  if (videoId) {
    const duration = toIsoDuration(work.duration);
    const creatorName = work.creators && work.creators.name;
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: title,
      description: truncate(fullDescription, 1000) || title,
      // hqdefault always exists; maxresdefault only for HD uploads.
      thumbnailUrl: [
        `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      ],
      uploadDate: work.created_at,
      ...(duration && { duration }),
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      url: pageUrl,
      ...(creatorName && { creator: { '@type': 'Person', name: creatorName } }),
      publisher: {
        '@type': 'Organization',
        name: 'IFAI — Indonesia Future Arts & Intelligence',
        url: 'https://www.myifai.com/',
        logo: { '@type': 'ImageObject', url: 'https://www.myifai.com/image/favicon-192x192.png' }
      }
    };
  }

  return rewriteMeta(response, {
    title: `${title} | IFAI`,
    description,
    image,
    url: pageUrl,
    jsonLd,
    text: { '#dp-title': title, '#dp-title-crumb': title },
    html: { '#dp-description': descriptionHtml }
  });
}
