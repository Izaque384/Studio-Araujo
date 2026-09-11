// =====================================================================
// TRABALHOS RECENTES — fonte única: painel administrativo / Neon
// Carregado diretamente pela Home. Não depende de depoimentos.js e não usa
// conteúdo estático como fallback.
// =====================================================================
(async function recentWorksModule(){
  'use strict';

  const AUTH_URL = 'https://ep-lucky-rice-axp36rxg.neonauth.c-4.us-east-2.aws.neon.tech/neondb/auth';
  const DATA_API_URL = 'https://ep-lucky-rice-axp36rxg.apirest.c-4.us-east-2.aws.neon.tech/neondb/rest/v1';
  const SYNC_KEY = 'studio-recent-works-updated';
  const section = document.getElementById('trabalhosRecentes');
  if (!section) return;

  let clientPromise = null;
  let syncPromise = null;
  let lastSyncAt = 0;

  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const isVideo = (item) => item?.type === 'video' || String(item?.mime_type || '').startsWith('video/');
  const normalizeMedia = (item) => ({
    url: item?.public_url || item?.url || '',
    type: isVideo(item) ? 'video' : 'image',
    alt: item?.alt_text || item?.alt || '',
    is_cover: !!item?.is_cover
  });
  const formatDate = (value) => {
    if (!value) return '';
    const raw = String(value).slice(0, 10);
    const [y,m,d] = raw.split('-').map(Number);
    if (!y || !m || !d) return '';
    return new Intl.DateTimeFormat('pt-BR', { month:'long', year:'numeric' }).format(new Date(y, m - 1, d));
  };

  async function client(){
    if (!clientPromise) {
      clientPromise = import('https://esm.sh/@neondatabase/neon-js@0.7.0-beta?bundle').then(({createClient, BetterAuthVanillaAdapter}) =>
        createClient({
          auth: { adapter: BetterAuthVanillaAdapter(), url: AUTH_URL, allowAnonymous: true },
          dataApi: { url: DATA_API_URL }
        })
      );
    }
    return clientPromise;
  }

  async function fetchConfiguredWorks(){
    const neon = await client();
    const [worksResult, categoriesResult] = await Promise.all([
      neon.from('recent_works')
        .select('id,gallery_category,title,description,work_date,location,sort_order,is_active')
        .eq('is_active', true)
        .order('sort_order', { ascending:true })
        .order('work_date', { ascending:false })
        .limit(3),
      neon.from('site_categories').select('slug,label')
    ]);

    if (worksResult.error) throw worksResult.error;
    const works = Array.isArray(worksResult.data) ? worksResult.data : [];
    if (!works.length) return [];

    const ids = works.map(w => w.id);
    const mediaResult = await neon.from('site_images')
      .select('id,public_url,alt_text,mime_type,recent_work_id,sort_order,is_cover,is_visible')
      .in('recent_work_id', ids)
      .eq('is_visible', true)
      .order('sort_order', { ascending:true });
    if (mediaResult.error) throw mediaResult.error;

    const labels = new Map((categoriesResult.error ? [] : (categoriesResult.data || [])).map(c => [c.slug, c.label]));
    const allMedia = Array.isArray(mediaResult.data) ? mediaResult.data : [];

    return works.map(work => {
      const items = allMedia.filter(m => m.recent_work_id === work.id).map(normalizeMedia);
      if (!items.length) return null;
      const cover = items.find(i => !isVideo(i) && i.is_cover) || items.find(i => !isVideo(i));
      if (!cover) return null;
      return { ...work, items, cover, label: labels.get(work.gallery_category) || work.gallery_category };
    }).filter(Boolean);
  }

  function render(works){
    if (!works.length) {
      section.innerHTML = '';
      section.hidden = true;
      section.dataset.sync = 'empty';
      return;
    }

    const cards = works.map((work, index) => {
      const date = formatDate(work.work_date);
      const meta = [date, work.location]
        .filter(Boolean)
        .map((text, i) => `<span class="recent-work-meta-item">${i === 0 ? '◷' : '⌖'} ${esc(text)}</span>`)
        .join('');
      const label = String(work.label || '').replace(/^Portfólio\s*[—-]\s*/i, '');
      return `<article class="recent-work-card" data-recent-index="${index}">
        <button type="button" class="recent-work-photo" aria-label="Ver trabalho: ${esc(work.title)}">
          <img src="${esc(work.cover.url)}" alt="${esc(work.cover.alt || work.title)}" loading="lazy" decoding="async">
          <span class="recent-work-tag">${esc(label)}</span>
        </button>
        <div class="recent-work-body">
          <h3>${esc(work.title)}</h3>
          <p>${esc(work.description || '')}</p>
          ${meta ? `<div class="recent-work-meta">${meta}</div>` : ''}
          <button type="button" class="recent-work-link">Ver trabalho <span aria-hidden="true">→</span></button>
        </div>
      </article>`;
    }).join('');

    section.innerHTML = `<div class="wrap">
      <div class="recent-works-head">
        <div class="recent-works-eyebrow"><span></span>Trabalhos recentes<span></span></div>
        <h2>Histórias reais, registradas <em>recentemente</em></h2>
        <p>Uma seleção de trabalhos para mostrar de perto a sensibilidade, o cuidado e o estilo do Studio Araújo.</p>
      </div>
      <div class="recent-works-grid">${cards}</div>
      <div class="recent-works-cta"><a class="btn btn-outline" href="#portfolio">Ver portfólio completo</a></div>
    </div>`;

    section.querySelectorAll('.recent-work-card').forEach((card, index) => {
      const work = works[index];
      const open = () => {
        if (typeof window.studioLightboxOpen === 'function') {
          window.studioLightboxOpen(work.items, 0, work.title, card.querySelector('.recent-work-photo'));
          return;
        }
        if (work.cover?.url) window.open(work.cover.url, '_blank', 'noopener');
      };
      card.querySelector('.recent-work-photo')?.addEventListener('click', open);
      card.querySelector('.recent-work-link')?.addEventListener('click', open);
    });

    section.hidden = false;
    section.dataset.sync = 'ok';
  }

  async function synchronize({force=false}={}){
    const now = Date.now();
    if (!force && now - lastSyncAt < 1200) return;
    if (syncPromise) return syncPromise;
    syncPromise = (async () => {
      let lastError = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          render(await fetchConfiguredWorks());
          lastSyncAt = Date.now();
          return;
        } catch (err) {
          lastError = err;
          if (attempt < 2) await sleep(attempt === 0 ? 500 : 1400);
        }
      }
      section.innerHTML = '';
      section.hidden = true;
      section.dataset.sync = 'error';
      console.warn('Trabalhos recentes: não foi possível sincronizar com o painel.', lastError);
    })().finally(() => { syncPromise = null; });
    return syncPromise;
  }

  window.refreshRecentWorks = () => synchronize({force:true});
  window.addEventListener('storage', (event) => {
    if (event.key === SYNC_KEY) synchronize({force:true});
  });
  window.addEventListener('pageshow', () => synchronize({force:true}));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) synchronize({force:true});
  });

  await synchronize({force:true});
})();
