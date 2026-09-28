// Readable, Indonesian public URLs for every content page:
//
//   /kategori/<kategori>                      category archive
//   /kategori/<kategori>/<judul>-<id8>        work
//   /jurnal/<judul>-<id8>                     IFAI Signal article
//   /program/<judul>-<id8>                    program
//   /kreator/<nama>-<id8>                     creator spotlight
//
// <id8> is the first 8 characters of the row's uuid: the server looks the row
// up by it, so editing a title only changes the slug part (old URLs 301 to
// the new one) and nothing has to be stored in the database. Slugs come from
// the Indonesian title, the site's default language.
//
// Keep in sync with js/urls.js (same logic, classic script for the browser).

export const SITE = 'https://www.myifai.com';

// categories.slug in the DB (used everywhere else) -> Indonesian URL segment.
// A category the admin adds later without an entry here simply uses its DB slug.
const CATEGORY_URL_SLUGS = {
  film: 'film',
  commercial: 'iklan',
  music: 'musik',
  'visual-art': 'seni-visual',
  animation: 'animasi'
};

export function slugify(text) {
  return String(text || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' dan ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
}

function itemSlug(title, id) {
  const slug = slugify(title);
  return (slug ? slug + '-' : '') + String(id).slice(0, 8);
}

export function categoryUrlSlug(dbSlug) {
  return CATEGORY_URL_SLUGS[dbSlug] || dbSlug;
}

// URL segment -> categories.slug. Also accepts the DB slug itself, so an old
// /kategori/commercial style link still resolves (and gets redirected).
export function categoryDbSlug(urlSlug) {
  const entry = Object.entries(CATEGORY_URL_SLUGS).find(([, url]) => url === urlSlug);
  return entry ? entry[0] : urlSlug;
}

export function categoryPath(dbSlug) {
  return '/kategori/' + categoryUrlSlug(dbSlug);
}

// `work.categories.slug` must be loaded alongside the work.
export function workPath(work) {
  const cat = (work.categories && work.categories.slug) || 'lainnya';
  return categoryPath(cat) + '/' + itemSlug(work.title_id || work.title_en, work.id);
}

export function signalPath(signal) {
  return '/jurnal/' + itemSlug(signal.title_id || signal.title_en, signal.id);
}

export function programPath(program) {
  return '/program/' + itemSlug(program.title_id || program.title_en, program.id);
}

export function creatorPath(creator) {
  return '/kreator/' + itemSlug(creator.name, creator.id);
}

// "deadpay-post-apocalyptic-western-21fd86b4" -> "21fd86b4" (or null).
export function idPrefixFromSlug(slug) {
  const match = String(slug || '').toLowerCase().match(/(?:^|-)([0-9a-f]{8})$/);
  return match ? match[1] : null;
}

// PostgREST filter for "id starts with prefix": uuids can't be LIKE-matched,
// but every uuid starting with the prefix sorts between these two bounds.
export function idPrefixFilter(prefix) {
  return `id=gte.${prefix}-0000-0000-0000-000000000000&id=lte.${prefix}-ffff-ffff-ffff-ffffffffffff`;
}
