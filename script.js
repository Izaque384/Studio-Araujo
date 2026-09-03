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
// Abre a foto em tela cheia para o visitante ver com calma e passar
// manualmente pelas fotos daquela categoria (setas, teclado ou deslizar).
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
  // Deixa as fotos vizinhas prontas, para a troca ser instantânea
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
  // clicar no fundo (fora da foto) fecha
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lbHide(); });

  document.addEventListener('keydown', (e) => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') lbHide();
    else if (e.key === 'ArrowRight') lbGo(1);
    else if (e.key === 'ArrowLeft') lbGo(-1);
  });

  // deslizar o dedo no celular
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
// Cada card pode ter uma amostra de fotos daquele serviço. O site procura
// sozinho os arquivos em assets/galeria/<serviço>-1.jpg, -2.jpg, ...
// Se a pasta ainda não tiver fotos daquele serviço, o botão simplesmente
// não aparece — nada quebra e nada precisa ser configurado à mão.
function testarFoto(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// ===== CONFIGURAÇÃO DAS GALERIAS =====
// CAPAS_DOS_SERVICOS diz QUAL foto da galeria é a capa do card daquele
// serviço. Por padrão é a -1.jpg; troque só onde o enquadramento não
// ficou bom (rosto cortado, etc.).
// ⚠ Este mesmo objeto existe em agenda.js (miniatura do agendamento).
//   Alterou aqui, altere lá — assim as duas páginas mostram a mesma foto.
const CAPAS_DOS_SERVICOS = {
  casamento: 3,        // única em paisagem da pasta: cabe quase inteira na capa,
                       // com os dois rostos em close e nada cortado
  "ensaio-casal": 7,   // casal centralizado, os dois rostos inteiros no recorte
  formatura: 4,        // única em que beca, capelo, canudo E rosto sobrevivem
                       // juntos ao recorte largo do card
  gestante: 4,         // rosto inteiro e centralizado; nas outras a faixa
                       // visível pega só do pescoço para baixo
  moda: 9              // rosto inteiro e a peça de roupa bem legível — nas de
                       // passarela o recorte corta a cabeça ou a modelo fica
                       // pequena demais no meio do público
};

// Fotos que NÃO devem entrar em nenhuma galeria (marca d'água, @ de
// cliente, enquadramento ruim). Formato: "prefixo-numero".
const FOTOS_IGNORADAS = new Set([
  "gestante-5",      // @katarinasoaresl gravado no meio da foto
  "casamento-6",     // @caiovasconcelos_zootecnista e @suyaneepereiraa_
  "casamento-7",     // @suyaneepereiraa_ e @caiovasconcelos_zootecnista
  "ensaio-casal-9"   // @llaryssaaraujo
]);

function fotoIgnorada(prefixo, n) {
  return FOTOS_IGNORADAS.has(prefixo + "-" + n);
}

// Trava de segurança: se algum dia a capa configurada apontar para uma foto
// que está na lista de ignoradas, o site volta para a -1.jpg em vez de exibir
// justamente a imagem que deveria ficar de fora.
function capaDoServico(chave) {
  const n = CAPAS_DOS_SERVICOS[chave] || 1;
  return fotoIgnorada(chave, n) ? 1 : n;
}

// Procura as fotos numeradas de um prefixo, UMA DE CADA VEZ, e para
// assim que encontra buracos seguidos. Antes o site disparava 20 buscas
// por categoria de uma vez — com 16 categorias na página de Serviços
// isso dava mais de 300 requisições simultâneas, quase todas erro 404,
// e a fila do navegador travava o carregamento dos cards.
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
      // Dois números vazios em sequência: a numeração acabou.
      if (seguidasSemAchar >= 2) break;
    }
  }
  return achadas;
}

document.querySelectorAll('.gallery-btn[data-gallery]').forEach((btn) => {
  const chave = btn.dataset.gallery;
  const base = 'assets/galeria/' + chave + '-';
  const rotulo = btn.dataset.label || '';
  const capaN = capaDoServico(chave);

  // Primeiro só a foto de capa: o card ganha imagem quase de imediato,
  // sem esperar o restante da galeria ser vasculhado.
  testarFoto(base + capaN + '.jpg').then((capa) => {
    if (!capa) return;

    const card = btn.closest('.servico-card');
    if (card && !card.querySelector('.card-photo')) {
      const molduraCapa = document.createElement('div');
      molduraCapa.className = 'card-photo';
      molduraCapa.setAttribute('aria-hidden', 'true');
      const foto = document.createElement('img');
      foto.src = capa;
      foto.alt = '';
      foto.loading = 'lazy';
      foto.decoding = 'async';
      molduraCapa.appendChild(foto);
      card.insertBefore(molduraCapa, card.firstChild);
      card.classList.add('has-photo');
    }

    // Só então procura o resto, uma foto por vez, parando nos buracos.
    procurarFotos(base, chave, 20).then((fotos) => {
      if (!fotos.length) return;
      const contador = btn.querySelector('.g-count');
      if (contador) contador.textContent = fotos.length;
      btn.hidden = false;
      requestAnimationFrame(() => btn.classList.add('pulsando'));
      // A capa abre primeiro no visualizador
      const ordenadas = [capa].concat(fotos.filter((f) => f !== capa));
      btn.addEventListener('click', () => lbOpen(ordenadas, 0, rotulo, btn));
    });
  });
});
// O site procura sozinho as fotos numeradas de cada categoria (prefixo-1.jpg
// até prefixo-15.jpg). Basta salvar a foto com o nome certo na pasta e ela
// entra no slide automaticamente. Números podem ter buracos (ex.: 1, 2 e 5).
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.querySelectorAll('.mosaic-item[data-slide-prefix]').forEach((item, idx) => {
  const prefix = item.dataset.slidePrefix;
  const baseImg = item.querySelector('img');
  const rotulo = (item.querySelector('.mosaic-label') || {}).textContent || '';
  const label = rotulo.trim();

  // A foto de capa já vale como primeira foto do visualizador
  item.__fotos = [baseImg.getAttribute('src')];
  item.__cur = 0;

  // O bloco vira clicável (mouse e teclado) desde o início
  item.classList.add('is-zoomable');
  item.setAttribute('role', 'button');
  item.setAttribute('tabindex', '0');
  item.setAttribute('aria-label', 'Ampliar fotos de ' + label);
  const abrir = () => lbOpen(item.__fotos, item.__cur, label, item);
  item.addEventListener('click', abrir);
  item.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); }
  });

  // Testa os nomes um a um; só as fotos que existirem entram no slide
  procurarFotos(prefix + '-', prefix, 15).then(valid => {
    if (!valid.length) return; // só a foto de capa: bloco fica estático

    // O visualizador passa a conhecer todas as fotos da categoria
    item.__fotos = [baseImg.getAttribute('src')].concat(valid);

    const slides = valid.map(src => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = '';
      img.className = 'slide';
      item.insertBefore(img, item.querySelector('.mosaic-label'));
      return img;
    });

    const total = slides.length + 1; // + a foto base
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

    if (reducedMotion) return; // sem rotação automática, mas o clique continua valendo

    setInterval(() => {
      if (paused) return;
      cur = (cur + 1) % total;
      item.__cur = cur;   // o visualizador abre na foto que está à mostra
      slides.forEach((s, i) => s.classList.toggle('active', i === cur - 1));
      dotEls.forEach((d, i) => d.classList.toggle('on', i === cur));
    }, 5500 + idx * 450);
  });
});
