// Readable URL for a work page: /karya/<slug-of-indonesian-title>-<first 8 chars of id>.
// The id prefix is what the server looks the work up by, so a title edit only
// changes the slug (old URLs 301 to the new one) and nothing is stored in the DB.
// Keep in sync with functions/_lib/work-url.js (same logic, ESM for Functions).
(function () {
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

  window.IFAI_workUrl = function (work) {
    const slug = slugify(work.title_id || work.title_en);
    return '/karya/' + (slug ? slug + '-' : '') + String(work.id).slice(0, 8);
  };
})();
