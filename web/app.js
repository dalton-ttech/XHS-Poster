(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const paths = {
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    book: '<path d="M12 5v15M3 4c4-1 6 0 9 1 3-1 5-2 9-1v15c-4-1-6 0-9 1-3-1-5-2-9-1Z"/>',
    heart: '<path d="M20.8 4.8a5.4 5.4 0 0 0-7.6 0L12 6l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.6a5.4 5.4 0 0 0 0-7.6Z"/>',
    text: '<path d="M4 5h16M12 5v15M8 20h8"/>',
    search: '<circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 15v5h16v-5"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    'arrow-up-right': '<path d="M6 18 18 6M6 6h12v12"/>',
    file: '<path d="M14 3H5v18h14V8l-5-5Zm0 0v5h5M8 12h8M8 16h8"/>',
    'chevron-right': '<path d="m9 5 7 7-7 7"/>',
    'chevron-left': '<path d="m15 5-7 7 7 7"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1"/><path d="m3 17 6-6 4 4 3-3 5 5"/>',
    paper: '<path d="M5 3h14v18H5ZM8 7h8M8 11h8M8 15h5"/>',
    code: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18"/>',
    share: '<path d="M12 16V3m-4 4 4-4 4 4M7 10H4v11h16V10h-3"/>',
    more: '<circle cx="4" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="20" cy="12" r="1"/>',
    copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
    expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  };
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.paper}</svg>`;
  function icons(root = document) { $$('[data-icon]', root).forEach(el => { el.innerHTML = icon(el.dataset.icon); }); }
  const el = (tag, cls, text) => { const node = document.createElement(tag); if (cls) node.className = cls; if (text !== undefined) node.textContent = text; return node; };
  const state = { groups: [], category: 'promo', query: '', mixed: false, current: null, image: 0, saved: new Set(), feedKey: '', returnHash: '#feed/promo', returnScroll: 0 };
  const storageKey = 'paper-post:saved:v2';
  try { const saved = JSON.parse(localStorage.getItem(storageKey) || '[]'); if (Array.isArray(saved)) state.saved = new Set(saved.filter(v => typeof v === 'string')); } catch { /* Private browsing can disable storage. */ }
  const motion = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
  const feed = $('#feed'), post = $('#postDialog'), carousel = $('#carousel');
  let toastTimer, resizeObserver, scrollFrame, carouselWidth = 0;
  function toast(message) {
    const node = $('#toast');
    const dialogs = $$('dialog[open]');
    (dialogs.at(-1) || document.body).append(node);
    node.textContent = message; node.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove('show'), 2200);
  }
  function closeDialog(id) {
    const dialog = $('#' + id);
    if (dialog.contains($('#toast'))) document.body.append($('#toast'));
    dialog.close();
  }
  function showDialog(id) { const dialog = $('#' + id); if (!dialog.open) dialog.showModal(); }
  function layoutFeed() {
    const style = getComputedStyle(feed), unit = parseFloat(style.gridAutoRows), gap = parseFloat(style.rowGap);
    $$('.note-card', feed).forEach(card => {
      card.style.gridRowEnd = `span ${Math.ceil((card.firstElementChild.getBoundingClientRect().height + gap) / (unit + gap))}`;
    });
  }
  function syncSaved() {
    $$('[data-save]').forEach(button => {
      const saved = state.saved.has(button.dataset.save);
      button.classList.toggle('saved', saved);
      button.setAttribute('aria-pressed', saved);
      button.setAttribute('aria-label', `${saved ? '取消收藏' : '收藏'} ${button.dataset.save}`);
      $('.save-label', button).textContent = saved ? '已收藏' : '收藏';
    });
    const saved = state.current && state.saved.has(state.current.version), button = $('[data-action="save-post"]');
    button.classList.toggle('saved', !!saved); button.setAttribute('aria-pressed', !!saved);
    $('span', button).textContent = saved ? '已收藏' : '收藏';
  }
  function save(version) {
    const removing = state.saved.has(version);
    if (removing) state.saved.delete(version); else state.saved.add(version);
    let persisted = true;
    try { localStorage.setItem(storageKey, JSON.stringify([...state.saved])); } catch { persisted = false; }
    syncSaved();
    toast(removing ? '已取消收藏' : persisted ? '已收藏，保存在这台设备' : '已收藏，本次浏览有效');
  }
  function mixedGroups() {
    const promo = state.groups.filter(g => g.kind === 'promo');
    const read = state.groups.filter(g => g.kind === 'read');
    const groups = [];
    for (let i = 0; i < Math.max(promo.length, read.length); i++) {
      // Swap each pair so mobile columns both contain promotion and analysis.
      const pair = i % 2 ? [read[i], promo[i]] : [promo[i], read[i]];
      groups.push(...pair.filter(Boolean));
    }
    return groups;
  }
  function renderFeed(force = false) {
    const query = state.query.trim().toLowerCase();
    const key = `${state.category}/${state.mixed}/${query}`;
    if (!force && key === state.feedKey) return;
    state.feedKey = key;
    const groups = (state.mixed ? mixedGroups() : state.groups).filter(g => {
      if (!state.mixed && !query && g.kind !== state.category) return false;
      return !query || `${g.title} ${g.version} ${g.fullText}`.toLowerCase().includes(query);
    });
    resizeObserver?.disconnect(); feed.replaceChildren();
    groups.forEach(g => {
      const card = el('article', 'note-card'); card.dataset.version = g.version; card.dataset.category = g.kind;
      const content = el('div', 'note-content'), cover = el('a', 'cover-link');
      cover.href = `#post/${g.version}`; cover.setAttribute('aria-label', `查看 ${g.version} ${g.title}`);
      const img = el('img', 'note-cover'); img.src = g.pages[0].url; img.alt = g.pages[0].title; img.width = 1500; img.height = 2000; img.loading = 'lazy'; img.decoding = 'async';
      cover.append(img, el('span', 'cover-count', `${g.pages.length} 图`));
      const heading = el('h2', 'note-title'), link = el('a', '', g.title); link.href = cover.href; heading.append(link);
      const meta = el('div', 'note-meta'), button = el('button', 'save-note');
      button.type = 'button'; button.dataset.save = g.version; button.innerHTML = icon('heart'); button.append(el('span', 'save-label', '收藏'));
      meta.append(el('span', 'mini-avatar', 'J'), el('span', 'version-label', g.version), button);
      content.append(cover, heading, meta); card.append(content); feed.append(card);
    });
    $$('[data-category]').forEach(button => button.setAttribute('aria-pressed', !state.mixed && button.dataset.category === state.category));
    $$('[data-action="mixed"]').forEach(button => { button.classList.toggle('active', state.mixed); if (state.mixed) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current'); });
    $('[data-action="home"]').toggleAttribute('aria-current', !state.mixed);
    if (!state.mixed) $('[data-action="home"]').setAttribute('aria-current', 'page');
    $('#feedLabel').textContent = query ? `搜索“${state.query.trim()}”` : state.mixed ? '混合浏览 · 推广与解读' : 'JEV 论文图文';
    $('#feedCount').textContent = `${groups.length} 个版本`;
    $('.feed-context').classList.toggle('search-context', !!query || state.mixed);
    $('.feed-context [data-action="reset"]').hidden = !query;
    const empty = $('#emptyState'); empty.hidden = !!groups.length;
    $('h1', empty).textContent = '没有找到相关图文';
    $('p', empty).textContent = '试试标题关键词，或直接搜索版本号。';
    $('#feedEnd').hidden = !groups.length;
    feed.setAttribute('aria-busy', 'false'); syncSaved();
    resizeObserver = new ResizeObserver(() => requestAnimationFrame(layoutFeed));
    $$('.note-content').forEach(node => resizeObserver.observe(node));
    requestAnimationFrame(layoutFeed);
  }
  function imageState() {
    if (!state.current) return;
    const { pages } = state.current, i = state.image;
    $('#imageCounter').textContent = `${i + 1} / ${pages.length}`;
    $$('#imageDots button').forEach((button, index) => button.setAttribute('aria-current', index === i));
    $('[data-action="previous-image"]').disabled = i === 0;
    $('[data-action="next-image"]').disabled = i === pages.length - 1;
    $('#currentImageLink').href = pages[i].url; $('#currentImageDownload').href = pages[i].url;
    $('#currentImageDownload').download = `${state.current.version}-${String(i + 1).padStart(2, '0')}.png`;
  }
  function goImage(index) {
    if (!state.current) return;
    state.image = Math.max(0, Math.min(state.current.pages.length - 1, index));
    carousel.scrollTo({ left: carousel.clientWidth * state.image, behavior: motion() }); imageState();
  }
  function renderBody(body) {
    const target = $('#postBody'); target.replaceChildren();
    body.split(/\n\s*\n/).forEach(paragraph => {
      const p = el('p');
      const parts = paragraph.split(/(https?:\/\/[^\s]+|#[^\s#]+)/g);
      parts.forEach(part => {
        if (/^https?:\/\//.test(part)) { const a = el('a', '', part); a.href = part; a.target = '_blank'; a.rel = 'noopener'; p.append(a); }
        else if (part.startsWith('#')) p.append(el('span', 'hashtag', part));
        else p.append(document.createTextNode(part));
      });
      target.append(p);
    });
  }
  function openPost(g) {
    if (post.open && state.current?.version === g.version) return;
    state.current = g; state.image = 0;
    $('#postVersion').textContent = g.version; $('#postCategory').textContent = g.category;
    $('#postTitle').textContent = g.title; renderBody(g.body);
    $('#postDownload').href = g.download; $('#sheetPostDownload').href = g.download;
    $('#postMenuTitle').textContent = `${g.version} · 本版图文`;
    carousel.replaceChildren(); $('#imageDots').replaceChildren();
    g.pages.forEach((page, index) => {
      const slide = el('div', 'slide'), link = el('a'), img = el('img');
      link.href = page.url; link.target = '_blank'; link.rel = 'noopener'; link.setAttribute('aria-label', `查看第 ${index + 1} 张原图：${page.title}`);
      img.src = page.url; img.alt = `${index + 1}. ${page.title}`; img.width = 1500; img.height = 2000; img.draggable = false; img.loading = index < 2 ? 'eager' : 'lazy';
      link.append(img); slide.append(link); carousel.append(slide);
      const dot = el('button'); dot.type = 'button'; dot.dataset.image = index; dot.setAttribute('aria-label', `第 ${index + 1} 张图片`); $('#imageDots').append(dot);
    });
    showDialog('postDialog'); post.scrollTop = 0; $('.post-copy').scrollTop = 0; carouselWidth = carousel.clientWidth; carousel.scrollTo({ left: 0, behavior: 'instant' });
    syncSaved(); imageState(); document.title = `${g.title} · Paper Post`;
  }
  function route() {
    const hash = location.hash, match = /^#post\/(A[\d-]+)$/i.exec(hash);
    if (match) {
      const group = state.groups.find(g => g.version === match[1].toUpperCase());
      if (group) { openPost(group); return; }
      toast('没有找到这个版本，已返回列表'); history.replaceState(null, '', '/#feed/promo');
    }
    const wasOpen = post.open;
    if (wasOpen) { closeDialog('postMenuDialog'); closeDialog('postDialog'); }
    if (location.hash === '#saved') history.replaceState(null, '', '#feed/mixed');
    state.mixed = location.hash === '#feed/mixed';
    if (location.hash === '#feed/read') state.category = 'read';
    else if (location.hash === '#feed/promo') state.category = 'promo';
    renderFeed(); document.title = 'Paper Post · 论文图文 V2';
    if (wasOpen) requestAnimationFrame(() => { window.scrollTo({ top: state.returnScroll, behavior: 'instant' }); $(`.note-card[data-version="${state.current?.version}"] .cover-link`)?.focus({ preventScroll: true }); });
  }
  function navigate(hash) {
    if (hash.startsWith('#post/') && !post.open) {
      state.returnScroll = scrollY; state.returnHash = location.hash || `#feed/${state.category}`;
      history.pushState({ paperPostEntry: true }, '', hash); route();
    } else { if (location.hash !== hash) history.pushState(null, '', hash); route(); }
  }
  function back() {
    if (history.state?.paperPostEntry) history.back();
    else { history.replaceState(null, '', state.returnHash); route(); }
  }
  function setQuery(value) { state.query = value; $$('input[type="search"]').forEach(input => { if (input.value !== value) input.value = value; }); renderFeed(); }
  async function copy(text, message) {
    try {
      try { await navigator.clipboard.writeText(text); }
      catch {
        const active = document.activeElement, area = el('textarea'); area.value = text; area.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0';
        ($$('dialog[open]').at(-1) || document.body).append(area); area.select();
        const done = document.execCommand('copy'); area.remove(); active?.focus({ preventScroll: true }); if (!done) throw new Error('copy');
      }
      toast(message);
    } catch { toast('复制未成功，请在“发布文案”中长按选取'); }
  }
  function copyKind(g, kind) { return copy(kind === 'title' ? g.title : kind === 'body' ? g.body : g.fullText, kind === 'title' ? '标题已复制' : kind === 'body' ? '正文已复制' : '完整文案已复制'); }
  async function share() {
    if (!state.current) return;
    const data = { title: state.current.title, url: `${location.origin}/#post/${state.current.version}` };
    if (navigator.share) { try { await navigator.share(data); return; } catch (error) { if (error.name === 'AbortError') return; } }
    await copy(data.url, '分享链接已复制');
  }
  function captions() {
    $('#captionSelect').value = state.current?.version || state.groups.find(g => g.kind === state.category).version;
    $('#captionText').value = state.groups.find(g => g.version === $('#captionSelect').value).fullText;
    showDialog('captionDialog');
  }
  function reset() { setQuery(''); navigate(state.mixed ? '#feed/mixed' : `#feed/${state.category}`); }
  document.addEventListener('click', event => {
    const button = event.target.closest('button,a'); if (!button) return;
    if (button.dataset.close) { closeDialog(button.dataset.close); return; }
    if (button.dataset.save) { save(button.dataset.save); return; }
    if (button.dataset.category) { state.query = ''; setQuery(''); navigate(`#feed/${button.dataset.category}`); window.scrollTo({ top: 0, behavior: 'instant' }); return; }
    if (button.dataset.copy && state.current) { copyKind(state.current, button.dataset.copy); return; }
    if (button.dataset.captionCopy) { copyKind(state.groups.find(g => g.version === $('#captionSelect').value), button.dataset.captionCopy); return; }
    if (button.dataset.image !== undefined) { goImage(Number(button.dataset.image)); return; }
    const href = button.getAttribute('href');
    if (href?.startsWith('#post/') || href?.startsWith('#feed/')) { event.preventDefault(); if ($('#menuDialog').open) closeDialog('menuDialog'); navigate(href); return; }
    switch (button.dataset.action) {
      case 'menu': showDialog('menuDialog'); break;
      case 'home': state.mixed = false; reset(); window.scrollTo({ top: 0, behavior: motion() }); break;
      case 'mixed': setQuery(''); navigate('#feed/mixed'); window.scrollTo({ top: 0, behavior: 'instant' }); break;
      case 'captions': captions(); break;
      case 'reset': reset(); break;
      case 'search': $('.mobile-search-row').hidden = false; button.setAttribute('aria-expanded', 'true'); $('.mobile-search-row input').focus(); break;
      case 'close-search': $('.mobile-search-row').hidden = true; $('[data-action="search"]').setAttribute('aria-expanded', 'false'); setQuery(''); $('[data-action="search"]').focus(); break;
      case 'back': back(); break;
      case 'share': share(); break;
      case 'save-post': save(state.current.version); break;
      case 'post-menu': showDialog('postMenuDialog'); break;
      case 'previous-image': goImage(state.image - 1); break;
      case 'next-image': goImage(state.image + 1); break;
    }
  });
  $$('form[role="search"]').forEach(form => { form.addEventListener('submit', event => { event.preventDefault(); setQuery($('input', form).value); $('input', form).blur(); }); $('input', form).addEventListener('input', event => setQuery(event.target.value)); });
  $('#captionSelect').addEventListener('change', event => { $('#captionText').value = state.groups.find(g => g.version === event.target.value).fullText; $('#captionText').scrollTop = 0; });
  function resizeCarousel() {
    const width = carousel.clientWidth;
    if (!post.open || !width || width === carouselWidth) return false;
    carouselWidth = width; carousel.scrollTo({ left: width * state.image, behavior: 'instant' }); imageState(); return true;
  }
  carousel.addEventListener('scroll', () => { cancelAnimationFrame(scrollFrame); scrollFrame = requestAnimationFrame(() => { if (!resizeCarousel() && carousel.clientWidth) { state.image = Math.round(carousel.scrollLeft / carousel.clientWidth); imageState(); } }); }, { passive: true });
  carousel.addEventListener('keydown', event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); goImage(state.image + (event.key === 'ArrowRight' ? 1 : -1)); } });
  new ResizeObserver(resizeCarousel).observe(carousel);
  $$('dialog').forEach(dialog => {
    dialog.addEventListener('cancel', event => { event.preventDefault(); if (dialog === post) back(); else closeDialog(dialog.id); });
    dialog.addEventListener('click', event => { if (event.target !== dialog) return; const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) { if (dialog === post) back(); else closeDialog(dialog.id); } });
  });
  window.addEventListener('popstate', route); window.addEventListener('hashchange', route);
  window.addEventListener('storage', event => { if (event.key === storageKey) { try { state.saved = new Set(JSON.parse(event.newValue || '[]')); syncSaved(); } catch { /* Ignore invalid storage. */ } } });
  icons();
  async function init() {
    try {
      const response = await fetch('/site-data.json'); if (!response.ok) throw new Error('data');
      const data = await response.json(); state.groups = data.groups.map(g => ({ ...g, kind: g.category === '论文推广' ? 'promo' : 'read' }));
      state.groups.forEach(g => { const option = el('option', '', `${g.version} · ${g.title}`); option.value = g.version; $('#captionSelect').append(option); });
      const legacy = /^\/versions\/([^/]+)\/(?:index\.html)?$/i.exec(location.pathname);
      if (legacy) {
        const version = legacy[1] === 'a4-1' ? `A4-1-${Number(location.hash.replace('#v', '')) || 1}` : legacy[1].toUpperCase();
        history.replaceState(null, '', `/#post/${version}`);
      }
      const deep = state.groups.find(g => location.hash === `#post/${g.version}`);
      if (deep) { state.category = deep.kind; state.returnHash = `#feed/${deep.kind}`; }
      renderFeed(); route();
    } catch {
      feed.setAttribute('aria-busy', 'false'); $('#emptyState').hidden = false; $('#feedEnd').hidden = true;
      $('#emptyState h1').textContent = '图文暂时没有加载成功'; $('#emptyState p').textContent = '可以刷新重试，或从左侧菜单打开汇总 PDF。';
      const button = $('#emptyState button'); button.textContent = '重新加载'; delete button.dataset.action; button.addEventListener('click', () => location.reload());
    }
  }
  init();
})();
