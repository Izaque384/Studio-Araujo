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

// =====================================================================
// DEPOIMENTOS — lapidação editorial inspirada no carrossel fluido
// Mantém dados, formulário, navegação, autoplay, swipe e acessibilidade.
// =====================================================================
(function refinarDepoimentos() {
  if (document.getElementById('testimonialsEditorialStyle')) return;
  const style = document.createElement('style');
  style.id = 'testimonialsEditorialStyle';
  style.textContent = `
    .testimonials .section-head{max-width:760px;margin-left:auto;margin-right:auto;margin-bottom:34px;text-align:center}
    .testimonials .section-head .eyebrow{justify-content:center}
    .testimonials .section-sub{max-width:620px;margin-left:auto;margin-right:auto}

    .testi-carousel{max-width:1120px;margin:0 auto 34px}
    .testi-carousel::after{opacity:.22!important;filter:blur(.4px)}
    .carousel-wrapper{max-width:1040px;border-radius:0;min-height:330px}
    .carousel-wrapper::before,.carousel-wrapper::after{width:12%;opacity:.82}
    .carousel-track{gap:42px;padding:16px 0;align-items:center}

    .carousel-slide{flex:0 0 76%;opacity:.08;transform:scale(.975);transition:opacity .5s ease,transform .5s ease;pointer-events:none}
    .carousel-slide.active{opacity:1;transform:scale(1);pointer-events:auto}
    .carousel-slide.peek-left,.carousel-slide.peek-right{opacity:.14}

    .carousel-slide .testi-card{
      position:relative;
      min-height:300px;
      padding:42px 86px 38px;
      display:flex;
      flex-direction:column;
      justify-content:center;
      align-items:center;
      text-align:center;
      background:transparent!important;
      border:0!important;
      box-shadow:none!important;
      overflow:visible;
    }
    .carousel-slide .testi-card::before,
    .carousel-slide .testi-card::after{
      position:absolute;
      font-family:'Cormorant Garamond',serif;
      font-size:7rem;
      line-height:1;
      color:rgba(201,162,75,.20);
      pointer-events:none;
    }
    .carousel-slide .testi-card::before{content:'“';left:34px;top:18px}
    .carousel-slide .testi-card::after{content:'”';right:34px;bottom:0}

    .carousel-slide .testi-stars{order:1;margin:0 0 22px;color:var(--gold-light);display:flex;justify-content:center;gap:6px}
    .carousel-slide .testi-stars .star{width:15px;height:15px;opacity:.92}
    .carousel-slide .testi-card blockquote{
      order:2;
      max-width:760px;
      margin:0 auto 26px;
      font-family:'Cormorant Garamond',serif;
      font-size:clamp(1.42rem,2.6vw,2rem);
      font-style:italic;
      font-weight:400;
      line-height:1.42;
      letter-spacing:.005em;
      color:var(--cream);
    }
    .carousel-slide .testi-card figcaption{
      order:3;
      position:relative;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      min-height:66px;
      padding-left:78px;
      text-align:left;
    }
    .carousel-slide .testi-card figcaption::before{
      content:'“';
      position:absolute;
      left:0;
      top:50%;
      transform:translateY(-50%);
      width:58px;
      height:58px;
      border-radius:50%;
      display:grid;
      place-items:center;
      padding-top:7px;
      border:1px solid rgba(201,162,75,.34);
      background:radial-gradient(circle at 34% 28%,rgba(230,200,120,.16),rgba(201,162,75,.05) 58%,transparent 72%);
      color:var(--gold-light);
      font-family:'Cormorant Garamond',serif;
      font-size:2.6rem;
      line-height:1;
      box-shadow:0 12px 30px rgba(0,0,0,.20);
    }
    .carousel-slide .testi-name{font-size:.9rem;font-weight:500;letter-spacing:.04em;color:var(--cream)}
    .carousel-slide .testi-role{margin-top:2px;font-size:.72rem;letter-spacing:.06em;color:var(--muted)}

    .carousel-nav{
      width:46px!important;
      height:46px!important;
      border:1px solid rgba(201,162,75,.42)!important;
      border-radius:50%!important;
      background:rgba(14,13,11,.72)!important;
      backdrop-filter:blur(8px);
      color:var(--gold-light)!important;
      transition:background .25s ease,border-color .25s ease,transform .25s ease!important;
    }
    .carousel-nav:hover{background:rgba(201,162,75,.12)!important;border-color:var(--gold)!important;transform:translateY(-50%) scale(1.04)!important}
    .carousel-prev{left:16px!important}
    .carousel-next{right:16px!important}
    .carousel-dots{margin-top:8px}
    .carousel-dots .c-dot{width:6px;height:6px;opacity:.45;transition:width .25s ease,opacity .25s ease,background .25s ease}
    .carousel-dots .c-dot.on{width:22px;border-radius:99px;opacity:1;background:var(--gold)}

    .dep-form-wrap{margin-top:34px}
    .testi-cta{margin-top:28px}

    @media(max-width:860px){
      .testimonials .section-head{margin-bottom:28px}
      .carousel-wrapper{min-height:300px}
      .carousel-wrapper::before,.carousel-wrapper::after{width:7%}
      .carousel-track{gap:20px}
      .carousel-slide{flex:0 0 88%}
      .carousel-slide .testi-card{min-height:280px;padding:36px 52px 32px}
      .carousel-slide .testi-card::before{left:18px;top:12px;font-size:5.6rem}
      .carousel-slide .testi-card::after{right:18px;font-size:5.6rem}
      .carousel-prev{left:2px!important}
      .carousel-next{right:2px!important}
    }

    @media(max-width:560px){
      .testi-carousel{margin-bottom:26px}
      .carousel-wrapper{min-height:310px}
      .carousel-wrapper::before,.carousel-wrapper::after{display:none!important}
      .carousel-track{gap:14px;padding:8px 0}
      .carousel-slide{flex:0 0 100%}
      .carousel-slide.peek-left,.carousel-slide.peek-right{opacity:0}
      .carousel-slide .testi-card{min-height:300px;padding:36px 44px 30px}
      .carousel-slide .testi-card blockquote{font-size:clamp(1.28rem,6vw,1.58rem);line-height:1.38;margin-bottom:24px}
      .carousel-slide .testi-card::before{left:8px;top:16px;font-size:4.6rem;opacity:.7}
      .carousel-slide .testi-card::after{right:8px;bottom:6px;font-size:4.6rem;opacity:.7}
      .carousel-slide .testi-card figcaption{min-height:54px;padding-left:64px}
      .carousel-slide .testi-card figcaption::before{width:48px;height:48px;font-size:2.2rem}
      .carousel-nav{width:38px!important;height:38px!important}
      .carousel-prev{left:0!important}
      .carousel-next{right:0!important}
      .carousel-dots{margin-top:12px}
    }

    @media(prefers-reduced-motion:reduce){
      .carousel-slide,.carousel-nav,.carousel-dots .c-dot{transition:none!important}
    }
  `;
  document.head.appendChild(style);
})();
