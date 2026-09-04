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
// DEPOIMENTOS — carrossel editorial fluido (opção 4)
// Mantém dados, formulário, navegação, autoplay, swipe e acessibilidade.
// =====================================================================
(function refinarDepoimentos() {
  if (document.getElementById('testimonialsEditorialStyle')) return;
  const style = document.createElement('style');
  style.id = 'testimonialsEditorialStyle';
  style.textContent = `
    .testimonials .section-head{max-width:760px;margin-left:auto;margin-right:auto;margin-bottom:28px;text-align:center}
    .testimonials .section-head .eyebrow{justify-content:center}
    .testimonials .section-sub{max-width:620px;margin-left:auto;margin-right:auto}

    .testi-carousel{max-width:1120px;margin:0 auto 34px;position:relative}
    .testi-carousel::after{opacity:.12!important}
    .carousel-wrapper{max-width:1040px;min-height:300px;border-radius:0;overflow:hidden}
    .carousel-wrapper::before,.carousel-wrapper::after{width:8%;opacity:.7}
    .carousel-track{gap:34px;padding:12px 0;align-items:center}

    .carousel-slide{flex:0 0 82%;opacity:.05;transform:scale(.985);pointer-events:none;transition:opacity .48s ease,transform .48s ease}
    .carousel-slide.active{opacity:1;transform:scale(1);pointer-events:auto}
    .carousel-slide.peek-left,.carousel-slide.peek-right{opacity:.08}

    .carousel-slide.testi-card{
      position:relative!important;
      min-height:270px!important;
      margin:0!important;
      padding:34px 86px 34px 190px!important;
      display:grid!important;
      grid-template-columns:1fr!important;
      grid-template-rows:auto auto auto!important;
      align-content:center!important;
      text-align:left!important;
      background:transparent!important;
      border:0!important;
      border-radius:0!important;
      box-shadow:none!important;
      overflow:visible!important;
      transform:none!important;
    }
    .carousel-slide.testi-card:hover{transform:none!important;box-shadow:none!important;border-color:transparent!important}
    .carousel-slide.testi-card::before{
      content:'“'!important;
      position:absolute!important;
      left:88px!important;
      top:40px!important;
      width:82px!important;
      height:82px!important;
      display:grid!important;
      place-items:center!important;
      border-radius:50%!important;
      border:1px solid rgba(201,162,75,.34)!important;
      background:radial-gradient(circle at 35% 30%,rgba(230,200,120,.16),rgba(201,162,75,.05) 62%,transparent 75%)!important;
      color:var(--gold-light)!important;
      font-family:'Cormorant Garamond',serif!important;
      font-size:4.4rem!important;
      line-height:1!important;
      opacity:1!important;
      box-shadow:0 14px 32px rgba(0,0,0,.18)!important;
    }
    .carousel-slide.testi-card::after{
      content:'”'!important;
      position:absolute!important;
      right:68px!important;
      bottom:22px!important;
      top:auto!important;
      left:auto!important;
      width:auto!important;
      height:auto!important;
      background:none!important;
      color:rgba(201,162,75,.28)!important;
      font-family:'Cormorant Garamond',serif!important;
      font-size:6.2rem!important;
      line-height:1!important;
      opacity:1!important;
    }

    .carousel-slide.testi-card .testi-stars{
      grid-row:1!important;
      margin:0 0 16px!important;
      display:flex!important;
      justify-content:flex-start!important;
      gap:5px!important;
      color:var(--gold-light)!important;
    }
    .carousel-slide.testi-card .testi-stars .star{width:14px!important;height:14px!important;opacity:.92!important}
    .carousel-slide.testi-card blockquote{
      grid-row:2!important;
      max-width:720px!important;
      margin:0 0 20px!important;
      padding:0!important;
      border:0!important;
      font-family:'Cormorant Garamond',serif!important;
      font-size:clamp(1.48rem,2.6vw,2.08rem)!important;
      font-style:italic!important;
      font-weight:400!important;
      line-height:1.4!important;
      letter-spacing:.003em!important;
      color:var(--cream)!important;
    }
    .carousel-slide.testi-card figcaption{
      grid-row:3!important;
      display:flex!important;
      flex-direction:column!important;
      align-items:flex-start!important;
      min-height:0!important;
      margin:0!important;
      padding:0!important;
      text-align:left!important;
      border:0!important;
    }
    .carousel-slide.testi-card figcaption::before{display:none!important}
    .carousel-slide.testi-card .testi-name{font-size:.9rem!important;font-weight:500!important;letter-spacing:.04em!important;color:var(--cream)!important}
    .carousel-slide.testi-card .testi-role{margin-top:2px!important;font-size:.72rem!important;letter-spacing:.06em!important;color:var(--muted)!important}

    .carousel-nav{
      width:44px!important;
      height:44px!important;
      border:1px solid rgba(201,162,75,.42)!important;
      border-radius:50%!important;
      background:rgba(14,13,11,.74)!important;
      backdrop-filter:blur(8px);
      color:var(--gold-light)!important;
      transition:background .25s ease,border-color .25s ease,transform .25s ease!important;
      z-index:5!important;
    }
    .carousel-nav:hover{background:rgba(201,162,75,.12)!important;border-color:var(--gold)!important;transform:translateY(-50%) scale(1.04)!important}
    .carousel-prev{left:14px!important}
    .carousel-next{right:14px!important}
    .carousel-dots{margin-top:4px!important}
    .carousel-dots .c-dot{width:6px!important;height:6px!important;opacity:.42!important;transition:width .25s ease,opacity .25s ease,background .25s ease!important}
    .carousel-dots .c-dot.on{width:20px!important;border-radius:99px!important;opacity:1!important;background:var(--gold)!important}

    .dep-form-wrap{margin-top:30px}
    .testi-cta{margin-top:28px}

    @media(max-width:860px){
      .carousel-wrapper{min-height:290px}
      .carousel-wrapper::before,.carousel-wrapper::after{width:5%}
      .carousel-track{gap:18px}
      .carousel-slide{flex:0 0 92%}
      .carousel-slide.testi-card{min-height:260px!important;padding:30px 58px 30px 145px!important}
      .carousel-slide.testi-card::before{left:54px!important;top:38px!important;width:70px!important;height:70px!important;font-size:3.8rem!important}
      .carousel-slide.testi-card::after{right:40px!important;font-size:5.2rem!important}
      .carousel-prev{left:0!important}.carousel-next{right:0!important}
    }

    @media(max-width:560px){
      .testimonials .section-head{margin-bottom:24px}
      .testi-carousel{margin-bottom:24px}
      .carousel-wrapper{min-height:330px}
      .carousel-wrapper::before,.carousel-wrapper::after{display:none!important}
      .carousel-track{gap:12px;padding:6px 0}
      .carousel-slide{flex:0 0 100%}
      .carousel-slide.peek-left,.carousel-slide.peek-right{opacity:0}
      .carousel-slide.testi-card{min-height:320px!important;padding:94px 38px 32px!important;text-align:center!important}
      .carousel-slide.testi-card::before{left:50%!important;top:16px!important;transform:translateX(-50%)!important;width:62px!important;height:62px!important;font-size:3.4rem!important}
      .carousel-slide.testi-card::after{right:20px!important;bottom:8px!important;font-size:4.5rem!important}
      .carousel-slide.testi-card .testi-stars{justify-content:center!important;margin-bottom:14px!important}
      .carousel-slide.testi-card blockquote{text-align:center!important;font-size:clamp(1.28rem,6vw,1.6rem)!important;line-height:1.38!important;margin-bottom:20px!important}
      .carousel-slide.testi-card figcaption{align-items:center!important;text-align:center!important}
      .carousel-nav{width:38px!important;height:38px!important}
      .carousel-prev{left:0!important}.carousel-next{right:0!important}
      .carousel-dots{margin-top:10px!important}
    }

    @media(prefers-reduced-motion:reduce){
      .carousel-slide,.carousel-nav,.carousel-dots .c-dot{transition:none!important}
    }
  `;
  document.head.appendChild(style);
})();
