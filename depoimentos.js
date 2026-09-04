// =====================================================================
// DEPOIMENTOS — carrossel + formulário com foto opcional
// Studio Araújo Fotografia
// =====================================================================

const DEPOIMENTOS_API_URL = "https://script.google.com/macros/s/AKfycbwqs_IWBW_6vFNvklpe7gqU4kuHWIPQIk4P23o7RsIzoqr1sWKmKOVcTPVLJrtI0zq4/exec";
const DEPOIMENTOS_FIXOS = [
  { nome: "Leane Santos", instagram: "leanesantos58", comentario: "Só temos a agradecer os excelentes profissionais que são, deixando a gente super à vontade e fazendo um belíssimo trabalho em dupla. 👏🏼👏🏼👏🏼", data: "", avatar_url: "" },
  { nome: "Gessilene", instagram: "gessy.ts", comentario: "Só tenho a agradecer ao meu Studio preferido, Araújo claro, por todo o carinho, dedicação, respeito, amor e cuidado com cada detalhe. Obrigada Michele e Wellington. Amei, adorei, chorei de tanta emoção. ♥️", data: "", avatar_url: "" },
  { nome: "Josineide", instagram: "josineides900", comentario: "Obrigado por vocês eternizarem esse momento tão lindo nas nossas vidas. 👏👏 Obrigado por todo o cuidado e carinho com a minha filha nesse dia tão esperado por todos nós.", data: "", avatar_url: "" }
];

const carrosselContainer = document.getElementById("testiCarrossel");
const carrosselTrack = document.getElementById("testiTrack");
const carrosselDots = document.getElementById("testiDots");
const carrosselPrev = document.getElementById("testiPrev");
const carrosselNext = document.getElementById("testiNext");
const contadorEl = document.getElementById("depContador");
const formDepoimento = document.getElementById("formDepoimento");
const formMsg = document.getElementById("formMsg");
const btnEnviar = document.getElementById("btnEnviarDep");
const campoComentario = document.getElementById("depComentario");
const formWrap = document.querySelector(".dep-form-wrap");
const MAX_CHARS = 500;
let carrosselIndex = 0, carrosselTotal = 0, autoplayTimer = null, avatarData = "";

function escapeHTML(str) {
  const d = document.createElement("div"); d.textContent = str ?? ""; return d.innerHTML;
}
function iniciais(nome) {
  const p = String(nome || "").trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] || "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase() || "•";
}

function prepararFormularioRecolhivel() {
  if (!formWrap || !formDepoimento || document.getElementById("depToggle")) return;
  const style = document.createElement("style");
  style.id = "depUploadStyle";
  style.textContent = `
    .dep-form-wrap.dep-collapsible{padding:24px 28px;transition:padding .38s ease,border-color .38s ease,background .38s ease}
    .dep-form-wrap.dep-collapsible.is-open{padding:36px 40px 40px;border-color:rgba(201,162,75,.24)}
    .dep-invite{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:28px}
    .dep-invite-copy{min-width:0}.dep-invite h3{font-family:'Cormorant Garamond',serif;font-size:clamp(1.35rem,2.2vw,1.7rem);line-height:1.2;color:var(--cream);margin:0 0 5px;font-weight:500}.dep-invite p{margin:0;color:var(--muted);font-size:.86rem;line-height:1.5}
    .dep-toggle{flex:0 0 auto;display:inline-flex;align-items:center;gap:9px;border:1px solid rgba(201,162,75,.42);border-radius:999px;background:rgba(201,162,75,.06);color:var(--gold-light);padding:10px 16px;font-family:'Jost',sans-serif;font-size:.7rem;letter-spacing:.09em;text-transform:uppercase;cursor:pointer}.dep-toggle svg{width:14px;height:14px;transition:transform .32s ease}.dep-form-wrap.is-open .dep-toggle svg{transform:rotate(180deg)}
    .dep-form-wrap.is-open .dep-invite{padding-bottom:26px;margin-bottom:28px;border-bottom:1px solid rgba(201,162,75,.12)}.dep-form-wrap.dep-collapsible .dep-form[hidden]{display:none!important}
    .dep-photo-field{margin-top:18px}.dep-photo-row{display:flex;align-items:center;gap:14px}.dep-photo-preview{width:58px;height:58px;flex:0 0 58px;border-radius:50%;border:1px solid rgba(201,162,75,.34);background:rgba(201,162,75,.05);display:grid;place-items:center;overflow:hidden;color:var(--gold-light);font-family:'Cormorant Garamond',serif;font-size:1.1rem}.dep-photo-preview img{width:100%;height:100%;object-fit:cover}.dep-photo-actions{display:flex;flex-wrap:wrap;gap:8px}.dep-photo-btn{border:1px solid var(--hairline);background:transparent;color:var(--cream);padding:9px 12px;font:400 .7rem 'Jost',sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:pointer}.dep-photo-btn:hover{border-color:var(--gold)}.dep-photo-help{display:block;margin-top:6px;color:var(--muted);font-size:.7rem}.dep-photo-input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
    .testi-avatar{width:58px;height:58px;flex:0 0 58px;border-radius:50%;overflow:hidden;border:1px solid rgba(201,162,75,.38);background:radial-gradient(circle at 35% 30%,rgba(230,200,120,.17),rgba(201,162,75,.06));display:grid;place-items:center;color:var(--gold-light);font-family:'Cormorant Garamond',serif;font-size:1.05rem;font-weight:600;letter-spacing:.04em;box-shadow:0 10px 26px rgba(0,0,0,.18)}.testi-avatar img{width:100%;height:100%;object-fit:cover}.testi-card figcaption{display:grid!important;grid-template-columns:58px auto!important;grid-template-rows:auto auto!important;column-gap:14px!important;align-items:center!important;padding-left:0!important}.testi-card figcaption .testi-avatar{grid-column:1;grid-row:1/3}.testi-card figcaption .testi-name{grid-column:2;grid-row:1;align-self:end}.testi-card figcaption .testi-role{grid-column:2;grid-row:2;align-self:start}.testi-card figcaption::before{display:none!important}
    @media(max-width:700px){.dep-form-wrap.dep-collapsible,.dep-form-wrap.dep-collapsible.is-open{padding:22px 20px 24px}.dep-invite{align-items:flex-start;flex-direction:column;gap:17px}.dep-toggle{width:100%;justify-content:center}.dep-form-wrap.is-open .dep-invite{padding-bottom:22px;margin-bottom:24px}}
  `;
  document.head.appendChild(style);

  const convite = document.createElement("div");
  convite.className = "dep-invite";
  convite.innerHTML = '<div class="dep-invite-copy"><h3>Fotografou com a gente?</h3><p>Sua experiência pode ajudar outras famílias a conhecerem nosso trabalho.</p></div><button type="button" class="dep-toggle" id="depToggle" aria-expanded="false" aria-controls="formDepoimento"><span>Deixar meu depoimento</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>';
  formWrap.classList.add("dep-collapsible"); formWrap.insertBefore(convite, formWrap.firstChild); formDepoimento.hidden = true;
  const toggle = document.getElementById("depToggle"), toggleTxt = toggle.querySelector("span");
  toggle.addEventListener("click", () => { const abrir = formDepoimento.hidden; formDepoimento.hidden = !abrir; formWrap.classList.toggle("is-open", abrir); toggle.setAttribute("aria-expanded", abrir ? "true" : "false"); toggleTxt.textContent = abrir ? "Recolher formulário" : "Deixar meu depoimento"; if (abrir) requestAnimationFrame(() => document.getElementById("depNome")?.focus({preventScroll:true})); });

  const instagramField = document.getElementById("depInstagram")?.closest(".dep-field");
  if (instagramField && !document.getElementById("depFoto")) {
    const campo = document.createElement("div"); campo.className = "dep-field dep-photo-field";
    campo.innerHTML = '<label>Sua foto <span class="dep-opcional">(opcional)</span></label><div class="dep-photo-row"><div class="dep-photo-preview" id="depFotoPreview" aria-hidden="true"><span>Foto</span></div><div><div class="dep-photo-actions"><button type="button" class="dep-photo-btn" id="depFotoBtn">Escolher foto</button><button type="button" class="dep-photo-btn" id="depFotoRemover" hidden>Remover</button></div><small class="dep-photo-help">JPG, PNG ou WebP. A imagem será recortada e otimizada.</small></div></div><input class="dep-photo-input" type="file" id="depFoto" accept="image/jpeg,image/png,image/webp">';
    instagramField.insertAdjacentElement("afterend", campo);
    const input = document.getElementById("depFoto"), preview = document.getElementById("depFotoPreview"), remover = document.getElementById("depFotoRemover");
    document.getElementById("depFotoBtn").addEventListener("click", () => input.click());
    remover.addEventListener("click", () => { avatarData = ""; input.value = ""; preview.innerHTML = "<span>Foto</span>"; remover.hidden = true; });
    input.addEventListener("change", async () => {
      const f = input.files?.[0]; if (!f) return;
      if (!/^image\/(jpeg|png|webp)$/i.test(f.type) || f.size > 10 * 1024 * 1024) { mostrarMsg("Escolha uma imagem JPG, PNG ou WebP de até 10 MB.", "erro"); input.value = ""; return; }
      try { avatarData = await otimizarAvatar(f); preview.innerHTML = '<img src="' + avatarData + '" alt="Prévia da foto">'; remover.hidden = false; }
      catch (_) { mostrarMsg("Não foi possível processar essa foto. Tente outra imagem.", "erro"); input.value = ""; }
    });
  }
}

async function otimizarAvatar(file) {
  const bitmap = await createImageBitmap(file), size = 256, min = Math.min(bitmap.width, bitmap.height), sx = (bitmap.width - min) / 2, sy = (bitmap.height - min) / 2;
  const canvas = document.createElement("canvas"); canvas.width = size; canvas.height = size;
  canvas.getContext("2d", {alpha:false}).drawImage(bitmap, sx, sy, min, min, 0, 0, size, size); bitmap.close();
  let quality = .78, data = canvas.toDataURL("image/webp", quality);
  while (data.length > 180000 && quality > .45) { quality -= .08; data = canvas.toDataURL("image/webp", quality); }
  if (data.length > 200000) throw new Error("avatar grande"); return data;
}

prepararFormularioRecolhivel();

function estrelasSVG() { const star = '<svg class="star" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.9 6.26L21.6 9.2l-4.8 4.6 1.2 6.7L12 17.3 6 20.5l1.2-6.7-4.8-4.6 6.7-.94z"/></svg>'; return '<div class="testi-stars" aria-label="5 de 5 estrelas">' + star.repeat(5) + '</div>'; }
function avatarHTML(dep) { return dep.avatar_url ? '<span class="testi-avatar"><img src="' + escapeHTML(dep.avatar_url) + '" alt="Foto de ' + escapeHTML(dep.nome) + '"></span>' : '<span class="testi-avatar" aria-hidden="true">' + escapeHTML(iniciais(dep.nome)) + '</span>'; }
function criarCard(dep) {
  const fig = document.createElement("figure"); fig.className = "testi-card";
  const handle = String(dep.instagram || "").replace(/^@/, "");
  const nome = handle ? '<a class="testi-name" href="https://www.instagram.com/' + escapeHTML(handle) + '/" target="_blank" rel="noopener">' + escapeHTML(dep.nome) + '</a>' : '<span class="testi-name">' + escapeHTML(dep.nome) + '</span>';
  const role = handle ? '@' + escapeHTML(handle) : escapeHTML(dep.data || "");
  fig.innerHTML = estrelasSVG() + '<blockquote>' + escapeHTML(dep.comentario) + '</blockquote><figcaption>' + avatarHTML(dep) + nome + (role ? '<span class="testi-role">' + role + '</span>' : '<span class="testi-role"></span>') + '</figcaption>';
  return fig;
}

function montarCarrossel(depoimentos) {
  if (!depoimentos.length || !carrosselTrack) return;
  carrosselTrack.innerHTML = ""; carrosselDots.innerHTML = "";
  depoimentos.forEach((dep, i) => { const card = criarCard(dep); card.classList.add("carousel-slide"); if (i === 0) card.classList.add("active"); else if (i === 1 && depoimentos.length > 2) card.classList.add("peek-right"); carrosselTrack.appendChild(card); const dot = document.createElement("button"); dot.className = "c-dot" + (i === 0 ? " on" : ""); dot.setAttribute("aria-label", "Depoimento " + (i + 1)); dot.addEventListener("click", () => irPara(i)); carrosselDots.appendChild(dot); });
  carrosselTotal = depoimentos.length; carrosselIndex = 0; const sozinho = carrosselTotal < 2; if (carrosselPrev) carrosselPrev.hidden = sozinho; if (carrosselNext) carrosselNext.hidden = sozinho; carrosselDots.hidden = sozinho;
  const t = carrosselTrack.style.transition; carrosselTrack.style.transition = "none"; requestAnimationFrame(() => { posicionarTrack(); requestAnimationFrame(() => { carrosselTrack.style.transition = t; }); }); clearInterval(autoplayTimer); if (!sozinho) iniciarAutoplay();
}
function irPara(idx) { if (carrosselTotal < 1) return; carrosselIndex = ((idx % carrosselTotal) + carrosselTotal) % carrosselTotal; posicionarTrack(); const slides = carrosselTrack.querySelectorAll(".carousel-slide"), dots = carrosselDots.querySelectorAll(".c-dot"), prev = (carrosselIndex - 1 + carrosselTotal) % carrosselTotal, next = (carrosselIndex + 1) % carrosselTotal; slides.forEach((s,i) => { s.classList.remove("active","peek-left","peek-right"); if (i===carrosselIndex)s.classList.add("active"); else if(i===prev&&carrosselTotal>2)s.classList.add("peek-left"); else if(i===next&&carrosselTotal>2)s.classList.add("peek-right"); }); dots.forEach((d,i)=>d.classList.toggle("on",i===carrosselIndex)); reiniciarAutoplay(); }
function posicionarTrack() { const wrapper = carrosselTrack?.parentElement, ativo = carrosselTrack?.querySelectorAll(".carousel-slide")?.[carrosselIndex]; if (!wrapper || !ativo) return; carrosselTrack.style.transform = "translateX(" + (wrapper.offsetWidth/2 - (ativo.offsetLeft + ativo.offsetWidth/2)) + "px)"; }
let resizeTimer = null; window.addEventListener("resize",()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(posicionarTrack,120)});
function avancar(){irPara(carrosselIndex+1)} function voltar(){irPara(carrosselIndex-1)} function iniciarAutoplay(){if(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)return;autoplayTimer=setInterval(avancar,6000)} function reiniciarAutoplay(){clearInterval(autoplayTimer);if(carrosselTotal>1)iniciarAutoplay()}
if(carrosselPrev)carrosselPrev.addEventListener("click",voltar); if(carrosselNext)carrosselNext.addEventListener("click",avancar); if(carrosselContainer){carrosselContainer.addEventListener("mouseenter",()=>clearInterval(autoplayTimer));carrosselContainer.addEventListener("mouseleave",()=>{if(carrosselTotal>1)iniciarAutoplay()})} if(carrosselTrack){let tx=0;carrosselTrack.addEventListener("touchstart",e=>{tx=e.changedTouches[0].clientX},{passive:true});carrosselTrack.addEventListener("touchend",e=>{const dx=e.changedTouches[0].clientX-tx;if(Math.abs(dx)>50)dx<0?avancar():voltar()},{passive:true})}

if(campoComentario&&contadorEl)campoComentario.addEventListener("input",()=>{const r=MAX_CHARS-campoComentario.value.length;contadorEl.textContent=r;contadorEl.classList.toggle("low",r<50);contadorEl.classList.toggle("over",r<0)});

if(formDepoimento) formDepoimento.addEventListener("submit", async e => {
  e.preventDefault(); const nome=document.getElementById("depNome").value.trim(), instagram=document.getElementById("depInstagram").value.trim().replace(/^@/,""), comentario=campoComentario.value.trim();
  if(!nome||!comentario)return mostrarMsg("Preencha seu nome e comentário.","erro"); if(comentario.length<10)return mostrarMsg("Escreva pelo menos 10 caracteres no comentário.","erro"); if(comentario.length>MAX_CHARS)return mostrarMsg("O comentário ultrapassou o limite de 500 caracteres.","erro");
  btnEnviar.disabled=true;btnEnviar.textContent="Enviando…";
  try {
    const neon=await neonPublicClient(); const {error}=await neon.from("site_testimonials").insert({name:nome,instagram,comment:comentario,avatar_url:avatarData,is_visible:true}); if(error)throw error;
    mostrarMsg("Obrigado pelo carinho! Seu depoimento já está no ar. ✨","sucesso"); formDepoimento.reset(); avatarData=""; const preview=document.getElementById("depFotoPreview"); if(preview)preview.innerHTML="<span>Foto</span>"; const remover=document.getElementById("depFotoRemover"); if(remover)remover.hidden=true; if(contadorEl){contadorEl.textContent=MAX_CHARS;contadorEl.className="dep-contador"} await carregarDepoimentos();
  } catch(err) { console.error(err); mostrarMsg("Não foi possível enviar agora. Tente novamente em instantes.","erro"); }
  btnEnviar.disabled=false;btnEnviar.textContent="Enviar depoimento";
});

function mostrarMsg(texto,tipo){if(!formMsg)return;formMsg.textContent=texto;formMsg.className="dep-msg "+tipo;formMsg.hidden=false;setTimeout(()=>{formMsg.hidden=true},7000)}
async function carregarDepoimentos(){
  let planilha=[], neonDeps=[]; montarCarrossel(DEPOIMENTOS_FIXOS);
  await Promise.all([
    fetch(DEPOIMENTOS_API_URL).then(r=>r.json()).then(d=>{if(Array.isArray(d.depoimentos))planilha=d.depoimentos}).catch(()=>{}),
    neonPublicClient().then(n=>n.from("site_testimonials").select("name,instagram,comment,avatar_url,created_at").eq("is_visible",true).order("created_at",{ascending:false})).then(({data,error})=>{if(!error&&Array.isArray(data))neonDeps=data.map(x=>({nome:x.name,instagram:x.instagram,comentario:x.comment,avatar_url:x.avatar_url,data:""}))}).catch(()=>{})
  ]);
  montarCarrossel([...DEPOIMENTOS_FIXOS,...neonDeps,...planilha]);
}
carregarDepoimentos();

// Fallback visual imediato dos trabalhos recentes; recent-works.js substitui quando o Neon responde.
(function montarTrabalhosRecentes(){
  const portfolio=document.getElementById("portfolio");if(!portfolio||document.getElementById("trabalhosRecentes"))return;const destaques=[{label:"Ensaios de Gestante",titulo:"Ensaio de gestante",tipo:"Gestante",texto:"Um registro delicado para guardar a beleza e a emoção de uma fase única."},{label:"Casamentos",titulo:"Casamento",tipo:"Casamento",texto:"Afeto, detalhes e momentos espontâneos registrados do começo ao fim."},{label:"Aniversários",titulo:"Aniversário",tipo:"Aniversário",texto:"Sorrisos, encontros e memórias de um dia feito para celebrar."}];const mosaicos=Array.from(portfolio.querySelectorAll(".mosaic-item"));const cards=destaques.map(d=>{const origem=mosaicos.find(item=>item.querySelector(".mosaic-label")?.textContent.trim()===d.label),foto=origem?.querySelector("img");if(!foto)return"";const src=foto.getAttribute("src"),alt=foto.getAttribute("alt")||d.titulo;return '<article class="recent-work-card"><button type="button" class="recent-work-photo" data-recent-target="'+escapeHTML(d.label)+'" aria-label="Ver trabalho: '+escapeHTML(d.titulo)+'"><img src="'+escapeHTML(src)+'" alt="'+escapeHTML(alt)+'" loading="lazy" decoding="async"><span class="recent-work-tag">'+escapeHTML(d.tipo)+'</span></button><div class="recent-work-body"><h3>'+escapeHTML(d.titulo)+'</h3><p>'+escapeHTML(d.texto)+'</p><button type="button" class="recent-work-link" data-recent-target="'+escapeHTML(d.label)+'">Ver trabalho <span aria-hidden="true">→</span></button></div></article>'}).filter(Boolean).join("");if(!cards)return;const section=document.createElement("section");section.id="trabalhosRecentes";section.className="recent-works-section";section.innerHTML='<div class="wrap"><div class="recent-works-head"><div class="recent-works-eyebrow"><span></span>Trabalhos recentes<span></span></div><h2>Histórias reais, registradas <em>recentemente</em></h2><p>Uma seleção de trabalhos para mostrar de perto a sensibilidade, o cuidado e o estilo do Studio Araújo.</p></div><div class="recent-works-grid">'+cards+'</div><div class="recent-works-cta"><a class="btn btn-outline" href="#portfolio">Ver portfólio completo</a></div></div>';const stats=document.querySelector(".stats-band");if(stats?.parentNode)stats.parentNode.insertBefore(section,stats);else portfolio.insertAdjacentElement("afterend",section);const style=document.createElement("style");style.textContent=`.recent-works-section{padding:96px 0;background:linear-gradient(180deg,#11100e 0%,#0e0d0b 100%);border-top:1px solid var(--hairline);border-bottom:1px solid var(--hairline)}.recent-works-head{text-align:center;max-width:820px;margin:0 auto 46px}.recent-works-eyebrow{display:flex;align-items:center;justify-content:center;gap:18px;color:var(--gold);font-size:.76rem;letter-spacing:.24em;text-transform:uppercase;margin-bottom:20px}.recent-works-eyebrow span{width:62px;height:1px;background:linear-gradient(90deg,transparent,var(--gold))}.recent-works-eyebrow span:last-child{background:linear-gradient(90deg,var(--gold),transparent)}.recent-works-head h2{font-size:clamp(2rem,4vw,3.2rem);line-height:1.12;margin-bottom:14px;color:var(--cream)}.recent-works-head h2 em{font-style:italic;color:var(--gold-light)}.recent-works-head p{color:var(--muted);max-width:680px;margin:0 auto}.recent-works-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}.recent-work-card{background:linear-gradient(180deg,#181510,#12110e);border:1px solid rgba(201,162,75,.18);border-radius:16px;overflow:hidden}.recent-work-photo{display:block;position:relative;width:100%;aspect-ratio:4/4.6;border:0;padding:0;background:#0e0d0b;cursor:pointer;overflow:hidden}.recent-work-photo img{width:100%;height:100%;object-fit:cover}.recent-work-tag{position:absolute;z-index:2;top:16px;left:16px;padding:7px 12px;border-radius:999px;background:rgba(14,13,11,.68);border:1px solid rgba(243,236,220,.22);color:var(--cream);font-size:.68rem;letter-spacing:.12em;text-transform:uppercase}.recent-work-body{padding:24px}.recent-work-body h3{font-size:1.65rem;color:var(--cream);margin-bottom:8px}.recent-work-body p{color:var(--muted);font-size:.9rem;line-height:1.6}.recent-work-link{display:flex;align-items:center;justify-content:space-between;width:100%;margin-top:20px;padding:16px 0 0;border:0;border-top:1px solid rgba(201,162,75,.14);background:none;color:var(--gold-light);font:400 .78rem 'Jost',sans-serif;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}.recent-works-cta{display:flex;justify-content:center;margin-top:40px}@media(max-width:860px){.recent-works-section{padding:74px 0}.recent-works-grid{grid-template-columns:1fr;max-width:560px;margin:0 auto}}`;document.head.appendChild(style);section.querySelectorAll("[data-recent-target]").forEach(btn=>btn.addEventListener("click",()=>{const alvo=mosaicos.find(item=>item.querySelector(".mosaic-label")?.textContent.trim()===btn.dataset.recentTarget);if(alvo)alvo.click()}));
})();
const recentWorksScript=document.createElement('script');recentWorksScript.src='recent-works.js';recentWorksScript.defer=true;document.body.appendChild(recentWorksScript);
