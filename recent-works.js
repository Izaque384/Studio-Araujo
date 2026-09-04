// =====================================================================
// TRABALHOS RECENTES — home conectada ao Neon
// Mantém o bloco estático atual como fallback caso o banco não responda.
// =====================================================================
(async function carregarTrabalhosRecentes() {
  const existente = document.getElementById('trabalhosRecentes');
  const portfolio = document.getElementById('portfolio');
  if (!portfolio) return;

  const escHtml = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const formatarData = (iso) => {
    if (!iso) return '';
    const [y,m,d] = iso.split('-').map(Number);
    if (!y || !m || !d) return '';
    return new Intl.DateTimeFormat('pt-BR', { month:'long', year:'numeric' }).format(new Date(y,m-1,d));
  };

  try {
    const neon = await neonPublicClient();
    const [{ data: trabalhos, error }, { data: categorias }] = await Promise.all([
      neon.from('recent_works')
        .select('id,gallery_category,title,description,work_date,location,sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('work_date', { ascending: false })
        .limit(3),
      neon.from('site_categories').select('slug,label')
    ]);

    if (error || !Array.isArray(trabalhos) || !trabalhos.length) return;
    const labels = new Map((categorias || []).map(c => [c.slug, c.label]));

    const preparados = await Promise.all(trabalhos.map(async (t) => {
      const remoto = await midiasDoPainel(t.gallery_category);
      if (!remoto.ok || !remoto.items.length) return null;
      const itens = remoto.items;
      const capa = itens.find(i => !isVideo(i) && i.is_cover) || itens.find(i => !isVideo(i));
      if (!capa) return null;
      return { ...t, itens, capa, label: labels.get(t.gallery_category) || t.gallery_category };
    }));

    const validos = preparados.filter(Boolean);
    if (!validos.length) return;

    let section = existente;
    if (!section) {
      section = document.createElement('section');
      section.id = 'trabalhosRecentes';
      section.className = 'recent-works-section';
      const stats = document.querySelector('.stats-band');
      if (stats?.parentNode) stats.parentNode.insertBefore(section, stats);
      else portfolio.insertAdjacentElement('afterend', section);
    }

    const cards = validos.map((t, i) => {
      const data = formatarData(t.work_date);
      const meta = [data, t.location].filter(Boolean).map((txt, idx) =>
        `<span class="recent-work-meta-item">${idx === 0 ? '◷' : '⌖'} ${escHtml(txt)}</span>`
      ).join('');
      return `<article class="recent-work-card" data-recent-index="${i}">
        <button type="button" class="recent-work-photo" aria-label="Ver trabalho: ${escHtml(t.title)}">
          <img src="${escHtml(t.capa.url)}" alt="${escHtml(t.capa.alt || t.title)}" loading="lazy" decoding="async">
          <span class="recent-work-tag">${escHtml(t.label.replace(/^Portfólio\s*[—-]\s*/i, ''))}</span>
        </button>
        <div class="recent-work-body">
          <h3>${escHtml(t.title)}</h3>
          <p>${escHtml(t.description || '')}</p>
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

    section.querySelectorAll('.recent-work-card').forEach((card, i) => {
      const abrir = () => lbOpen(validos[i].itens, 0, validos[i].title, card.querySelector('.recent-work-photo'));
      card.querySelector('.recent-work-photo')?.addEventListener('click', abrir);
      card.querySelector('.recent-work-link')?.addEventListener('click', abrir);
    });

    if (!document.getElementById('recentWorksLiveStyle')) {
      const style = document.createElement('style');
      style.id = 'recentWorksLiveStyle';
      style.textContent = `
        .recent-work-meta{display:flex;gap:16px;flex-wrap:wrap;margin-top:15px;color:var(--muted);font-size:.75rem}
        .recent-work-meta-item{display:inline-flex;align-items:center;gap:5px}
      `;
      document.head.appendChild(style);
    }
  } catch (err) {
    console.warn('Trabalhos recentes: usando fallback estático.', err);
  }
})();
