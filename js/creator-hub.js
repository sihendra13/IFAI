// Shared Creator Hub rendering.
//  - index.html   -> profile card only (heroHtml)
//  - creator.html -> full profile page (headerHtml + detailsHtml)
// Data comes from the single featured row of "creator_spotlights" (managed in
// the admin "Creator Hub" tab). PLACEHOLDER is sample content shown until a
// creator is featured; delete it (and the fallbacks that use it) once the real
// creator is live.
(function () {
  function esc(str) {
    return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function safeUrl(u) { return /^https?:\/\//i.test(u || '') ? u : ''; }

  function youTubeId(url) {
    const m = (url || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  function pick(row, field, lang) {
    return (lang === 'id' ? row[field + '_id'] : row[field + '_en']) || row[field + '_en'] || row[field + '_id'] || '';
  }

  const PLACEHOLDER = {
    __placeholder: true,
    name: 'Raka Pratama',
    role: 'AI Filmmaker / Visual Storyteller',
    location: 'Jakarta, Indonesia',
    photo_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxIjTBTS4mTYOYAX6KKjc8EFVc5HEzWL6D6okV9c8b4vXTG8dqsqmLTHlHoa-HD1H0zeyYVl3Oq-xoh_4TZ--i3-8Q5lPeABkb5SsBeJ_Oweo9HLaNindBtSD6bGVzpwQU4FN_4D8R5XUG_Ylyo7PIqyB2A3o-82I5sLs2XNuLnHud76fpfjg0MDJvuWaBZK96eyFwiK-qpIidbRD2h-SxxFsz8Cs1nQtF65BKHLNl',
    quote_en: 'AI is not a replacement for a storyteller. It gives us a new way to tell stories on a wider scale, yet every film still begins with human emotion and one question: what should the audience feel?',
    quote_id: 'AI bukan pengganti seorang storyteller. AI memberi cara baru untuk menceritakan kisah yang lebih luas, namun setiap film tetap berawal dari emosi manusia dan satu pertanyaan: apa yang ingin dirasakan penonton?',
    bio_en: "Raka Pratama is a filmmaker and visual creator exploring how artificial intelligence can become a new language in cinema. Raka's work blends a cinematic approach with AI technology to create visual stories that still begin from human perspective and emotion.",
    bio_id: 'Raka Pratama adalah filmmaker dan kreator visual yang mengeksplorasi bagaimana kecerdasan buatan dapat menjadi bahasa baru dalam sinema. Karyanya memadukan pendekatan sinematik dengan teknologi AI untuk menciptakan cerita visual yang tetap berangkat dari perspektif dan emosi manusia.',
    fields: ['AI Film', 'Visual Storytelling', 'Generative Video', 'AI Art', 'Concept Design'],
    tools: ['Midjourney', 'Runway', 'ComfyUI', 'DaVinci', 'Suno', 'Photoshop'],
    work_title: 'After The Rain',
    work_image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBcnxVPxKOOM9wdmIBkr6r5wWW0db_cfrmHqx7aLpeHEmOFD8rkePjVh_SbPQoJbGsH2C0B16OF3pemmUYxmKRr930O8PVh4OkzkXHWz_CjEZV5_Fe9B6jZ7vtnWX9HlViQo2qsC32fyAFJIRd0Cf5myZU9skXSYxtkGVgeVi0qTHSFiJs-dc9Z5AThsSVq5yczuOL7JHnxezV0lbDhPULyatJla7IBeZG9Aw308oX3',
    work_duration: '08:24',
    work_meta_en: 'SHORT FILM • 2024 • 8 MIN',
    work_meta_id: 'FILM PENDEK • 2024 • 8 MENIT',
    work_synopsis_en: 'A poetic exploration of memory, the post-rain urban landscape, and human inner calm in an age of automation. Every visual sequence was synthesized using custom latent diffusion, with photorealistic anamorphic lighting curation.',
    work_synopsis_id: 'Eksplorasi puitis tentang memori, lanskap perkotaan pasca-hujan, dan ketenangan batin manusia di tengah era otomatisasi. Seluruh sekuens visual disintesis menggunakan custom latent diffusion dengan kurasi pencahayaan anamorfik fotorealistis.'
  };

  // Tools the design has dedicated icons for; anything else gets an initials tile.
  const TOOL_TILES = {
    midjourney: { box: 'text-cyber-cyan', icon: '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>' },
    runway: { box: 'text-cyber-emerald font-bold text-sm', icon: 'R:' },
    comfyui: { box: 'text-cyber-cyan', icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>' },
    davinci: { box: 'text-amber-400', icon: '<div class="w-3.5 h-3.5 rounded-full border-2 border-dashed border-amber-400"></div>', center: true },
    suno: { box: 'text-cyber-cyan', icon: '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"></path></svg>' },
    photoshop: { boxBg: 'bg-[#001e36]', box: 'text-[#31a8ff] font-bold font-mono text-xs', icon: 'Ps', center: true }
  };

  function toolTileHtml(name) {
    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const hit = Object.keys(TOOL_TILES).find((k) => key.includes(k));
    const letters = name.replace(/[^A-Za-z0-9]/g, '').slice(0, 2);
    const t = hit ? TOOL_TILES[hit]
      : { box: 'text-cyber-cyan font-bold font-mono text-xs', icon: esc(letters.charAt(0).toUpperCase() + letters.slice(1).toLowerCase()) };
    return `
<div class="flex flex-col items-center justify-center p-3 rounded-xl bg-cyber-surfaceDim border border-cyber-border">
<div class="w-8 h-8 rounded-lg ${t.boxBg || 'bg-black/40'} flex items-center justify-center mb-1.5 ${t.box}">${t.icon}</div>
<span class="font-mono text-[11px] text-slate-300${t.center ? ' text-center leading-tight' : ''}">${esc(name)}</span>
</div>`;
  }

  // Same look and hover slide-in as the "See Detail" button on the Signals cards.
  const PILL_CLS = 'group relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-mono font-semibold overflow-hidden border border-white/50 text-white bg-cosmic-800/80 hover:text-black transition-all duration-300 glow-white cursor-pointer';
  const PILL_SLIDE = '<span class="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-white transition-transform duration-300 ease-out"></span>';

  function detailHref(c) { return c.id ? 'creator?id=' + encodeURIComponent(c.id) : 'creator'; }

  // Small "verified" pill shown next to the section / page title.
  function pillHtml() {
    return `<div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyber-surface border border-cyber-border text-xs font-mono text-slate-300">
<svg class="w-4 h-4 text-cyber-cyan" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z"></path></svg>
<span data-i18n="creator.status">VERIFIED IFAI FELLOW</span>
</div>`;
  }

  // "AI FILMMAKER / VISUAL STORYTELLER  •  📍 Jakarta" line, shared by the card and the page header.
  function roleLocationHtml(c) {
    const roleParts = (c.role || '').split('/').map((x) => x.trim()).filter(Boolean);
    const roleHtml = roleParts.length
      ? `<span class="text-cyber-cyan tracking-wider font-semibold uppercase">${esc(roleParts[0])}</span>`
        + (roleParts.length > 1 ? `<span>/</span><span class="text-slate-300 uppercase">${esc(roleParts.slice(1).join(' / '))}</span>` : '')
      : '';
    const locationHtml = c.location
      ? `${roleParts.length ? '<span class="hidden sm:inline text-cyber-border">•</span>' : ''}
<span class="flex items-center gap-1 text-slate-400">
<svg class="w-3.5 h-3.5 text-cyber-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>
${esc(c.location)}
</span>`
      : '';
    return roleHtml + locationHtml;
  }

  // Profile card on the homepage, with a "More About" button bottom-right.
  function heroHtml(c, lang) {
    const isId = lang === 'id';
    const name = c.name || '';
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || name;
    const nameHtml = nameParts.length > 1
      ? `${esc(nameParts[0])}<br><span class="text-slate-100">${esc(nameParts.slice(1).join(' '))}</span>`
      : esc(name);


    const quote = pick(c, 'quote', lang);
    const photo = safeUrl(c.photo_url);

    const footer = `<div class="pt-4 flex items-center justify-end">
<a href="${esc(detailHref(c))}" class="${PILL_CLS}">
<span class="relative z-10">${isId ? 'Lebih Banyak Tentang' : 'More About'} ${esc(firstName)}</span>
<span class="relative z-10">→</span>
${PILL_SLIDE}
</a>
</div>`;

    return `<article class="relative rounded-2xl bg-cyber-surface border border-zinc-700 overflow-hidden shadow-2xl">
<div class="absolute -right-20 -top-20 w-96 h-96 bg-cyber-emerald/10 rounded-full blur-3xl pointer-events-none"></div>
<div class="absolute left-1/4 -bottom-20 w-80 h-80 bg-cyber-cyan/10 rounded-full blur-3xl pointer-events-none"></div>
<div class="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
<div class="lg:col-span-6 relative group overflow-hidden bg-black flex items-end min-h-[380px] lg:min-h-full">
${photo ? `<img alt="${esc(name)}" class="absolute inset-0 w-full h-full object-cover object-center filter grayscale contrast-110 group-hover:scale-105 transition-transform duration-700 ease-out opacity-85" src="${esc(photo)}">` : ''}
<div class="absolute inset-0 bg-gradient-to-t from-cyber-surface via-cyber-darkBg/50 to-transparent"></div>
<div class="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-cyber-surface/90 hidden lg:block"></div>
</div>
<div class="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between relative z-10">
<div>
<div class="flex items-center justify-between gap-4 mb-6">
<span data-i18n="creator.profileBadge" class="text-[11px] font-mono px-2 py-1 rounded bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/30">CREATOR PROFILE</span>
</div>
<div class="space-y-2 mb-8">
<h3 class="text-4xl sm:text-5xl font-bold uppercase tracking-tight text-white leading-none">${nameHtml}</h3>
<div class="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs sm:text-sm text-cyber-muted pt-2">${roleLocationHtml(c)}</div>
</div>
${quote ? `<blockquote class="p-5 rounded-xl bg-cyber-darkBg/60 text-slate-300 text-sm sm:text-base leading-relaxed italic mb-8"><span class="text-cyber-cyan text-xl not-italic">“</span>${esc(quote)}<span class="text-cyber-cyan text-xl not-italic">”</span></blockquote>` : ''}
</div>
${footer}
</div>
</div>
</article>`;
  }

  // Compact profile header for /creator: photo, name, role/location and the
  // share icons (the big card on the homepage would just repeat itself here).
  function headerHtml(c) {
    const photo = safeUrl(c.photo_url);
    const shareBtn = 'w-9 h-9 rounded-full bg-cosmic-800 border border-zinc-700 hover:border-[#f75500] flex items-center justify-center text-zinc-300 hover:text-[#f75500] transition-colors';
    return `<div class="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
${photo ? `<div class="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border border-zinc-700 bg-black flex-shrink-0">
<img alt="${esc(c.name)}" class="w-full h-full object-cover object-center filter grayscale contrast-110 opacity-85" src="${esc(photo)}">
</div>` : ''}
<div class="flex-1 min-w-0">
<span data-i18n="creator.profileBadge" class="inline-block text-[11px] font-mono px-2 py-1 rounded bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/30 mb-3">CREATOR PROFILE</span>
<h1 class="text-3xl sm:text-5xl font-bold uppercase tracking-tight text-white leading-none">${esc(c.name)}</h1>
<div class="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs sm:text-sm text-cyber-muted pt-3">${roleLocationHtml(c)}</div>
</div>
<div class="flex items-center gap-3 sm:self-end" id="creator-share-row">
${['whatsapp:fa-brands fa-whatsapp:WhatsApp', 'facebook:fa-brands fa-facebook-f:Facebook', 'threads:fa-brands fa-threads:Threads', 'linkedin:fa-brands fa-linkedin-in:LinkedIn'].map((s) => {
  const [key, icon, label] = s.split(':');
  return `<a data-share="${key}" target="_blank" rel="noopener" title="${label}" class="${shareBtn}"><i class="${icon}"></i></a>`;
}).join('\n')}
<button type="button" data-share-copy title="Copy link" class="${shareBtn}"><i class="fa-solid fa-link"></i></button>
</div>
</div>`;
  }

  // About + creative fields + tools, then the featured work (profile page only).
  function detailsHtml(c, lang) {
    const isId = lang === 'id';
    const name = c.name || '';
    const bio = pick(c, 'bio', lang);
    const quote = pick(c, 'quote', lang);
    const hasAbout = !!(bio || quote);
    const fields = (c.fields || []).filter(Boolean);
    const tools = (c.tools || []).filter(Boolean);
    // Side by side with "About" the tools column is narrower: 3 per row at lg+.
    const toolsCols = hasAbout ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6';

    const fieldsBlock = fields.length ? `
<div>
<div class="flex items-center justify-between mb-3">
<h3 class="font-mono text-xs uppercase tracking-widest text-white font-bold flex items-center gap-2">
<span class="w-1 h-3 bg-cyber-cyan inline-block"></span>
<span data-i18n="creator.fieldsTitle">Creative Fields</span>
</h3>
<span class="font-mono text-[10px] text-slate-500">EXPERTISE DOMAINS</span>
</div>
<div class="flex flex-wrap gap-2 pt-1">
${fields.map((f) => `<span class="px-3 py-1.5 rounded-lg bg-cyber-surfaceDim border border-cyber-border text-xs font-medium text-slate-200">${esc(f)}</span>`).join('')}
</div>
</div>` : '';
    const toolsBlock = tools.length ? `
<div class="${fields.length ? 'border-t border-zinc-700 pt-5' : ''}">
<div class="flex items-center justify-between mb-3">
<h3 class="font-mono text-xs uppercase tracking-widest text-white font-bold flex items-center gap-2">
<span class="w-1 h-3 bg-cyber-cyan inline-block"></span>
<span data-i18n="creator.toolsTitle">Tools Used</span>
</h3>
<span class="font-mono text-[10px] text-slate-500">NEURAL STACK</span>
</div>
<div class="grid ${toolsCols} gap-2.5 pt-1">${tools.map(toolTileHtml).join('')}</div>
</div>` : '';

    // Featured work (hidden entirely when it has no title)
    let workBlock = '';
    if (c.work_title) {
      const watchUrl = safeUrl(c.work_watch_url);
      const ytId = youTubeId(watchUrl);
      // No uploaded image? Fall back to the YouTube thumbnail.
      const workImg = safeUrl(c.work_image_url) || (ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : '');
      const meta = pick(c, 'work_meta', lang);
      const synopsis = pick(c, 'work_synopsis', lang);
      const playLabel = esc('Play: ' + c.work_title);
      const playCls = 'w-[68px] h-12 rounded-xl bg-[#FF0000] hover:bg-[#cc0000] text-white flex items-center justify-center shadow-lg shadow-black/40 hover:scale-110 transition-all duration-300';
      const playIcon = '<svg class="w-6 h-6 fill-current -ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>';
      const watchCls = PILL_CLS.replace('px-5 py-2.5', 'px-8 py-3 min-w-[200px]');
      const watchInner = '<svg class="relative z-10 w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg><span class="relative z-10" data-i18n="creator.watchNow">Watch Now</span>' + PILL_SLIDE;
      // YouTube links play in place; any other link opens in a new tab.
      // Placeholder content has no video, so its buttons are visual only.
      const inert = !!c.__placeholder && !watchUrl;
      const playBtn = ytId
        ? `<button type="button" data-play-video="${ytId}" aria-label="${playLabel}" class="${playCls}">${playIcon}</button>`
        : (watchUrl ? `<a href="${esc(watchUrl)}" target="_blank" rel="noopener" aria-label="${playLabel}" class="${playCls}">${playIcon}</a>`
          : (inert ? `<button type="button" aria-label="${playLabel}" class="${playCls}">${playIcon}</button>` : ''));
      const watchBtn = ytId
        ? `<button type="button" data-play-video="${ytId}" class="${watchCls}">${watchInner}</button>`
        : (watchUrl ? `<a href="${esc(watchUrl)}" target="_blank" rel="noopener" class="${watchCls}">${watchInner}</a>`
          : (inert ? `<button type="button" class="${watchCls}">${watchInner}</button>` : ''));
      workBlock = `
<div class="space-y-4 pt-2">
<div class="flex items-center gap-3">
<h3 data-i18n="creator.featuredTitle" class="text-xl font-bold tracking-tight text-white uppercase">Featured Work</h3>
<span data-i18n="creator.featuredBadge" class="px-2 py-0.5 rounded text-[10px] font-mono bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/30">MAIN SHOWCASE</span>
</div>
<article class="rounded-2xl bg-cyber-surface border border-zinc-700 overflow-hidden shadow-xl">
<div data-work-media data-title="${esc(c.work_title)}" class="relative group bg-black overflow-hidden aspect-video">
${workImg ? `<img alt="${esc(c.work_title)}" class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out" src="${esc(workImg)}"${ytId ? ` onerror="this.onerror=null;this.src='https://img.youtube.com/vi/${ytId}/hqdefault.jpg'"` : ''}>` : ''}
<div class="absolute inset-0 bg-gradient-to-t from-cyber-surface via-transparent to-black/30 pointer-events-none"></div>
${playBtn ? `<div class="absolute inset-0 flex items-center justify-center">${playBtn}</div>` : ''}
${c.work_duration ? `<div class="absolute bottom-4 left-4 font-mono text-xs text-white/80 bg-black/60 px-2 py-1 rounded border border-white/10">${esc(c.work_duration)}</div>` : ''}
</div>
<div class="p-6 sm:p-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
<div class="space-y-4 min-w-0 md:max-w-3xl">
${meta ? `<div><span class="inline-block text-[11px] font-mono uppercase px-2 py-1 rounded bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/30">${esc(meta)}</span></div>` : ''}
<div>
<h4 class="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">${esc(c.work_title)}</h4>
<p class="font-mono text-xs text-white mt-1">${isId ? 'Oleh' : 'By'} ${esc(name)}</p>
</div>
${synopsis ? `<p class="text-slate-300 text-sm leading-relaxed font-normal">${esc(synopsis)}</p>` : ''}
</div>
${watchBtn ? `<div class="flex-shrink-0">${watchBtn}</div>` : ''}
</div>
</article>
</div>`;
    }

    const hasRight = !!(fieldsBlock || toolsBlock);
    const topGrid = (hasAbout || hasRight) ? `<div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
${hasAbout ? `<div class="${hasRight ? 'lg:col-span-7' : 'lg:col-span-12'} rounded-2xl bg-cyber-surface border border-zinc-700 p-6 sm:p-8">
<div class="flex items-center justify-between mb-4">
<h3 class="font-mono text-xs uppercase tracking-widest text-white font-bold flex items-center gap-2">
<span class="w-1 h-3 bg-cyber-cyan inline-block"></span>
<span data-i18n="creator.aboutTitle">About the Creator</span>
</h3>
<span class="font-mono text-[10px] text-slate-500">BIO // ARCHIVE</span>
</div>
${quote ? `<blockquote class="p-5 rounded-xl bg-cyber-darkBg/60 text-slate-300 text-sm sm:text-base leading-relaxed italic ${bio ? 'mb-5' : ''}"><span class="text-cyber-cyan text-xl not-italic">“</span>${esc(quote)}<span class="text-cyber-cyan text-xl not-italic">”</span></blockquote>` : ''}
${bio ? `<p class="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">${esc(bio)}</p>` : ''}
</div>` : ''}
${hasRight ? `<div class="${hasAbout ? 'lg:col-span-5' : 'lg:col-span-12'} rounded-2xl bg-cyber-surface border border-zinc-700 p-6 sm:p-8 flex flex-col justify-between gap-6">${fieldsBlock}${toolsBlock}</div>` : ''}
</div>` : '';

    return workBlock + topGrid;
  }

  // Copy / share row (profile page).
  function wireShare(root, title, url) {
    const row = root.querySelector('#creator-share-row');
    if (!row) return;
    const shareUrls = {
      whatsapp: 'https://api.whatsapp.com/send?text=' + encodeURIComponent(title + ' | IFAI - ' + url),
      facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url),
      threads: 'https://www.threads.net/intent/post?text=' + encodeURIComponent(title + ' | IFAI - ' + url),
      linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url)
    };
    row.querySelectorAll('[data-share]').forEach((el) => { el.href = shareUrls[el.getAttribute('data-share')]; });
    const copyBtn = row.querySelector('[data-share-copy]');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(url);
          const icon = copyBtn.querySelector('i');
          icon.className = 'fa-solid fa-check';
          setTimeout(() => { icon.className = 'fa-solid fa-link'; }, 1500);
        } catch (e) {
          // clipboard API unavailable — nothing else to fall back to here
        }
      });
    }
  }

  // Watch Now / big play button: swap the artwork for the YouTube player.
  function wirePlay(root) {
    if (root.__ifaiPlayWired) return;
    root.__ifaiPlayWired = true;
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-play-video]');
      if (!btn) return;
      const pane = root.querySelector('[data-work-media]');
      if (!pane) return;
      const id = btn.getAttribute('data-play-video');
      pane.innerHTML = `<iframe class="absolute inset-0 w-full h-full" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0" title="${esc(pane.getAttribute('data-title') || 'Video')}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
      pane.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  // The featured, approved creator (or that creator by id). null when none / on error.
  async function fetchCreator(sb, id) {
    let q = sb.from('creator_spotlights').select('*').eq('is_featured', true).eq('status', 'approved');
    if (id) q = q.eq('id', id);
    const { data, error } = await q.limit(1);
    if (error) { console.error('IFAI: failed to load creator spotlight', error); return null; }
    return (data && data.length) ? data[0] : null;
  }

  window.IFAI_CREATOR = { PLACEHOLDER, heroHtml, headerHtml, detailsHtml, pillHtml, wireShare, wirePlay, fetchCreator, esc };
})();
