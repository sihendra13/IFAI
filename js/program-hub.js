// Shared Program rendering (Workshop / Kelas Online / Roadshow / etc).
//  - index.html         -> homepage section, cards identical to the IFAI Signals cards
//  - program.html        -> full listing, same cards in a grid (no 4/2-item limit)
//  - program-detail.html -> single program: header (styled like the Creator Hub
//                           header) + content cards + a Join/Daftar CTA that opens
//                           a registration form. No "More from ..." section.
//
// Data comes from the admin-managed "programs" table. Registrations go straight
// to Supabase (program_registrations, RLS lets anon insert but not read back) so
// a submission is never lost; a Cloudflare Function (functions/api/register-program.js)
// then best-effort emails the admin via Resend — see that file for the env vars
// it needs.
(function () {
  function esc(str) {
    return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Escapes the text, then turns http(s) links into clickable anchors (opening in a new tab).
  function linkify(text) {
    return esc(text).replace(/https?:\/\/(?:(?!&lt;|&gt;|&quot;)[^\s<])+/g, (url) => {
      const m = url.match(/^(.*?)((?:[.,;:!?)\]]|&#39;)*)$/);
      const clean = m[1], tail = m[2];
      return `<a href="${clean}" target="_blank" rel="noopener noreferrer" class="text-cyber-cyan underline underline-offset-2 decoration-cyber-cyan/40 hover:text-white hover:decoration-white transition-colors break-words">${clean}</a>${tail}`;
    });
  }

  function pick(row, field, lang) {
    return (lang === 'id' ? row[field + '_id'] : row[field + '_en']) || row[field + '_en'] || row[field + '_id'] || '';
  }

  function formatDate(dateStr, lang) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function detailHref(row) { return 'program-detail?id=' + encodeURIComponent(row.id); }

  // Sample content shown until real programs exist in the "programs" table (or if
  // the fetch fails). Delete this once the admin has posted real programs.
  const PLACEHOLDER_PROGRAMS = [
    {
      id: 'sample-workshop', __placeholder: true,
      label_id: 'Workshop', label_en: 'Workshop',
      title_id: 'Workshop AI Filmmaking untuk Pemula', title_en: 'AI Filmmaking Workshop for Beginners',
      description_id: 'Belajar dasar-dasar membuat film pendek dengan bantuan AI, dari ide cerita sampai render akhir, bersama kurator IFAI.',
      description_en: 'Learn the basics of AI-assisted short filmmaking, from story idea to final render, with an IFAI curator.',
      image_url: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=1200&q=80',
      event_date: null, event_time: '13:00 WIB', location_text: 'Jakarta',
      registration_open: true
    },
    {
      id: 'sample-roadshow', __placeholder: true,
      label_id: 'Roadshow', label_en: 'Roadshow',
      title_id: 'IFAI Roadshow: Yogyakarta', title_en: 'IFAI Roadshow: Yogyakarta',
      description_id: 'Sesi diskusi dan showcase karya AI Nusantara, terbuka untuk kreator, mahasiswa, dan pelaku industri kreatif lokal.',
      description_en: 'A discussion and showcase of Nusantara AI works, open to creators, students, and local creative industry folks.',
      image_url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200&q=80',
      event_date: null, event_time: '10:00 WIB', location_text: 'Yogyakarta',
      registration_open: true
    }
  ];

  // The featured, real programs (newest first), or the 2 samples above if the
  // table doesn't exist yet, is empty, or the fetch fails.
  async function fetchPrograms(sb, limit) {
    try {
      let q = sb.from('programs').select('*', { count: 'exact' }).order('created_at', { ascending: false });
      if (limit) q = q.limit(limit);
      const { data, count, error } = await q;
      if (error) throw error;
      if (data && data.length) return { rows: data, count: count || data.length, isPlaceholder: false };
    } catch (e) {
      console.error('IFAI: failed to load programs', e);
    }
    return { rows: limit ? PLACEHOLDER_PROGRAMS.slice(0, limit) : PLACEHOLDER_PROGRAMS, count: PLACEHOLDER_PROGRAMS.length, isPlaceholder: true };
  }

  async function fetchProgramById(sb, id) {
    if (!id) return null;
    // A sample program's detail page works without a real database, so
    // "See Detail" on a placeholder card is clickable before any real program exists.
    const sample = PLACEHOLDER_PROGRAMS.find((p) => p.id === id);
    if (sample) return sample;
    try {
      const { data, error } = await sb.from('programs').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    } catch (e) {
      return null;
    }
  }

  // ---------------------------------------------------------------------
  // Card — deliberately identical markup/classes to the IFAI Signals card
  // (index.html's signalCardHtml), just pointed at the program detail page.
  // ---------------------------------------------------------------------
  function programCardHtml(row, lang) {
    const label = pick(row, 'label', lang);
    const title = pick(row, 'title', lang);
    const description = pick(row, 'description', lang);
    const dateStr = formatDate(row.event_date, lang);
    // Placeholders have no real registration_open field — only a real,
    // admin-closed program should ever show the closed badge.
    const isClosed = !row.__placeholder && row.registration_open === false;
    const closedBadge = isClosed
      ? `<span class="absolute top-3 right-3 z-10 inline-block px-3 py-1 rounded-full text-xs font-mono uppercase bg-black/70 border border-zinc-500 text-zinc-300 backdrop-blur-sm">${lang === 'id' ? 'Pendaftaran Ditutup' : 'Registration Closed'}</span>`
      : '';

    return `
<a href="${detailHref(row)}" class="group relative rounded-3xl overflow-hidden border border-zinc-700 bg-cosmic-850 hover:border-[#E3A85F]/50 hover:shadow-[0_0_40px_6px_rgba(227,168,95,0.3)] transition-all duration-300 flex flex-col sm:flex-row w-[85vw] lg:w-auto flex-shrink-0 lg:flex-shrink snap-start">
<div class="flex-1 p-6 sm:p-8 flex flex-col justify-between gap-4 order-2 sm:order-1">
<div>
<span class="inline-block px-3 py-1 rounded-full text-xs font-mono uppercase bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff] mb-3">${esc(label)}</span>
<h3 class="text-xl sm:text-2xl font-bold text-white group-hover:text-[#E3A85F] transition-colors mb-2 line-clamp-3">${esc(title)}</h3>
<p class="text-zinc-400 text-sm leading-relaxed line-clamp-3">${esc(description)}</p>
</div>
<div class="flex items-center gap-4 pt-4 border-t border-zinc-700">
<span class="text-xs font-mono text-zinc-400">${esc(dateStr)}</span>
<span class="relative px-5 py-2.5 rounded-full text-xs font-mono font-semibold overflow-hidden border border-white/50 text-white bg-cosmic-800/80 group-hover:text-black transition-all duration-300 glow-white">
<span class="relative z-10">See Detail →</span>
<span class="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-white transition-transform duration-300 ease-out"></span>
</span>
</div>
</div>
<div class="relative w-full sm:w-2/5 aspect-[16/9] sm:aspect-auto order-1 sm:order-2">
<img src="${row.image_url || ''}" class="absolute inset-0 w-full h-full object-cover" alt="${esc(title)}">
<div class="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-cosmic-850 from-0% via-transparent via-5% to-transparent to-100%"></div>
${closedBadge}
</div>
</a>`;
  }

  function cardSkeletonHtml(count) {
    let out = '';
    for (let i = 0; i < count; i++) {
      out += `
<div class="relative rounded-3xl overflow-hidden border border-zinc-800 bg-cosmic-850/80 flex flex-col sm:flex-row w-[85vw] lg:w-auto flex-shrink-0 lg:flex-shrink snap-start animate-pulse pointer-events-none select-none" aria-hidden="true">
<div class="flex-1 p-6 sm:p-8 flex flex-col justify-between gap-4 order-2 sm:order-1">
<div class="space-y-3">
<div class="w-20 h-5 rounded-full bg-zinc-800/70"></div>
<div class="h-6 bg-zinc-700/50 rounded-md w-4/5"></div>
<div class="h-4 bg-zinc-800/50 rounded-md w-full"></div>
<div class="h-4 bg-zinc-800/40 rounded-md w-2/3"></div>
</div>
<div class="flex items-center gap-4 pt-4 border-t border-zinc-800/60">
<div class="w-20 h-3 bg-zinc-800/60 rounded"></div>
<div class="w-24 h-8 bg-zinc-800/60 rounded-full"></div>
</div>
</div>
<div class="relative w-full sm:w-2/5 aspect-[16/9] sm:aspect-auto order-1 sm:order-2 bg-zinc-800/40 min-h-[160px]"></div>
</div>`;
    }
    return out;
  }

  // ---------------------------------------------------------------------
  // Detail page header — full-width 16:9 poster on top (like a work detail
  // page's hero), badge/title/meta below it.
  // ---------------------------------------------------------------------
  function headerHtml(row, lang) {
    const label = pick(row, 'label', lang);
    const title = pick(row, 'title', lang);
    const dateStr = formatDate(row.event_date, lang);
    const metaParts = [dateStr, row.event_time, row.location_text].filter(Boolean);
    const metaHtml = metaParts.map((p, i) => i === 0
      ? `<span class="text-cyber-cyan font-semibold">${esc(p)}</span>`
      : `<span class="text-slate-300">${esc(p)}</span>`
    ).join('<span class="text-zinc-600">•</span>');

    return `<div class="space-y-5">
${row.image_url ? `<div class="relative w-full aspect-video rounded-2xl overflow-hidden border border-zinc-700 bg-black">
<img alt="${esc(title)}" class="absolute inset-0 w-full h-full object-contain object-center" src="${esc(row.image_url)}">
</div>` : ''}
<div>
<span class="inline-block text-[11px] font-mono px-2 py-1 rounded bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/30 mb-3">${esc(label || 'PROGRAM')}</span>
<h1 class="text-2xl sm:text-4xl font-bold uppercase tracking-tight text-white leading-tight sm:leading-none">${esc(title)}</h1>
<div class="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs sm:text-sm text-cyber-muted pt-3">${metaHtml}</div>
</div>
</div>`;
  }

  // ---------------------------------------------------------------------
  // Content: description card + logistics card, then a full-width Join/Daftar
  // CTA card (this replaces "Featured Work"'s spot — same rhythm, different job).
  // ---------------------------------------------------------------------
  function detailsHtml(row, lang) {
    const isId = lang === 'id';
    const description = pick(row, 'description', lang);
    const rows = [
      row.event_date ? [isId ? 'Tanggal' : 'Date', formatDate(row.event_date, lang)] : null,
      row.event_time ? [isId ? 'Waktu' : 'Time', row.event_time] : null,
      row.location_text ? [isId ? 'Lokasi' : 'Location', row.location_text] : null,
      row.online_url ? [isId ? 'Link Online' : 'Online Link', `<a href="${esc(row.online_url)}" target="_blank" rel="noopener noreferrer" class="text-cyber-cyan underline underline-offset-2 hover:text-white break-all">${esc(row.online_url)}</a>`] : null,
      row.quota ? [isId ? 'Kuota' : 'Quota', esc(row.quota)] : null,
    ].filter(Boolean);

    const infoRows = rows.map(([label, value]) => `
<div class="flex items-start justify-between gap-4 py-2.5 border-b border-zinc-800 last:border-b-0">
<span class="font-mono text-xs uppercase tracking-wider text-zinc-500 flex-shrink-0">${esc(label)}</span>
<span class="text-sm text-slate-200 text-right">${value}</span>
</div>`).join('');

    const isPlaceholder = !!row.__placeholder;
    const isClosed = !isPlaceholder && row.registration_open === false;
    const ctaTitle = isId ? 'Daftar Sekarang' : 'Register Now';
    const ctaLine = isPlaceholder
      ? (isId ? 'Ini contoh program. Tombol daftar aktif begitu admin menambahkan program sungguhan.' : 'This is a sample program. The join button activates once the admin adds a real one.')
      : isClosed
        ? (isId ? 'Pendaftaran untuk program ini sudah ditutup.' : 'Registration for this program is now closed.')
        : (isId ? 'Isi form singkat untuk mengamankan tempatmu di program ini.' : 'Fill out a short form to secure your spot in this program.');

    // Same pill style as "See Detail" on the cards, for both the real button and the
    // placeholder's — the placeholder one just has no data-program-join, so it looks
    // and feels like a normal button but does nothing when clicked (there's no real
    // program id behind it to register against yet).
    const activePillCls = 'group relative w-full inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full text-xs font-mono font-semibold overflow-hidden border border-white/50 text-white bg-cosmic-800/80 hover:text-black transition-all duration-300 glow-white cursor-pointer';
    const pillFill = '<span class="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-white transition-transform duration-300 ease-out"></span>';
    const btnLabel = isId ? 'Daftar / Join →' : 'Join / Register →';
    const sampleLabel = isId ? 'Daftar →' : 'Register →';

    const joinBtn = isPlaceholder
      ? `<button type="button" class="${activePillCls}"><span class="relative z-10">${sampleLabel}</span>${pillFill}</button>`
      : isClosed
        ? `<button type="button" disabled class="w-full inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full text-xs font-mono font-semibold border border-zinc-700 text-zinc-500 bg-cosmic-900 cursor-not-allowed">${isId ? 'Pendaftaran Ditutup' : 'Registration Closed'}</button>`
        : `<button type="button" data-program-join class="${activePillCls}"><span class="relative z-10">${btnLabel}</span>${pillFill}</button>`;

    return `<div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
<div class="lg:col-span-7 rounded-2xl bg-cyber-surface border border-zinc-700 p-6 sm:p-8">
<div class="flex items-center justify-between mb-4">
<h3 class="font-mono text-xs uppercase tracking-widest text-white font-bold flex items-center gap-2">
<span class="w-1 h-3 bg-cyber-cyan inline-block"></span>
<span>${isId ? 'Tentang Program' : 'About the Program'}</span>
</h3>
<span class="font-mono text-[10px] text-slate-500">PROGRAM // INFO</span>
</div>
${description ? `<p class="text-slate-300 text-sm sm:text-base leading-relaxed break-words">${linkify(description)}</p>` : ''}
</div>
<div class="lg:col-span-5 flex flex-col gap-6">
<div class="rounded-2xl bg-cyber-surface border border-zinc-700 p-6 sm:p-8">
<div class="flex items-center justify-between mb-4">
<h3 class="font-mono text-xs uppercase tracking-widest text-white font-bold flex items-center gap-2">
<span class="w-1 h-3 bg-cyber-cyan inline-block"></span>
<span>${isId ? 'Info Acara' : 'Event Info'}</span>
</h3>
<span class="font-mono text-[10px] text-slate-500">SCHEDULE</span>
</div>
${infoRows || `<p class="text-sm text-zinc-500">${isId ? 'Belum ada detail jadwal.' : 'No schedule details yet.'}</p>`}
</div>
<div class="rounded-2xl bg-cyber-surface border border-zinc-700 p-6 sm:p-8 flex flex-col gap-4">
<div>
<h3 class="text-xl font-bold tracking-tight text-white uppercase mb-1">${ctaTitle}</h3>
<p class="text-sm text-zinc-400">${ctaLine}</p>
</div>
${joinBtn}
</div>
</div>
</div>`;
  }

  // ---------------------------------------------------------------------
  // Registration modal — injected once per page; wireProgramModal() opens it
  // for a specific program and handles the submit (DB insert + best-effort
  // email notify).
  // ---------------------------------------------------------------------
  function modalHtml() {
    return `<div id="program-join-modal" class="hidden fixed inset-0 z-[100] flex items-center justify-center p-4">
<div id="program-join-backdrop" class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
<div class="relative w-full max-w-sm rounded-3xl bg-cosmic-900 border border-zinc-700 p-8 shadow-2xl">
<button type="button" id="program-join-close" class="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors" aria-label="Close">
<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
</button>
<h3 id="program-join-title" class="text-xl font-bold text-white mb-1">Join Program</h3>
<p id="program-join-subtitle" class="text-sm text-zinc-400 mb-6"></p>
<form id="program-join-form" class="flex flex-col gap-3">
<input id="program-join-name" type="text" required placeholder="Nama lengkap" class="w-full px-4 py-3 rounded-xl bg-cosmic-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-[#f75500] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
<input id="program-join-email" type="email" required placeholder="you@email.com" class="w-full px-4 py-3 rounded-xl bg-cosmic-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-[#f75500] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
<input id="program-join-phone" type="tel" placeholder="No. WhatsApp (opsional)" class="w-full px-4 py-3 rounded-xl bg-cosmic-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-[#f75500] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
<button type="submit" id="program-join-submit" class="w-full px-5 py-3 rounded-full border border-[#f75500]/50 text-white bg-cosmic-800/80 hover:bg-[#f75500] hover:text-black font-semibold text-sm transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-cosmic-800/80 disabled:hover:text-white">
<span id="program-join-submit-label" class="inline-flex items-center justify-center gap-2 w-full">Daftar</span>
</button>
</form>
<p id="program-join-error" hidden class="text-xs text-red-400 mt-4"></p>
<div id="program-join-success" hidden class="text-center py-4">
<p class="text-white font-semibold mb-1">Terima kasih!</p>
<p class="text-sm text-zinc-400">Pendaftaranmu sudah kami terima.</p>
</div>
</div>
</div>`;
  }

  // `root` is the container whose innerHTML gets replaced on every render (e.g.
  // on a language switch) — the click listener is delegated onto it (which itself
  // never gets replaced) instead of the Join button directly, so it still works
  // after a re-render swaps in a brand new button element.
  function wireProgramModal(sb, program, root) {
    const modal = document.getElementById('program-join-modal');
    if (!modal || modal.dataset.wired) return;
    modal.dataset.wired = '1';

    const backdrop = document.getElementById('program-join-backdrop');
    const closeBtn = document.getElementById('program-join-close');
    const form = document.getElementById('program-join-form');
    const errorEl = document.getElementById('program-join-error');
    const successEl = document.getElementById('program-join-success');
    const submitBtn = document.getElementById('program-join-submit');
    const submitLabel = document.getElementById('program-join-submit-label');
    const nameInput = document.getElementById('program-join-name');
    const emailInput = document.getElementById('program-join-email');
    const phoneInput = document.getElementById('program-join-phone');
    const fields = [nameInput, emailInput, phoneInput];
    // Read the language fresh each time, not once at wire-time, so the modal
    // still switches correctly if the visitor toggles EN/ID while it's closed.
    const currentIsId = () => (window.IFAI_I18N ? window.IFAI_I18N.getLang() : 'en') === 'id';
    const SPINNER_SVG = '<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>';

    function setBusy(isBusy, label) {
      submitBtn.disabled = isBusy;
      fields.forEach((f) => { f.disabled = isBusy; });
      submitLabel.innerHTML = isBusy ? `${SPINNER_SVG}<span>${label}</span>` : label;
    }

    function openModal() {
      const isId = currentIsId();
      document.getElementById('program-join-title').textContent = isId ? 'Daftar Program' : 'Register for Program';
      document.getElementById('program-join-subtitle').textContent = pick(program, 'title', isId ? 'id' : 'en');
      form.style.display = '';
      form.hidden = false;
      errorEl.hidden = true;
      successEl.hidden = true;
      form.reset();
      setBusy(false, isId ? 'Daftar' : 'Register');
      modal.classList.remove('hidden');
    }
    function closeModal() { modal.classList.add('hidden'); }

    (root || document).addEventListener('click', (e) => {
      if (e.target.closest('[data-program-join]')) openModal();
    });
    backdrop.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const isId = currentIsId();
      errorEl.hidden = true;
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const phone = phoneInput.value.trim();
      if (!name || !email) return;

      const title = pick(program, 'title', isId ? 'id' : 'en');
      setBusy(true, isId ? 'Mengirim...' : 'Sending...');
      try {
        // Source of truth: the registration itself, written directly (RLS lets
        // anon insert but never read back — see supabase_programs_migration.sql).
        const { error } = await sb.from('program_registrations').insert({
          program_id: program.id, name, email, phone: phone || null,
        });
        if (error) throw new Error(error.message);

        // Best-effort admin notification; a failure here must not undo the
        // registration that already succeeded above.
        fetch('/api/register-program', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, program_id: program.id, program_title: title, lang: isId ? 'id' : 'en' }),
        }).catch(() => {});

        // `form.hidden` alone doesn't hide it here: the form's own `flex`
        // utility class overrides the browser's `[hidden] { display: none }`
        // rule, so an inline style is used instead to guarantee it disappears.
        form.style.display = 'none';
        successEl.hidden = false;
      } catch (err) {
        errorEl.textContent = (isId ? 'Gagal mendaftar: ' : 'Registration failed: ') + err.message;
        errorEl.hidden = false;
        setBusy(false, isId ? 'Daftar' : 'Register');
      }
    });
  }

  window.IFAI_PROGRAM = { pick, formatDate, detailHref, programCardHtml, cardSkeletonHtml, headerHtml, detailsHtml, modalHtml, wireProgramModal, fetchPrograms, fetchProgramById, PLACEHOLDER_PROGRAMS };
})();
