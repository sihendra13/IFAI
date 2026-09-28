// Browser twin of functions/_lib/urls.js — builds the readable public URLs
// (/kategori/<kategori>/<judul>-<id8>, /jurnal/..., /program/..., /kreator/...)
// for the cards and links our client JS renders. Keep the two in sync.
(function () {
  const CATEGORY_URL_SLUGS = {
    film: 'film',
    commercial: 'iklan',
    music: 'musik',
    'visual-art': 'seni-visual',
    animation: 'animasi'
  };
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  function slugify(text) {
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

  function category(dbSlug) {
    return '/kategori/' + (CATEGORY_URL_SLUGS[dbSlug] || dbSlug);
  }

  window.IFAI_URL = {
    category,
    // `work.categories.slug` must be loaded alongside the work.
    work(work) {
      const cat = (work.categories && work.categories.slug) || 'lainnya';
      return category(cat) + '/' + itemSlug(work.title_id || work.title_en, work.id);
    },
    signal(signal) {
      return '/jurnal/' + itemSlug(signal.title_id || signal.title_en, signal.id);
    },
    // Sample placeholder programs/creators (no DB row, non-uuid ids) keep the
    // query-string URL their pages already know how to render.
    program(program) {
      return UUID.test(program.id)
        ? '/program/' + itemSlug(program.title_id || program.title_en, program.id)
        : '/program-detail?id=' + encodeURIComponent(program.id);
    },
    creator(creator) {
      if (!creator.id) return '/creator';
      return UUID.test(creator.id)
        ? '/kreator/' + itemSlug(creator.name, creator.id)
        : '/creator?id=' + encodeURIComponent(creator.id);
    },
    // A page's ?<name>= parameter. On the readable URLs there is no query
    // string, so the server passes it as <meta name="ifai-param-<name>">.
    param(name) {
      const fromQuery = new URLSearchParams(window.location.search).get(name);
      if (fromQuery) return fromQuery;
      const meta = document.querySelector('meta[name="ifai-param-' + name + '"]');
      return meta ? meta.getAttribute('content') : null;
    }
  };
})();
