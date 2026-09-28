// Server side of the readable URLs (see ./urls.js): the route handler shared by
// /kategori/<kat>/<slug>, /jurnal/<slug>, /program/<slug> and /kreator/<slug>,
// plus the per-type renderers that fill the static page's meta tags, visible
// text and structured data in for crawlers and link unfurlers (which don't
// run our client JS). The client JS still renders the page as before; it just
// reads the row id from <meta name="ifai-param-id"> instead of ?id=.

import { rewriteMeta, truncate, escapeHtml } from './og-meta.js';
import { SITE, idPrefixFromSlug, idPrefixFilter, signalPath, programPath, creatorPath, categoryPath } from './urls.js';
import { fetchRows } from './supabase.js';

const PUBLISHER = {
  '@type': 'Organization',
  name: 'IFAI — Indonesia Future Arts & Intelligence',
  url: SITE + '/',
  logo: { '@type': 'ImageObject', url: SITE + '/image/favicon-192x192.png' }
};

export async function notFound(context) {
  const page = await context.env.ASSETS.fetch(new URL('/404', context.request.url));
  return new Response(page.body, { status: 404, headers: page.headers });
}

function unavailable() {
  return new Response('Service temporarily unavailable', { status: 503, headers: { 'Retry-After': '30' } });
}

// schema.org BreadcrumbList mirroring the visible breadcrumb, so Google can
// show "myifai.com › Kategori › Judul" in results. `trail` is [name, url] pairs
// after Beranda.
export function breadcrumbs(trail) {
  const items = [['Beranda', SITE + '/'], ...trail];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item }))
  };
}

// Starts the page's main image downloading straight away, in parallel with
// our JS, instead of only once the client script has fetched the row from
// Supabase and inserted the <img> (which was costing ~4s of LCP on mobile).
export function preloadImage(url) {
  return url ? `<link rel="preload" as="image" href="${escapeHtml(url)}" fetchpriority="high"/>` : '';
}

function paramMeta(name, value) {
  return `<meta name="ifai-param-${name}" content="${escapeHtml(value)}"/>`;
}

function paragraphsHtml(text, pClass) {
  const open = pClass ? `<p class="${pClass}">` : '<p>';
  return String(text || '')
    .split('\n')
    .filter((p) => p.trim())
    .map((p) => `${open}${escapeHtml(p)}</p>`)
    .join('');
}

// Looks the row up by the 8-char id prefix at the end of the URL slug, 301s
// to the row's current URL if the title (or category) changed since the link
// was shared, 404s unknown slugs, and otherwise serves `asset` rendered for
// that row. `fetchByPrefix(filter)` returns rows (oldest first) or null.
export async function serveBySlug(context, { slug, fetchByPrefix, pathFor, asset, render }) {
  const prefix = idPrefixFromSlug(slug);
  if (!prefix) return notFound(context);

  const rows = await fetchByPrefix(idPrefixFilter(prefix));
  if (rows === null) return unavailable();
  const row = rows[0];
  if (!row) return notFound(context);

  const url = new URL(context.request.url);
  const canonicalPath = pathFor(row);
  if (url.pathname !== canonicalPath) {
    return Response.redirect(new URL(canonicalPath, url.origin).toString(), 301);
  }

  const page = await context.env.ASSETS.fetch(new URL(asset, url.origin));
  return render(page, row);
}

// ---------------------------------------------------------------- signals ---

export function fetchSignals(filter) {
  return fetchRows(`signals?${filter}&select=*&order=created_at.asc`);
}

// Articles are the site's main text content for search, so the server copy
// is the Indonesian one (the default language), matching what visitors see.
export function renderSignalPage(page, signal) {
  const title = signal.title_id || signal.title_en || 'IFAI Signals';
  const label = signal.label_id || signal.label_en || '';
  const body = signal.description_id || signal.description_en || '';
  const pageUrl = SITE + signalPath(signal);
  const image = signal.image_url || SITE + '/image/og-image.png';

  return rewriteMeta(page, {
    title: `${title} | IFAI`,
    description: truncate(body),
    image,
    url: pageUrl,
    headStartHtml: preloadImage(signal.image_url),
    headHtml: paramMeta('id', signal.id),
    attrs: { '#signal-image': { src: signal.image_url, alt: title, fetchpriority: 'high' } },
    jsonLd: [breadcrumbs([['Jurnal', SITE + '/jurnal'], [title, pageUrl]]), {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: title,
      description: truncate(body, 300) || title,
      image: [image],
      datePublished: signal.created_at,
      inLanguage: 'id',
      mainEntityOfPage: pageUrl,
      author: PUBLISHER,
      publisher: PUBLISHER
    }],
    text: { '#signal-title': title, '#signal-title-crumb': title, '#signal-label': label },
    html: { '#signal-description': paragraphsHtml(body) }
  });
}

// --------------------------------------------------------------- programs ---

export function fetchPrograms(filter) {
  return fetchRows(`programs?${filter}&select=*&order=created_at.asc`);
}

// event_time is free text in admin ("19:00 WIB", "19.30"); use it only when a
// clock time can be read from it, as Jakarta time. Otherwise date only.
function eventStart(date, time) {
  const match = String(time || '').match(/(\d{1,2})[.:](\d{2})/);
  if (!match || Number(match[1]) > 23) return date;
  return `${date}T${match[1].padStart(2, '0')}:${match[2]}:00+07:00`;
}

export function renderProgramPage(page, program) {
  const title = program.title_id || program.title_en || 'Program';
  const description = program.description_id || program.description_en || '';
  const pageUrl = SITE + programPath(program);
  const image = program.image_url || SITE + '/image/og-image.png';

  // schema.org Event, only when there's a date and somewhere to attend it —
  // Google rejects Events without a location.
  let jsonLd;
  const place = program.location_text && { '@type': 'Place', name: program.location_text, address: program.location_text };
  const virtual = program.online_url && { '@type': 'VirtualLocation', url: program.online_url };
  if (program.event_date && (place || virtual)) {
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: title,
      description: truncate(description, 300) || title,
      image: [image],
      startDate: eventStart(program.event_date, program.event_time),
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: place && virtual
        ? 'https://schema.org/MixedEventAttendanceMode'
        : place ? 'https://schema.org/OfflineEventAttendanceMode' : 'https://schema.org/OnlineEventAttendanceMode',
      location: place && virtual ? [place, virtual] : (place || virtual),
      organizer: PUBLISHER,
      url: pageUrl
    };
  }

  return rewriteMeta(page, {
    title: `${title} | IFAI`,
    description: truncate(description),
    image,
    url: pageUrl,
    headStartHtml: preloadImage(program.image_url),
    headHtml: paramMeta('id', program.id),
    jsonLd: [breadcrumbs([['Program', SITE + '/program'], [title, pageUrl]]), jsonLd]
  });
}

// ------------------------------------------------------ creator spotlights ---

// Same visibility rule as js/creator-hub.js fetchCreator.
export function fetchCreators(filter) {
  return fetchRows(`creator_spotlights?${filter}&is_featured=eq.true&status=eq.approved&select=*&order=created_at.asc`);
}

export function renderCreatorPage(page, creator) {
  const description = [creator.role, creator.location].filter(Boolean).join(' · ');
  return rewriteMeta(page, {
    title: `${creator.name} | Creator Hub | IFAI`,
    description: description || undefined,
    image: creator.photo_url || undefined,
    url: SITE + creatorPath(creator),
    headHtml: paramMeta('id', creator.id)
  });
}

// ------------------------------------------------------------- categories ---

export function renderCategoryPage(page, category) {
  const name = category.name_id || category.name_en || 'Archive';
  return rewriteMeta(page, {
    title: `${name} | IFAI Archive`,
    description: `Jelajahi ${name} di IFAI: karya berbasis AI dari kreator Indonesia yang dipilih dan dikurasi oleh tim IFAI.`,
    url: SITE + categoryPath(category.slug),
    headHtml: paramMeta('slug', category.slug),
    jsonLd: breadcrumbs([[name, SITE + categoryPath(category.slug)]]),
    text: { '#archive-category-title': name, '#archive-category-name': name }
  });
}
