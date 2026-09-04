// =====================================================================
// DEPOIMENTOS — carrossel único + formulário de envio
// Studio Araújo Fotografia
//
// Os 3 depoimentos originais estão fixos neste arquivo.
// Ao carregar a página, o script busca depoimentos novos na planilha
// via Apps Script e os junta ao carrossel.
// =====================================================================

const DEPOIMENTOS_API_URL = "https://script.google.com/macros/s/AKfycbwqs_IWBW_6vFNvklpe7gqU4kuHWIPQIk4P23o7RsIzoqr1sWKmKOVcTPVLJrtI0zq4/exec";

// ── Depoimentos originais (sempre presentes, mesmo offline) ───────────
const DEPOIMENTOS_FIXOS = [
  {
    nome: "Leane Santos",
    instagram: "leanesantos58",
    comentario: "Só temos a agradecer os excelentes profissionais que são, deixando a gente super à vontade e fazendo um belíssimo trabalho em dupla. 👏🏼👏🏼👏🏼",
    data: ""
  },
  {
    nome: "Gessilene",
    instagram: "gessy.ts",
    comentario: "Só tenho a agradecer ao meu Studio preferido, Araújo claro, por todo o carinho, dedicação, respeito, amor e cuidado com cada detalhe. Obrigada Michele e Wellington. Amei, adorei, chorei de tanta emoção. ♥️",
    data: ""
  },
  {
    nome: "Josineide",
    instagram: "josineides900",
    comentario: "Obrigado por vocês eternizarem esse momento tão lindo nas nossas vidas. 👏👏 Obrigado por todo o cuidado e carinho com a minha filha nesse dia tão esperado por todos nós.",
    data: ""
  }
];

// ── Elementos ─────────────────────────────────────────────────────────
const carrosselContainer = document.getElementById("testiCarrossel");
const carrosselTrack     = document.getElementById("testiTrack");
const carrosselDots      = document.getElementById("testiDots");
const carrosselPrev      = document.getElementById("testiPrev");
const carrosselNext      = document.getElementById("testiNext");
const contadorEl         = document.getElementById("depContador");
const formDepoimento     = document.getElementById("formDepoimento");
const formMsg            = document.getElementById("formMsg");
const btnEnviar          = document.getElementById("btnEnviarDep");
const campoComentario    = document.getElementById("depComentario");
const formWrap           = document.querySelector(".dep-form-wrap");

const MAX_CHARS = 500;
let carrosselIndex = 0;
let carrosselTotal = 0;
let autoplayTimer = null;

// ── Formulário recolhível ─────────────────────────────────────────────
// Na home, o formulário continua disponível, mas começa compacto para a
// prova social não perder protagonismo. Ao tocar no convite, o mesmo card
// cresce e revela o formulário completo.
function prepararFormularioRecolhivel() {
  if (!formWrap || !formDepoimento || document.getElementById("depToggle")) return;

  const style = document.createElement("style");
  style.textContent = `
    .dep-form-wrap.dep-collapsible{
      padding:24px 28px;
      transition:padding .38s ease, border-color .38s ease, background .38s ease;
    }
    .dep-form-wrap.dep-collapsible.is-open{
      padding:36px 40px 40px;
      border-color:rgba(201,162,75,.24);
    }
    .dep-invite{
      position:relative;
      z-index:2;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:28px;
    }
    .dep-invite-copy{ min-width:0; }
    .dep-invite h3{
      font-family:'Cormorant Garamond',serif;
      font-size:clamp(1.35rem,2.2vw,1.7rem);
      line-height:1.2;
      color:var(--cream);
      margin:0 0 5px;
      font-weight:500;
    }
    .dep-invite p{
      margin:0;
      color:var(--muted);
      font-size:.86rem;
      line-height:1.5;
    }
    .dep-toggle{
      flex:0 0 auto;
      display:inline-flex;
      align-items:center;
      gap:9px;
      border:1px solid rgba(201,162,75,.42);
      border-radius:999px;
      background:rgba(201,162,75,.06);
      color:var(--gold-light);
      padding:10px 16px;
      font-family:'Jost',sans-serif;
      font-size:.7rem;
      letter-spacing:.09em;
      text-transform:uppercase;
      cursor:pointer;
      transition:background .25s ease,border-color .25s ease,color .25s ease;
    }
    .dep-toggle:hover{
      background:rgba(201,162,75,.13);
      border-color:var(--gold);
      color:var(--cream);
    }
    .dep-toggle svg{
      width:14px;
      height:14px;
      transition:transform .32s ease;
    }
    .dep-form-wrap.is-open .dep-toggle svg{ transform:rotate(180deg); }
    .dep-form-wrap.is-open .dep-invite{
      padding-bottom:26px;
      margin-bottom:28px;
      border-bottom:1px solid rgba(201,162,75,.12);
    }
    .dep-form-wrap.dep-collapsible .dep-form[hidden]{ display:none !important; }
    .dep-form-wrap.dep-collapsible .dep-form:not([hidden]){
      animation:depFormIn .38s cubic-bezier(.16,.84,.44,1) both;
    }
    @keyframes depFormIn{
      from{ opacity:0; transform:translateY(-8px); }
      to{ opacity:1; transform:none; }
    }
    @media (max-width:700px){
      .dep-form-wrap.dep-collapsible,
      .dep-form-wrap.dep-collapsible.is-open{ padding:22px 20px 24px; }
      .dep-invite{ align-items:flex-start; flex-direction:column; gap:17px; }
      .dep-toggle{ width:100%; justify-content:center; }
      .dep-form-wrap.is-open .dep-invite{ padding-bottom:22px; margin-bottom:24px; }
    }
  `;
  document.head.appendChild(style);

  const convite = document.createElement("div");
  convite.className = "dep-invite";
  convite.innerHTML =
    '<div class="dep-invite-copy">' +
      '<h3>Fotografou com a gente?</h3>' +
      '<p>Sua experiência pode ajudar outras famílias a conhecerem nosso trabalho.</p>' +
    '</div>' +
    '<button type="button" class="dep-toggle" id="depToggle" aria-expanded="false" aria-controls="formDepoimento">' +
      '<span>Deixar meu depoimento</span>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>' +
    '</button>';

  formWrap.classList.add("dep-collapsible");
  formWrap.insertBefore(convite, formWrap.firstChild);
  formDepoimento.hidden = true;

  const toggle = document.getElementById("depToggle");
  const toggleTxt = toggle.querySelector("span");
  toggle.addEventListener("click", () => {
    const abrir = formDepoimento.hidden;
    formDepoimento.hidden = !abrir;
    formWrap.classList.toggle("is-open", abrir);
    toggle.setAttribute("aria-expanded", abrir ? "true" : "false");
    toggleTxt.textContent = abrir ? "Recolher formulário" : "Deixar meu depoimento";

    if (abrir) {
      requestAnimationFrame(() => {
        const nome = document.getElementById("depNome");
        if (nome) nome.focus({ preventScroll: true });
      });
    }
  });
}

prepararFormularioRecolhivel();

// ── SVG das 5 estrelas ────────────────────────────────────────────────
function estrelasSVG() {
  const star = '<svg class="star" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.9 6.26L21.6 9.2l-4.8 4.6 1.2 6.7L12 17.3 6 20.5l1.2-6.7-4.8-4.6 6.7-.94z"/></svg>';
  return '<div class="testi-stars" aria-label="5 de 5 estrelas">' + star.repeat(5) + '</div>';
}

// ── Criar card HTML ───────────────────────────────────────────────────
function criarCard(dep) {
  const fig = document.createElement("figure");
  fig.className = "testi-card";

  let captionHTML = "";
  if (dep.instagram) {
    const handle = dep.instagram.replace(/^@/, "");
    captionHTML = '<figcaption>'
      + '<a class="testi-name" href="https://www.instagram.com/' + escapeHTML(handle) + '/" target="_blank" rel="noopener">' + escapeHTML(dep.nome) + '</a>'
      + '<span class="testi-role">@' + escapeHTML(handle) + '</span>'
      + '</figcaption>';
  } else {
    captionHTML = '<figcaption>'
      + '<span class="testi-name">' + escapeHTML(dep.nome) + '</span>'
      + (dep.data ? '<span class="testi-role">' + escapeHTML(dep.data) + '</span>' : '')
      + '</figcaption>';
  }

  fig.innerHTML = estrelasSVG()
    + '<blockquote>' + escapeHTML(dep.comentario) + '</blockquote>'
    + captionHTML;

  return fig;
}

function escapeHTML(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

// ── Carrossel ─────────────────────────────────────────────────────────
function montarCarrossel(depoimentos) {
  if (!depoimentos.length || !carrosselTrack) return;

  carrosselTrack.innerHTML = "";
  carrosselDots.innerHTML = "";

  depoimentos.forEach((dep, i) => {
    const card = criarCard(dep);
    card.classList.add("carousel-slide");
    if (i === 0) card.classList.add("active");
    else if (i === 1 && depoimentos.length > 2) card.classList.add("peek-right");
    carrosselTrack.appendChild(card);

    const dot = document.createElement("button");
    dot.className = "c-dot" + (i === 0 ? " on" : "");
    dot.setAttribute("aria-label", "Depoimento " + (i + 1));
    dot.addEventListener("click", () => irPara(i));
    carrosselDots.appendChild(dot);
  });

  carrosselTotal = depoimentos.length;
  carrosselIndex = 0;

  // Esconder setas e dots se houver só 1 depoimento
  const sozinho = carrosselTotal < 2;
  if (carrosselPrev) carrosselPrev.hidden = sozinho;
  if (carrosselNext) carrosselNext.hidden = sozinho;
  carrosselDots.hidden = sozinho;

  // Centraliza o primeiro card (sem animar na montagem)
  const transicaoOriginal = carrosselTrack.style.transition;
  carrosselTrack.style.transition = "none";
  requestAnimationFrame(() => {
    posicionarTrack();
    requestAnimationFrame(() => { carrosselTrack.style.transition = transicaoOriginal; });
  });

  clearInterval(autoplayTimer);
  if (!sozinho) iniciarAutoplay();
}

function irPara(idx) {
  if (carrosselTotal < 1) return;
  carrosselIndex = ((idx % carrosselTotal) + carrosselTotal) % carrosselTotal;

  posicionarTrack();

  const slides = carrosselTrack.querySelectorAll(".carousel-slide");
  const dots = carrosselDots.querySelectorAll(".c-dot");

  const prevIdx = (carrosselIndex - 1 + carrosselTotal) % carrosselTotal;
  const nextIdx = (carrosselIndex + 1) % carrosselTotal;

  slides.forEach((s, i) => {
    s.classList.remove("active", "peek-left", "peek-right");
    if (i === carrosselIndex) s.classList.add("active");
    else if (i === prevIdx && carrosselTotal > 2) s.classList.add("peek-left");
    else if (i === nextIdx && carrosselTotal > 2) s.classList.add("peek-right");
  });
  dots.forEach((d, i) => d.classList.toggle("on", i === carrosselIndex));

  reiniciarAutoplay();
}

// Centraliza o card ativo dentro da janela do carrossel.
// Cálculo em pixels: porcentagem no translate se refere à largura do
// track inteiro (todos os cards somados), não à de um card só.
function posicionarTrack() {
  const wrapper = carrosselTrack.parentElement;
  const slides = carrosselTrack.querySelectorAll(".carousel-slide");
  const ativo = slides[carrosselIndex];
  if (!wrapper || !ativo) return;

  const centroJanela = wrapper.offsetWidth / 2;
  const centroCard = ativo.offsetLeft + ativo.offsetWidth / 2;
  carrosselTrack.style.transform = "translateX(" + (centroJanela - centroCard) + "px)";
}

// Recalcular ao redimensionar a janela (o card muda de largura)
let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(posicionarTrack, 120);
});

function avancar() { irPara(carrosselIndex + 1); }
function voltar()  { irPara(carrosselIndex - 1); }

function iniciarAutoplay() {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  autoplayTimer = setInterval(avancar, 6000);
}
function reiniciarAutoplay() {
  clearInterval(autoplayTimer);
  if (carrosselTotal > 1) iniciarAutoplay();
}

if (carrosselPrev) carrosselPrev.addEventListener("click", voltar);
if (carrosselNext) carrosselNext.addEventListener("click", avancar);

// Pausar autoplay no hover/toque
if (carrosselContainer) {
  carrosselContainer.addEventListener("mouseenter", () => clearInterval(autoplayTimer));
  carrosselContainer.addEventListener("mouseleave", () => { if (carrosselTotal > 1) iniciarAutoplay(); });
}

// Swipe no celular
if (carrosselTrack) {
  let tx = 0;
  carrosselTrack.addEventListener("touchstart", (e) => { tx = e.changedTouches[0].clientX; }, { passive: true });
  carrosselTrack.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) dx < 0 ? avancar() : voltar();
  }, { passive: true });
}

// ── Contador de caracteres ────────────────────────────────────────────
if (campoComentario && contadorEl) {
  campoComentario.addEventListener("input", () => {
    const restante = MAX_CHARS - campoComentario.value.length;
    contadorEl.textContent = restante;
    contadorEl.classList.toggle("low", restante < 50);
    contadorEl.classList.toggle("over", restante < 0);
  });
}

// ── Envio do formulário ───────────────────────────────────────────────
if (formDepoimento) {
  formDepoimento.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("depNome").value.trim();
    const instagram = document.getElementById("depInstagram").value.trim();
    const comentario = campoComentario.value.trim();

    if (!nome || !comentario) {
      mostrarMsg("Preencha seu nome e comentário.", "erro");
      return;
    }
    if (comentario.length < 10) {
      mostrarMsg("Escreva pelo menos 10 caracteres no comentário.", "erro");
      return;
    }
    if (comentario.length > MAX_CHARS) {
      mostrarMsg("O comentário ultrapassou o limite de " + MAX_CHARS + " caracteres.", "erro");
      return;
    }

    btnEnviar.disabled = true;
    btnEnviar.textContent = "Enviando…";

    try {
      const res = await fetch(DEPOIMENTOS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ nome, instagram, comentario })
      });
      const data = await res.json();

      if (data.ok) {
        mostrarMsg("Obrigado pelo carinho! Seu depoimento já está no ar. ✨", "sucesso");
        formDepoimento.reset();
        if (contadorEl) { contadorEl.textContent = MAX_CHARS; contadorEl.className = "dep-contador"; }
        // Recarregar carrossel com o novo depoimento
        setTimeout(carregarDepoimentos, 1500);
      } else {
        mostrarMsg(data.erro || "Não foi possível enviar. Tente novamente.", "erro");
      }
    } catch (err) {
      mostrarMsg("Erro de conexão. Verifique sua internet e tente novamente.", "erro");
    }

    btnEnviar.disabled = false;
    btnEnviar.textContent = "Enviar depoimento";
  });
}

function mostrarMsg(texto, tipo) {
  if (!formMsg) return;
  formMsg.textContent = texto;
  formMsg.className = "dep-msg " + tipo;
  formMsg.hidden = false;
  setTimeout(() => { formMsg.hidden = true; }, 7000);
}

// ── Carregar depoimentos ──────────────────────────────────────────────
// Começa com os 3 fixos; quando a planilha responde, junta os novos.
async function carregarDepoimentos() {
  // Montar imediatamente com os fixos
  montarCarrossel(DEPOIMENTOS_FIXOS);

  try {
    const res = await fetch(DEPOIMENTOS_API_URL);
    const data = await res.json();
    if (data.depoimentos && data.depoimentos.length) {
      // Fixos primeiro, depois os da planilha (mais recentes no topo)
      montarCarrossel([...DEPOIMENTOS_FIXOS, ...data.depoimentos]);
    }
  } catch (err) {
    // Silencioso — os 3 fixos já estão no carrossel
  }
}

carregarDepoimentos();

// =====================================================================
// TRABALHOS RECENTES — seção editorial da home
// Usa as mesmas capas e galerias do portfólio para não duplicar conteúdo
// nem criar uma segunda fonte de imagens.
// =====================================================================
(function montarTrabalhosRecentes() {
  const portfolio = document.getElementById("portfolio");
  if (!portfolio || document.getElementById("trabalhosRecentes")) return;

  const destaques = [
    { label: "Ensaios de Gestante", titulo: "Ensaio de gestante", tipo: "Gestante", texto: "Um registro delicado para guardar a beleza e a emoção de uma fase única." },
    { label: "Casamentos", titulo: "Casamento", tipo: "Casamento", texto: "Afeto, detalhes e momentos espontâneos registrados do começo ao fim." },
    { label: "Aniversários", titulo: "Aniversário", tipo: "Aniversário", texto: "Sorrisos, encontros e memórias de um dia feito para celebrar." }
  ];

  const mosaicos = Array.from(portfolio.querySelectorAll(".mosaic-item"));
  const cards = destaques.map((d) => {
    const origem = mosaicos.find((item) => {
      const rotulo = item.querySelector(".mosaic-label");
      return rotulo && rotulo.textContent.trim() === d.label;
    });
    if (!origem) return "";
    const foto = origem.querySelector("img");
    if (!foto) return "";
    const src = foto.getAttribute("src");
    const alt = foto.getAttribute("alt") || d.titulo;
    return '<article class="recent-work-card">'
      + '<button type="button" class="recent-work-photo" data-recent-target="' + escapeHTML(d.label) + '" aria-label="Ver trabalho: ' + escapeHTML(d.titulo) + '">'
      + '<img src="' + escapeHTML(src) + '" alt="' + escapeHTML(alt) + '" loading="lazy" decoding="async">'
      + '<span class="recent-work-tag">' + escapeHTML(d.tipo) + '</span>'
      + '</button>'
      + '<div class="recent-work-body">'
      + '<h3>' + escapeHTML(d.titulo) + '</h3>'
      + '<p>' + escapeHTML(d.texto) + '</p>'
      + '<button type="button" class="recent-work-link" data-recent-target="' + escapeHTML(d.label) + '">Ver trabalho <span aria-hidden="true">→</span></button>'
      + '</div>'
      + '</article>';
  }).filter(Boolean).join("");

  if (!cards) return;

  const section = document.createElement("section");
  section.id = "trabalhosRecentes";
  section.className = "recent-works-section";
  section.innerHTML = '<div class="wrap">'
    + '<div class="recent-works-head">'
    + '<div class="recent-works-eyebrow"><span></span>Trabalhos recentes<span></span></div>'
    + '<h2>Histórias reais, registradas <em>recentemente</em></h2>'
    + '<p>Uma seleção de trabalhos para mostrar de perto a sensibilidade, o cuidado e o estilo do Studio Araújo.</p>'
    + '</div>'
    + '<div class="recent-works-grid">' + cards + '</div>'
    + '<div class="recent-works-cta"><a class="btn btn-outline" href="#portfolio">Ver portfólio completo</a></div>'
    + '</div>';

  const stats = document.querySelector(".stats-band");
  if (stats && stats.parentNode) stats.parentNode.insertBefore(section, stats);
  else portfolio.insertAdjacentElement("afterend", section);

  const style = document.createElement("style");
  style.textContent = `
    .recent-works-section{padding:96px 0;background:linear-gradient(180deg,#11100e 0%,#0e0d0b 100%);border-top:1px solid var(--hairline);border-bottom:1px solid var(--hairline)}
    .recent-works-head{text-align:center;max-width:820px;margin:0 auto 46px}
    .recent-works-eyebrow{display:flex;align-items:center;justify-content:center;gap:18px;color:var(--gold);font-size:.76rem;letter-spacing:.24em;text-transform:uppercase;margin-bottom:20px}
    .recent-works-eyebrow span{width:62px;height:1px;background:linear-gradient(90deg,transparent,var(--gold))}
    .recent-works-eyebrow span:last-child{background:linear-gradient(90deg,var(--gold),transparent)}
    .recent-works-head h2{font-size:clamp(2rem,4vw,3.2rem);line-height:1.12;margin-bottom:14px;color:var(--cream)}
    .recent-works-head h2 em{font-style:italic;color:var(--gold-light)}
    .recent-works-head p{color:var(--muted);max-width:680px;margin:0 auto}
    .recent-works-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
    .recent-work-card{background:linear-gradient(180deg,#181510,#12110e);border:1px solid rgba(201,162,75,.18);border-radius:16px;overflow:hidden;box-shadow:0 22px 50px rgba(0,0,0,.18);transition:transform .35s ease,border-color .35s ease,box-shadow .35s ease}
    .recent-work-card:hover{transform:translateY(-5px);border-color:rgba(201,162,75,.38);box-shadow:0 28px 60px rgba(0,0,0,.28)}
    .recent-work-photo{display:block;position:relative;width:100%;aspect-ratio:4/4.6;border:0;padding:0;background:#0e0d0b;cursor:pointer;overflow:hidden}
    .recent-work-photo::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 56%,rgba(14,13,11,.82) 100%);pointer-events:none}
    .recent-work-photo img{width:100%;height:100%;object-fit:cover;transition:transform .7s cubic-bezier(.16,.84,.44,1)}
    .recent-work-card:hover .recent-work-photo img{transform:scale(1.035)}
    .recent-work-tag{position:absolute;z-index:2;top:16px;left:16px;padding:7px 12px;border-radius:999px;background:rgba(14,13,11,.68);border:1px solid rgba(243,236,220,.22);backdrop-filter:blur(8px);color:var(--cream);font-size:.68rem;letter-spacing:.12em;text-transform:uppercase}
    .recent-work-body{padding:24px 24px 22px}
    .recent-work-body h3{font-size:1.65rem;color:var(--cream);margin-bottom:8px}
    .recent-work-body p{color:var(--muted);font-size:.9rem;line-height:1.6;min-height:58px}
    .recent-work-link{display:flex;align-items:center;justify-content:space-between;width:100%;margin-top:20px;padding:16px 0 0;border:0;border-top:1px solid rgba(201,162,75,.14);background:none;color:var(--gold-light);font:400 .78rem 'Jost',sans-serif;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}
    .recent-work-link span{font-size:1.2rem;transition:transform .25s ease}
    .recent-work-link:hover span{transform:translateX(4px)}
    .recent-works-cta{display:flex;justify-content:center;margin-top:40px}
    @media(max-width:860px){.recent-works-section{padding:74px 0}.recent-works-grid{grid-template-columns:1fr;max-width:560px;margin:0 auto}.recent-work-photo{aspect-ratio:4/3.7}.recent-work-body p{min-height:0}.recent-works-eyebrow span{width:38px}}
    @media(max-width:520px){.recent-works-head{margin-bottom:34px}.recent-work-body{padding:20px}.recent-work-photo{aspect-ratio:4/4.2}}
    @media(prefers-reduced-motion:reduce){.recent-work-card,.recent-work-photo img,.recent-work-link span{transition:none!important}}
  `;
  document.head.appendChild(style);

  section.querySelectorAll("[data-recent-target]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const alvo = mosaicos.find((item) => {
        const rotulo = item.querySelector(".mosaic-label");
        return rotulo && rotulo.textContent.trim() === btn.dataset.recentTarget;
      });
      if (alvo) alvo.click();
    });
  });
})();
