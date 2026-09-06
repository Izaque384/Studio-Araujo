document.getElementById('year').textContent = new Date().getFullYear();

// Efeito de foco gradual nos títulos: divide as frases em palavras,
// que surgem uma a uma, saindo do desfoque (como uma lente focando).
function splitWords(el) {
  let wi = 0;
  const walk = (node) => {
    Array.from(node.childNodes).forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
          } else {
            const span = document.createElement('span');
            span.className = 'word';
            span.style.setProperty('--wi', wi++);
            span.textContent = part;
            frag.appendChild(span);
          }
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    });
  };
  walk(el);
  el.classList.add('split-words');
}
document.querySelectorAll('.hero h1, .page-hero h1').forEach(splitWords);

const header = document.getElementById('siteHeader');
window.addEventListener('scroll', () => { header.classList.toggle('scrolled', window.scrollY > 40); });
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');
burger.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('in-view'); }); }, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

document.querySelectorAll('.hero, .page-hero').forEach(hero => {
  for (let i = 0; i < 7; i++) {
    const dot = document.createElement('span'); dot.className = 'bokeh-dot';
    const size = 8 + Math.random() * 20; dot.style.width = size + 'px'; dot.style.height = size + 'px';
    dot.style.left = (4 + Math.random() * 92) + '%'; dot.style.top = (18 + Math.random() * 72) + '%';
    dot.style.animationDuration = (9 + Math.random() * 8) + 's'; dot.style.animationDelay = (Math.random() * 9) + 's'; hero.appendChild(dot);
  }
});

document.querySelectorAll('.servico-card').forEach(card => { card.addEventListener('mousemove', (e) => { const r = card.getBoundingClientRect(); card.style.setProperty('--mx', (e.clientX - r.left) + 'px'); card.style.setProperty('--my', (e.clientY - r.top) + 'px'); }); });

const statNums = document.querySelectorAll('.stat-num');
if (statNums.length) {
  const statReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const statObserver = new IntersectionObserver((entries) => { entries.forEach(entry => { if (!entry.isIntersecting) return; const el = entry.target; if (el.dataset.done) return; el.dataset.done = '1'; const target = parseInt(el.dataset.target, 10); if (statReduced) { el.textContent = target; return; } const start = performance.now(); const dur = 1800; const tick = (t) => { const p = Math.min((t - start) / dur, 1); el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); }); }, { threshold: 0.6 });
  statNums.forEach(el => statObserver.observe(el));
}

// ===== VISUALIZADOR DE FOTOS E VÍDEOS =====
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImg');
const lbCat = document.getElementById('lbCat');
const lbCount = document.getElementById('lbCount');
const lbPrev = document.getElementById('lbPrev');
const lbNext = document.getElementById('lbNext');
const lbClose = document.getElementById('lbClose');
let lbMedia = [], lbIndex = 0, lbLabel = '', lbOpener = null, lbVideo = null;
function mediaItem(url, type = 'image', alt = '', isCover = false) { return { url, type, alt, is_cover: isCover }; }
function isVideo(item) { return item?.type === 'video' || String(item?.mime_type || '').startsWith('video/'); }
function normalizeMedia(item) { if (typeof item === 'string') return mediaItem(item, 'image'); return mediaItem(item.public_url || item.url, isVideo(item) ? 'video' : 'image', item.alt_text || item.alt || '', !!item.is_cover); }
function ensureLbVideo() { if (lbVideo || !lbImg) return lbVideo; lbVideo = document.createElement('video'); lbVideo.id = 'lbVideo'; lbVideo.className = lbImg.className || ''; lbVideo.controls = true; lbVideo.playsInline = true; lbVideo.preload = 'metadata'; lbVideo.hidden = true; lbImg.parentNode.insertBefore(lbVideo, lbImg.nextSibling); return lbVideo; }
function lbRender() {
  const item = normalizeMedia(lbMedia[lbIndex]); const video = ensureLbVideo();
  if (isVideo(item)) { lbImg.hidden = true; lbImg.removeAttribute('src'); video.hidden = false; video.src = item.url; video.setAttribute('aria-label', item.alt || `${lbLabel} — vídeo ${lbIndex + 1}`); }
  else { if (video) { video.pause(); video.hidden = true; video.removeAttribute('src'); video.load(); } lbImg.hidden = false; lbImg.classList.remove('loaded'); lbImg.src = item.url; lbImg.alt = item.alt || `${lbLabel} — foto ${lbIndex + 1} de ${lbMedia.length}`; }
  lbCat.textContent = lbLabel; lbCount.textContent = `${lbIndex + 1} / ${lbMedia.length}`; const sozinha = lbMedia.length < 2; lbPrev.hidden = sozinha; lbNext.hidden = sozinha;
  [lbIndex + 1, lbIndex - 1].forEach((i) => { const j = (i + lbMedia.length) % lbMedia.length; const vizinho = normalizeMedia(lbMedia[j]); if (!isVideo(vizinho)) new Image().src = vizinho.url; });
}
function lbOpen(itens, indice, rotulo, origem) { if (!lightbox || !itens || !itens.length) return; lbMedia = itens.map(normalizeMedia); lbIndex = Math.max(0, Math.min(indice || 0, lbMedia.length - 1)); lbLabel = rotulo; lbOpener = origem || null; lightbox.hidden = false; document.body.style.overflow = 'hidden'; lbRender(); requestAnimationFrame(() => lightbox.classList.add('open')); lbClose.focus(); }
function lbHide() { lightbox.classList.remove('open'); document.body.style.overflow = ''; if (lbVideo) { lbVideo.pause(); lbVideo.removeAttribute('src'); lbVideo.load(); } setTimeout(() => { lightbox.hidden = true; lbImg.removeAttribute('src'); }, 280); if (lbOpener) lbOpener.focus(); }
function lbGo(passo) { if (lbMedia.length < 2) return; lbIndex = (lbIndex + passo + lbMedia.length) % lbMedia.length; lbRender(); }
if (lightbox) {
  lbImg.addEventListener('load', () => lbImg.classList.add('loaded')); lbNext.addEventListener('click', (e) => { e.stopPropagation(); lbGo(1); }); lbPrev.addEventListener('click', (e) => { e.stopPropagation(); lbGo(-1); }); lbClose.addEventListener('click', lbHide); lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lbHide(); });
  document.addEventListener('keydown', (e) => { if (lightbox.hidden) return; if (e.key === 'Escape') lbHide(); else if (e.key === 'ArrowRight') lbGo(1); else if (e.key === 'ArrowLeft') lbGo(-1); });
  let tX = 0, tY = 0; lightbox.addEventListener('touchstart', (e) => { tX = e.changedTouches[0].clientX; tY = e.changedTouches[0].clientY; }, { passive: true }); lightbox.addEventListener('touchend', (e) => { const dx = e.changedTouches[0].clientX - tX, dy = e.changedTouches[0].clientY - tY; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) lbGo(dx < 0 ? 1 : -1); }, { passive: true });
}

// ===== MÍDIA GERENCIADA PELO PAINEL =====
const NEON_AUTH_URL_PUBLIC = 'https://ep-lucky-rice-axp36rxg.neonauth.c-4.us-east-2.aws.neon.tech/neondb/auth';
const NEON_DATA_API_URL_PUBLIC = 'https://ep-lucky-rice-axp36rxg.apirest.c-4.us-east-2.aws.neon.tech/neondb/rest/v1';
let neonPublicClientPromise = null;
async function neonPublicClient() { if (!neonPublicClientPromise) neonPublicClientPromise = import('https://esm.sh/@neondatabase/neon-js@0.7.0-beta?bundle').then(({ createClient, BetterAuthVanillaAdapter }) => createClient({ auth: { adapter: BetterAuthVanillaAdapter(), url: NEON_AUTH_URL_PUBLIC, allowAnonymous: true }, dataApi: { url: NEON_DATA_API_URL_PUBLIC } })); return neonPublicClientPromise; }
async function midiasDoPainel(categoria) { try { const neon = await neonPublicClient(); const { data, error } = await neon.from('site_images').select('public_url,alt_text,is_cover,sort_order,mime_type').eq('category', categoria).eq('is_visible', true).order('sort_order', { ascending: true }); if (error || !Array.isArray(data)) return { ok: false, items: [] }; return { ok: true, items: data.map(normalizeMedia) }; } catch (_) { return { ok: false, items: [] }; } }
function testarFoto(src) { return new Promise((resolve) => { const img = new Image(); img.onload = () => resolve(src); img.onerror = () => resolve(null); img.src = src; }); }
const CAPAS_DOS_SERVICOS = { casamento: 3, 'ensaio-casal': 7, formatura: 4, gestante: 4, moda: 9 };
const FOTOS_IGNORADAS = new Set(['gestante-5','casamento-6','casamento-7','ensaio-casal-9']);
function fotoIgnorada(prefixo, n) { return FOTOS_IGNORADAS.has(prefixo + '-' + n); }
function capaDoServico(chave) { const n = CAPAS_DOS_SERVICOS[chave] || 1; return fotoIgnorada(chave, n) ? 1 : n; }
async function procurarFotos(base, prefixo, maximo) { const achadas = []; let seguidasSemAchar = 0; for (let n = 1; n <= maximo; n++) { if (fotoIgnorada(prefixo, n)) continue; const src = await testarFoto(base + n + '.jpg'); if (src) { achadas.push(src); seguidasSemAchar = 0; } else if (++seguidasSemAchar >= 2) break; } return achadas; }
function aplicarCapaCard(btn, src) { if (!src) return; const card = btn.closest('.servico-card'); if (!card) return; let moldura = card.querySelector('.card-photo'); if (!moldura) { moldura = document.createElement('div'); moldura.className = 'card-photo'; moldura.setAttribute('aria-hidden', 'true'); const foto = document.createElement('img'); foto.alt = ''; foto.loading = 'lazy'; foto.decoding = 'async'; moldura.appendChild(foto); card.insertBefore(moldura, card.firstChild); card.classList.add('has-photo'); } const img = moldura.querySelector('img'); if (img) img.src = src; }

document.querySelectorAll('.gallery-btn[data-gallery]').forEach((btn) => {
  const chave = btn.dataset.gallery, base = 'assets/galeria/' + chave + '-', rotulo = btn.dataset.label || '';
  (async () => { const remoto = await midiasDoPainel(chave); let itens = remoto.items; if (!remoto.ok) { const capaN = capaDoServico(chave), capa = await testarFoto(base + capaN + '.jpg'); const fotos = await procurarFotos(base, chave, 20); itens = fotos.map(src => mediaItem(src, 'image')); if (capa && !itens.some(i => i.url === capa)) itens.unshift(mediaItem(capa, 'image')); } if (!itens.length) return; const capa = itens.find(i => !isVideo(i) && i.is_cover)?.url || itens.find(i => !isVideo(i))?.url; aplicarCapaCard(btn, capa); const contador = btn.querySelector('.g-count'); if (contador) contador.textContent = itens.length; btn.hidden = false; requestAnimationFrame(() => btn.classList.add('pulsando')); btn.addEventListener('click', () => lbOpen(itens, 0, rotulo, btn)); })();
});

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const PORTFOLIO_NEON = { casamentos:'portfolio-casamentos', gestante:'portfolio-gestante', formaturas:'portfolio-formaturas', moda:'portfolio-moda', aniversario:'portfolio-aniversario', 'foto-studio':'portfolio-foto-studio' };
document.querySelectorAll('.mosaic-item[data-slide-prefix]').forEach((item, idx) => {
  const prefix = item.dataset.slidePrefix, baseImg = item.querySelector('img'); const label = ((item.querySelector('.mosaic-label') || {}).textContent || '').trim(); const nomePrefixo = prefix.split('/').pop(), categoriaRemota = PORTFOLIO_NEON[nomePrefixo]; item.__media = [mediaItem(baseImg.getAttribute('src'),'image',baseImg.alt || label)]; item.__cur = 0; item.classList.add('is-zoomable'); item.setAttribute('role','button'); item.setAttribute('tabindex','0'); item.setAttribute('aria-label','Ampliar fotos de '+label); const abrir = () => lbOpen(item.__media, item.__cur, label, item); item.addEventListener('click', abrir); item.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' ') { e.preventDefault(); abrir(); } });
  (async () => { let remoto = categoriaRemota ? await midiasDoPainel(categoriaRemota) : {ok:false,items:[]}; let itens = remoto.items; if (!remoto.ok) { const locais = await procurarFotos(prefix + '-', nomePrefixo, 15); itens = [mediaItem(baseImg.getAttribute('src'),'image',baseImg.alt || label), ...locais.map(src=>mediaItem(src,'image'))]; } if (!itens.length) return; const capa = itens.find(i => !isVideo(i) && i.is_cover) || itens.find(i => !isVideo(i)); if (capa) { baseImg.src = capa.url; baseImg.alt = capa.alt || label; } item.__media = itens; const extras = itens.filter(i => !capa || i.url !== capa.url); const slides = extras.filter(i => !isVideo(i)).map(m => { const img=document.createElement('img'); img.src=m.url; img.alt=''; img.loading='lazy'; img.decoding='async'; img.className='slide'; item.insertBefore(img,item.querySelector('.mosaic-label')); return img; }); if (!slides.length) return; const total=slides.length+1, dots=document.createElement('span'); dots.className='slide-dots'; const dotEls=[]; for(let i=0;i<total;i++){const d=document.createElement('i'); if(i===0)d.className='on'; dots.appendChild(d); dotEls.push(d);} item.appendChild(dots); let cur=0,paused=false; item.addEventListener('mouseenter',()=>paused=true); item.addEventListener('mouseleave',()=>paused=false); if(reducedMotion)return; setInterval(()=>{ if(paused)return; cur=(cur+1)%total; slides.forEach((s,i)=>s.classList.toggle('active',i===cur-1)); dotEls.forEach((d,i)=>d.classList.toggle('on',i===cur)); },5500+idx*450); })();
});

// ===== CTA FINAL — direção emocional e imersiva =====
(function aprimorarCtaFinal(){
  const paineis = document.querySelectorAll('.cta-panel');
  if (!paineis.length) return;

  if (!document.getElementById('ctaFinalImersivoStyle')) {
    const style = document.createElement('style');
    style.id = 'ctaFinalImersivoStyle';
    style.textContent = `
      .cta-band{padding:72px 0 126px!important}
      .cta-band>.wrap{max-width:1260px!important}
      .cta-panel{position:relative!important;min-height:410px!important;padding:72px 64px!important;display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:flex-start!important;text-align:left!important;border:1px solid rgba(201,162,75,.22)!important;border-radius:20px!important;overflow:hidden!important;background:#0e0d0b!important;box-shadow:0 30px 80px rgba(0,0,0,.28)!important}
      .cta-panel::before{content:''!important;position:absolute!important;top:0!important;right:0!important;bottom:0!important;left:34%!important;background-image:url('assets/cta-final-hq.webp')!important;background-repeat:no-repeat!important;background-position:right center!important;background-size:auto 155%!important;animation:none!important;transform:none!important;transition:none!important;filter:none!important;opacity:1!important;-webkit-mask-image:linear-gradient(90deg,transparent 0%,rgba(0,0,0,.03) 8%,rgba(0,0,0,.12) 18%,rgba(0,0,0,.32) 30%,rgba(0,0,0,.62) 44%,rgba(0,0,0,.86) 58%,#000 72%,#000 100%)!important;mask-image:linear-gradient(90deg,transparent 0%,rgba(0,0,0,.03) 8%,rgba(0,0,0,.12) 18%,rgba(0,0,0,.32) 30%,rgba(0,0,0,.62) 44%,rgba(0,0,0,.86) 58%,#000 72%,#000 100%)!important;pointer-events:none!important;z-index:0!important}
      .cta-panel::after{content:''!important;display:block!important;position:absolute!important;inset:0!important;background:linear-gradient(90deg,#0e0d0b 0%,#0e0d0b 28%,rgba(14,13,11,.98) 36%,rgba(14,13,11,.90) 44%,rgba(14,13,11,.72) 52%,rgba(14,13,11,.46) 60%,rgba(14,13,11,.20) 68%,rgba(14,13,11,.06) 76%,rgba(14,13,11,0) 84%)!important;animation:none!important;transform:none!important;transition:none!important;pointer-events:none!important;z-index:1!important}
      .cta-panel>.eyebrow,.cta-panel>h2,.cta-panel>p,.cta-panel>.cta-actions{position:relative!important;z-index:2!important}
      .cta-panel .eyebrow{justify-content:flex-start!important;margin:0 0 18px!important;font-size:.72rem!important;letter-spacing:.24em!important;color:var(--gold-light)!important}
      .cta-panel .eyebrow .aperture{width:27px!important;height:27px!important}
      .cta-panel h2{max-width:520px!important;margin:0 0 14px!important;font-size:clamp(2.2rem,4.1vw,3.45rem)!important;line-height:1.02!important;color:var(--cream)!important}
      .cta-panel h2 em{font-style:italic!important;color:var(--gold-light)!important}
      .cta-panel p{max-width:490px!important;margin:0 0 30px!important;color:rgba(243,236,220,.7)!important;font-size:.95rem!important;line-height:1.65!important}
      .cta-panel .cta-actions{justify-content:flex-start!important;gap:16px!important}
      .cta-panel .cta-actions .btn-solid{padding:15px 26px!important}
      .cta-panel .cta-actions .btn-outline{border-color:rgba(243,236,220,.18)!important;background:rgba(14,13,11,.28)!important;backdrop-filter:blur(4px)!important}
      .cta-panel .cta-actions .btn-outline:hover{border-color:var(--gold)!important;background:rgba(14,13,11,.52)!important}
      @media(max-width:820px){
        .cta-band{padding:54px 0 92px!important}
        .cta-panel{min-height:500px!important;padding:54px 38px!important;justify-content:flex-end!important}
        .cta-panel::before{left:0!important;background-position:68% 46%!important;background-size:auto 120%!important;-webkit-mask-image:none!important;mask-image:none!important;animation:none!important;transform:none!important}
        .cta-panel::after{background:linear-gradient(180deg,rgba(14,13,11,.12) 0%,rgba(14,13,11,.05) 24%,rgba(14,13,11,.30) 48%,rgba(14,13,11,.72) 68%,rgba(14,13,11,.96) 100%)!important}
        .cta-panel h2{max-width:560px!important}
        .cta-panel p{max-width:520px!important}
      }
      @media(max-width:560px){
        .cta-panel{min-height:540px!important;padding:42px 24px!important;border-radius:16px!important}
        .cta-panel::before{left:0!important;background-position:58% 36%!important;background-size:auto 105%!important;animation:none!important;transform:none!important}
        .cta-panel::after{background:linear-gradient(180deg,rgba(14,13,11,.14) 0%,rgba(14,13,11,.06) 22%,rgba(14,13,11,.36) 48%,rgba(14,13,11,.78) 68%,rgba(14,13,11,.97) 100%)!important}
        .cta-panel .eyebrow{font-size:.63rem!important;letter-spacing:.2em!important}
        .cta-panel h2{font-size:clamp(2rem,10vw,2.7rem)!important}
        .cta-panel .cta-actions{width:100%!important;flex-direction:column!important;align-items:stretch!important}
        .cta-panel .cta-actions .btn{justify-content:center!important;width:100%!important}
      }
    `;
    document.head.appendChild(style);
  }

  paineis.forEach(panel => {
    const eyebrow = panel.querySelector('.eyebrow');
    if (eyebrow) {
      const texto = Array.from(eyebrow.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
      if (texto) texto.textContent = ' Seus momentos merecem ser eternos';
    }
    const titulo = panel.querySelector('h2');
    if (titulo) titulo.innerHTML = 'Vamos registrar o seu <em>momento</em>?';
    const apoio = panel.querySelector('p');
    if (apoio) apoio.textContent = 'Conte um pouco sobre o que você está planejando e vamos conversar.';
  });
})();