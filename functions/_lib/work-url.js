// Readable URL for a work page: /karya/<slug-of-indonesian-title>-<first 8 chars of id>.
// Keep in sync with js/work-url.js (same logic, classic script for the browser).

export const SITE = 'https://www.myifai.com';

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

export function workPath(work) {
  const slug = slugify(work.title_id || work.title_en);
  return '/karya/' + (slug ? slug + '-' : '') + String(work.id).slice(0, 8);
}

// "deadpay-post-apocalyptic-western-21fd86b4" -> "21fd86b4" (or null).
export function idPrefixFromSlug(slug) {
  const match = String(slug || '').toLowerCase().match(/(?:^|-)([0-9a-f]{8})$/);
  return match ? match[1] : null;
}
