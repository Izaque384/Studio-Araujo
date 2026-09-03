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

// Header solid on scroll
const header = document.getElementById('siteHeader');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
});

// Mobile nav toggle
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');
burger.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

// Scroll reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('in-view');
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Bokeh: pontos de luz desfocados flutuando lentamente nos heros
document.querySelectorAll('.hero, .page-hero').forEach(hero => {
  for (let i = 0; i < 7; i++) {
    const dot = document.createElement('span');
    dot.className = 'bokeh-dot';
    const size = 8 + Math.random() * 20;
    dot.style.width = size + 'px';
    dot.style.height = size + 'px';
    dot.style.left = (4 + Math.random() * 92) + '%';
    dot.style.top = (18 + Math.random() * 72) + '%';
    dot.style.animationDuration = (9 + Math.random() * 8) + 's';
    dot.style.animationDelay = (Math.random() * 9) + 's';
    hero.appendChild(dot);
  }
});

// Spotlight: luz dourada que acompanha o mouse sobre os cards
document.querySelectorAll('.servico-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    card.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });
});

// Contador animado da faixa de anos de história
const statNums = document.querySelectorAll('.stat-num');
if (statNums.length) {
  const statReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (el.dataset.done) return;
      el.dataset.done = '1';
      const target = parseInt(el.dataset.target, 10);
      if (statReduced) { el.textContent = target; return; }
      const start = performance.now();
      const dur = 1800;
      const tick = (t) => {
        const p = Math.min((t - start) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  statNums.forEach(el => statObserver.observe(el));
}

// ===== VISUALIZADOR DE FOTOS (lightbox) =====
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImg');
const lbCat = document.getElementById('lbCat');
const lbCount = document.getElementById('lbCount');
const lbPrev = document.getElementById('lbPrev');
const lbNext = document.getElementById('lbNext');
const lbClose = document.getElementById('lbClose');

let lbPhotos = [], lbIndex = 0, lbLabel = '', lbOpener = null;
function lbRender() {
  lbImg.classList.remove('loaded');
  lbImg.src = lbPhotos[lbIndex];
  lbImg.alt = lbLabel + ' — foto ' + (lbIndex + 1) + ' de ' + lbPhotos.length;
  lbCat.textContent = lbLabel;
  lbCount.textContent = (lbIndex + 1) + ' / ' + lbPhotos.length;
  const sozinha = lbPhotos.length < 2;
  lbPrev.hidden = sozinha;
  lbNext.hidden = sozinha;
  [lbIndex + 1, lbIndex - 1].forEach((i) => {
    const j = (i + lbPhotos.length) % lbPhotos.length;
    new Image().src = lbPhotos[j];
  });
}
function lbOpen(fotos, indice, rotulo, origem) {
  if (!lightbox || !fotos || !fotos.length) return;
  lbPhotos = fotos;
  lbIndex = indice;
  lbLabel = rotulo;
  lbOpener = origem || null;
  lightbox.hidden = false;
  document.body.style.overflow = 'hidden';
  lbRender();
  requestAnimationFrame(() => lightbox.classList.add('open'));
  lbClose.focus();
}
function lbHide() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
  setTimeout(() => { lightbox.hidden = true; lbImg.removeAttribute('src'); }, 280);
  if (lbOpener) lbOpener.focus();
}
function lbGo(passo) {
  if (lbPhotos.length < 2) return;
  lbIndex = (lbIndex + passo + lbPhotos.length) % lbPhotos.length;
  lbRender();
}
if (lightbox) {
  lbImg.addEventListener('load', () => lbImg.classList.add('loaded'));
  lbNext.addEventListener('click', (e) => { e.stopPropagation(); lbGo(1); });
  lbPrev.addEventListener('click', (e) => { e.stopPropagation(); lbGo(-1); });
  lbClose.addEventListener('click', lbHide);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lbHide(); });
  document.addEventListener('keydown', (e) => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') lbHide();
    else if (e.key === 'ArrowRight') lbGo(1);
    else if (e.key === 'ArrowLeft') lbGo(-1);
  });
  let tX = 0, tY = 0;
  lightbox.addEventListener('touchstart', (e) => {
    tX = e.changedTouches[0].clientX; tY = e.changedTouches[0].clientY;
  }, { passive: true });
  lightbox.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - tX;
    const dy = e.changedTouches[0].clientY - tY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) lbGo(dx < 0 ? 1 : -1);
  }, { passive: true });
}

// ===== GALERIAS DOS SERVIÇOS (página Serviços) =====
// A partir de agora, as galerias podem vir do painel administrativo (Neon).
// Enquanto uma categoria ainda não tiver fotos no painel, o site mantém o
// comportamento antigo e usa automaticamente os arquivos locais em assets/.
const NEON_AUTH_URL_PUBLIC = 'https://ep-lucky-rice-axp36rxg.neonauth.c-4.us-east-2.aws.neon.tech/neondb/auth';
const NEON_DATA_API_URL_PUBLIC = 'https://ep-lucky-rice-axp36rxg.apirest.c-4.us-east-2.aws.neon.tech/neondb/rest/v1';
let neonPublicClientPromise = null;

async function neonPublicClient() {
  if (!neonPublicClientPromise) {
    neonPublicClientPromise = import('https://esm.sh/@neondatabase/neon-js@0.7.0-beta?bundle').then(({ createClient, BetterAuthVanillaAdapter }) =>
      createClient({
        auth: {
          adapter: BetterAuthVanillaAdapter(),
          url: NEON_AUTH_URL_PUBLIC,
          allowAnonymous: true
        },
        dataApi: { url: NEON_DATA_API_URL_PUBLIC }
      })
    );
  }
  return neonPublicClientPromise;
}

async function fotosDoPainel(categoria) {
  try {
    const neon = await neonPublicClient();
    const { data, error } = await neon
      .from('site_images')
      .select('public_url,alt_text,is_cover,sort_order')
      .eq('category', categoria)
      .eq('is_visible', true)
      .order('sort_order', { ascending: true });
    if (error || !Array.isArray(data)) return [];
    return data;
  } catch (e) {
    return [];
  }
}

function testarFoto(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

const CAPAS_DOS_SERVICOS = {
  casamento: 3,
  "ensaio-casal": 7,
  formatura: 4,
  gestante: 4,
  moda: 9
};
const FOTOS_IGNORADAS = new Set([
  "gestante-5",
  "casamento-6",
  "casamento-7",
  "ensaio-casal-9"
]);
function fotoIgnorada(prefixo, n) {
  return FOTOS_IGNORADAS.has(prefixo + "-" + n);
}
function capaDoServico(chave) {
  const n = CAPAS_DOS_SERVICOS[chave] || 1;
  return fotoIgnorada(chave, n) ? 1 : n;
}
async function procurarFotos(base, prefixo, maximo) {
  const achadas = [];
  let seguidasSemAchar = 0;
  for (let n = 1; n <= maximo; n++) {
    if (fotoIgnorada(prefixo, n)) continue;
    const src = await testarFoto(base + n + ".jpg");
    if (src) {
      achadas.push(src);
      seguidasSemAchar = 0;
    } else {
      seguidasSemAchar++;
      if (seguidasSemAchar >= 2) break;
    }
  }
  return achadas;
}
function aplicarCapaCard(btn, src) {
  const card = btn.closest('.servico-card');
  if (!card) return;
  let moldura = card.querySelector('.card-photo');
  if (!moldura) {
    moldura = document.createElement('div');
    moldura.className = 'card-photo';
    moldura.setAttribute('aria-hidden', 'true');
    const foto = document.createElement('img');
    foto.alt = '';
    foto.loading = 'lazy';
    foto.decoding = 'async';
    moldura.appendChild(foto);
    card.insertBefore(moldura, card.firstChild);
    card.classList.add('has-photo');
  }
  const img = moldura.querySelector('img');
  if (img) img.src = src;
}

document.querySelectorAll('.gallery-btn[data-gallery]').forEach((btn) => {
  const chave = btn.dataset.gallery;
  const base = 'assets/galeria/' + chave + '-';
  const rotulo = btn.dataset.label || '';
  (async () => {
    const remotas = await fotosDoPainel(chave);
    if (remotas.length) {
      const capaObj = remotas.find(f => f.is_cover) || remotas[0];
      const capa = capaObj.public_url;
      aplicarCapaCard(btn, capa);
      const ordenadas = [capa].concat(remotas.map(f => f.public_url).filter(url => url !== capa));
      const contador = btn.querySelector('.g-count');
      if (contador) contador.textContent = ordenadas.length;
      btn.hidden = false;
      requestAnimationFrame(() => btn.classList.add('pulsando'));
      btn.addEventListener('click', () => lbOpen(ordenadas, 0, rotulo, btn));
      return;
    }
    const capaN = capaDoServico(chave);
    const capa = await testarFoto(base + capaN + '.jpg');
    if (!capa) return;
    aplicarCapaCard(btn, capa);
    const fotos = await procurarFotos(base, chave, 20);
    if (!fotos.length) return;
    const contador = btn.querySelector('.g-count');
    if (contador) contador.textContent = fotos.length;
    btn.hidden = false;
    requestAnimationFrame(() => btn.classList.add('pulsando'));
    const ordenadas = [capa].concat(fotos.filter((f) => f !== capa));
    btn.addEventListener('click', () => lbOpen(ordenadas, 0, rotulo, btn));
  })();
});

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const PORTFOLIO_NEON = {
  casamentos: 'portfolio-casamentos',
  gestante: 'portfolio-gestante',
  formaturas: 'portfolio-formaturas',
  moda: 'portfolio-moda',
  aniversario: 'portfolio-aniversario',
  'foto-studio': 'portfolio-foto-studio'
};
document.querySelectorAll('.mosaic-item[data-slide-prefix]').forEach((item, idx) => {
  const prefix = item.dataset.slidePrefix;
  const baseImg = item.querySelector('img');
  const rotulo = (item.querySelector('.mosaic-label') || {}).textContent || '';
  const label = rotulo.trim();
  const nomePrefixo = prefix.split('/').pop();
  const categoriaRemota = PORTFOLIO_NEON[nomePrefixo];
  item.__fotos = [baseImg.getAttribute('src')];
  item.__cur = 0;
  item.classList.add('is-zoomable');
  item.setAttribute('role', 'button');
  item.setAttribute('tabindex', '0');
  item.setAttribute('aria-label', 'Ampliar fotos de ' + label);
  const abrir = () => lbOpen(item.__fotos, item.__cur, label, item);
  item.addEventListener('click', abrir);
  item.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); }
  });
  (async () => {
    let fotos = [];
    if (categoriaRemota) {
      const remotas = await fotosDoPainel(categoriaRemota);
      if (remotas.length) {
        const capaObj = remotas.find(f => f.is_cover) || remotas[0];
        baseImg.src = capaObj.public_url;
        baseImg.alt = capaObj.alt_text || label;
        fotos = remotas.map(f => f.public_url).filter(url => url !== capaObj.public_url);
        item.__fotos = [capaObj.public_url].concat(fotos);
      }
    }
    if (!fotos.length && item.__fotos.length === 1 && item.__fotos[0] === baseImg.getAttribute('src')) {
      const locais = await procurarFotos(prefix + '-', nomePrefixo, 15);
      if (!locais.length) return;
      fotos = locais;
      item.__fotos = [baseImg.getAttribute('src')].concat(locais);
    }
    if (!fotos.length) return;
    const slides = fotos.map(src => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.className = 'slide';
      item.insertBefore(img, item.querySelector('.mosaic-label'));
      return img;
    });
    const total = slides.length + 1;
    const dots = document.createElement('span');
    dots.className = 'slide-dots';
    const dotEls = [];
    for (let i = 0; i < total; i++) {
      const d = document.createElement('i');
      if (i === 0) d.className = 'on';
      dots.appendChild(d);
      dotEls.push(d);
    }
    item.appendChild(dots);
    let cur = 0;
    let paused = false;
    item.addEventListener('mouseenter', () => { paused = true; });
    item.addEventListener('mouseleave', () => { paused = false; });
    if (reducedMotion) return;
    setInterval(() => {
      if (paused) return;
      cur = (cur + 1) % total;
      item.__cur = cur;
      slides.forEach((slide, i) => slide.classList.toggle('active', i === cur - 1));
      dotEls.forEach((dot, i) => dot.classList.toggle('on', i === cur));
    }, 5500 + idx * 450);
  })();
});
