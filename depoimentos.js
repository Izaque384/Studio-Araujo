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

const MAX_CHARS = 500;
let carrosselIndex = 0;
let carrosselTotal = 0;
let autoplayTimer = null;

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
