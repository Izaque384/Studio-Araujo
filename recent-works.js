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
      neon.from('recent_works').select('id,gallery_category,title,description,work_date,location,sort_order').eq('is_active', true).order('sort_order', { ascending: true }).order('work_date', { ascending: false }).limit(3),
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
      if (stats?.parentNode) stats.parentNode.insertBefore(section, stats); else portfolio.insertAdjacentElement('afterend', section);
    }

    const cards = validos.map((t, i) => {
      const data = formatarData(t.work_date);
      const meta = [data, t.location].filter(Boolean).map((txt, idx) => `<span class="recent-work-meta-item">${idx === 0 ? '◷' : '⌖'} ${escHtml(txt)}</span>`).join('');
      return `<article class="recent-work-card" data-recent-index="${i}"><button type="button" class="recent-work-photo" aria-label="Ver trabalho: ${escHtml(t.title)}"><img src="${escHtml(t.capa.url)}" alt="${escHtml(t.capa.alt || t.title)}" loading="lazy" decoding="async"><span class="recent-work-tag">${escHtml(t.label.replace(/^Portfólio\s*[—-]\s*/i, ''))}</span></button><div class="recent-work-body"><h3>${escHtml(t.title)}</h3><p>${escHtml(t.description || '')}</p>${meta ? `<div class="recent-work-meta">${meta}</div>` : ''}<button type="button" class="recent-work-link">Ver trabalho <span aria-hidden="true">→</span></button></div></article>`;
    }).join('');

    section.innerHTML = `<div class="wrap"><div class="recent-works-head"><div class="recent-works-eyebrow"><span></span>Trabalhos recentes<span></span></div><h2>Histórias reais, registradas <em>recentemente</em></h2><p>Uma seleção de trabalhos para mostrar de perto a sensibilidade, o cuidado e o estilo do Studio Araújo.</p></div><div class="recent-works-grid">${cards}</div><div class="recent-works-cta"><a class="btn btn-outline" href="#portfolio">Ver portfólio completo</a></div></div>`;
    section.querySelectorAll('.recent-work-card').forEach((card, i) => {
      const abrir = () => lbOpen(validos[i].itens, 0, validos[i].title, card.querySelector('.recent-work-photo'));
      card.querySelector('.recent-work-photo')?.addEventListener('click', abrir);
      card.querySelector('.recent-work-link')?.addEventListener('click', abrir);
    });

    if (!document.getElementById('recentWorksLiveStyle')) {
      const style = document.createElement('style');
      style.id = 'recentWorksLiveStyle';
      style.textContent = `.recent-work-meta{display:flex;gap:16px;flex-wrap:wrap;margin-top:15px;color:var(--muted);font-size:.75rem}.recent-work-meta-item{display:inline-flex;align-items:center;gap:5px}`;
      document.head.appendChild(style);
    }
  } catch (err) {
    console.warn('Trabalhos recentes: usando fallback estático.', err);
  }
})();

// =====================================================================
// DEPOIMENTOS — acabamento visual fiel à direção editorial escolhida.
// =====================================================================
(function lapidarDepoimentos() {
  const track = document.getElementById('testiTrack');
  if (!track) return;

  if (!document.getElementById('testimonialsEditorialStyle')) {
    const style = document.createElement('style');
    style.id = 'testimonialsEditorialStyle';
    style.textContent = `
      .testimonials.alt,.testimonials{background:#0e0d0b!important;background-image:none!important}
      .testimonials .section-head{display:flex!important;flex-direction:column!important;align-items:center!important;max-width:780px!important;margin:0 auto 34px!important;text-align:center!important}
      .testimonials .section-head .eyebrow{width:100%!important;justify-content:center!important;text-align:center!important;margin-left:0!important;margin-right:0!important}
      .testimonials .section-head h2,.testimonials .section-head .section-sub{width:100%!important;text-align:center!important;margin-left:auto!important;margin-right:auto!important}
      .testimonials .section-sub{max-width:640px!important}

      .testi-carousel{max-width:1080px!important;margin:0 auto 34px!important;background:transparent!important}
      .testi-carousel::after{display:none!important}
      .carousel-wrapper{max-width:1000px!important;min-height:300px!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;overflow:hidden!important}
      .carousel-wrapper::before,.carousel-wrapper::after{display:none!important}
      .carousel-track{gap:28px!important;padding:10px 0!important;align-items:center!important}
      .carousel-slide{flex:0 0 86%!important;opacity:0!important;transform:scale(.99)!important;pointer-events:none!important;transition:opacity .42s ease,transform .42s ease!important}
      .carousel-slide.active{opacity:1!important;transform:scale(1)!important;pointer-events:auto!important}
      .carousel-slide.peek-left,.carousel-slide.peek-right{opacity:.04!important}

      .carousel-slide.testi-card{position:relative!important;min-height:270px!important;margin:0!important;padding:34px 70px 34px 180px!important;display:grid!important;grid-template-columns:1fr!important;grid-template-rows:auto auto auto!important;align-content:center!important;text-align:left!important;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;overflow:visible!important}
      .carousel-slide.testi-card:hover{transform:none!important;box-shadow:none!important;border-color:transparent!important}
      .carousel-slide.testi-card::before{display:none!important}
      .carousel-slide.testi-card::after{content:'”'!important;position:absolute!important;right:52px!important;bottom:12px!important;top:auto!important;left:auto!important;width:auto!important;height:auto!important;background:none!important;color:rgba(201,162,75,.18)!important;font-family:'Cormorant Garamond',serif!important;font-size:5.6rem!important;line-height:1!important;opacity:1!important}

      .carousel-slide.testi-card > .testi-avatar{position:absolute!important;left:76px!important;top:52px!important;width:78px!important;height:78px!important;border-radius:50%!important;overflow:hidden!important;border:1px solid rgba(201,162,75,.35)!important;background:#15130f!important;display:grid!important;place-items:center!important;color:var(--gold-light)!important;font-family:'Cormorant Garamond',serif!important;font-size:1.25rem!important;font-weight:600!important;letter-spacing:.04em!important;box-shadow:none!important}
      .carousel-slide.testi-card > .testi-avatar img{width:100%!important;height:100%!important;object-fit:cover!important}
      .carousel-slide.testi-card .testi-stars{grid-row:1!important;margin:0 0 14px!important;display:flex!important;justify-content:flex-start!important;gap:5px!important;color:var(--gold-light)!important}
      .carousel-slide.testi-card .testi-stars .star{width:13px!important;height:13px!important;opacity:.9!important}
      .carousel-slide.testi-card blockquote{grid-row:2!important;max-width:720px!important;margin:0 0 22px!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important;font-family:'Cormorant Garamond',serif!important;font-size:clamp(1.45rem,2.45vw,2rem)!important;font-style:italic!important;font-weight:400!important;line-height:1.42!important;color:var(--cream)!important}
      .carousel-slide.testi-card figcaption{grid-row:3!important;display:flex!important;flex-direction:column!important;align-items:flex-start!important;min-height:0!important;margin:0!important;padding:0!important;text-align:left!important;border:0!important;background:transparent!important}
      .carousel-slide.testi-card figcaption::before{display:none!important}
      .carousel-slide.testi-card figcaption .testi-avatar{display:none!important}
      .carousel-slide.testi-card .testi-name{font-size:.9rem!important;font-weight:500!important;letter-spacing:.04em!important;color:var(--cream)!important}
      .carousel-slide.testi-card .testi-role{margin-top:2px!important;font-size:.72rem!important;letter-spacing:.05em!important;color:var(--muted)!important}

      .carousel-nav{width:42px!important;height:42px!important;border:1px solid rgba(201,162,75,.35)!important;border-radius:50%!important;background:rgba(14,13,11,.82)!important;color:var(--gold-light)!important;backdrop-filter:blur(6px)!important;z-index:5!important}
      .carousel-prev{left:10px!important}.carousel-next{right:10px!important}
      .carousel-dots{margin-top:4px!important}.carousel-dots .c-dot{width:6px!important;height:6px!important;opacity:.38!important}.carousel-dots .c-dot.on{width:18px!important;border-radius:99px!important;opacity:1!important;background:var(--gold)!important}

      @media(max-width:860px){
        .carousel-slide{flex-basis:94%!important}
        .carousel-slide.testi-card{padding:32px 54px 32px 145px!important}
        .carousel-slide.testi-card > .testi-avatar{left:48px!important;top:52px!important;width:70px!important;height:70px!important}
      }
      @media(max-width:560px){
        .testimonials .section-head{margin-bottom:26px!important}
        .carousel-wrapper{min-height:350px!important}
        .carousel-slide{flex-basis:100%!important}
        .carousel-slide.testi-card{min-height:330px!important;padding:112px 34px 34px!important;text-align:center!important}
        .carousel-slide.testi-card > .testi-avatar{left:50%!important;top:20px!important;transform:translateX(-50%)!important;width:72px!important;height:72px!important}
        .carousel-slide.testi-card .testi-stars{justify-content:center!important}
        .carousel-slide.testi-card blockquote{text-align:center!important;font-size:clamp(1.28rem,6vw,1.58rem)!important}
        .carousel-slide.testi-card figcaption{align-items:center!important;text-align:center!important}
        .carousel-slide.testi-card::after{right:18px!important;bottom:8px!important;font-size:4.3rem!important}
      }
    `;
    document.head.appendChild(style);
  }

  const organizarCards = () => {
    track.querySelectorAll('.testi-card').forEach(card => {
      const caption = card.querySelector('figcaption');
      const avatar = caption?.querySelector('.testi-avatar');
      if (avatar && avatar.parentElement === caption) card.insertBefore(avatar, card.firstChild);
    });
    requestAnimationFrame(() => {
      try { if (typeof posicionarTrack === 'function') posicionarTrack(); } catch (_) {}
    });
  };

  organizarCards();
  new MutationObserver(organizarCards).observe(track, { childList:true, subtree:true });
})();
