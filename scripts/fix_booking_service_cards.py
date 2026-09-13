from pathlib import Path

agenda = Path('agenda.js')
s = agenda.read_text(encoding='utf-8')

old = '''function metaDoServico(s) {
  if (s.produto) return "Produto personalizado";
  if (s.horaLivre) return "Horário a combinar";
  return resumoPreco(s.chave);
}
function montarServicos() {
  el.servicos.innerHTML="";
  CATALOGO.filter(s=>s.grupo===st.grupo).forEach(s=>{
    const b=document.createElement("button");
    b.type="button"; b.className="bk-servico"; b.dataset.chave=s.chave; b.setAttribute("role","radio"); b.setAttribute("aria-checked", st.servico===s.chave ? "true" : "false");
    b.innerHTML='<span class="bk-servico-txt"><strong>'+esc(s.nome)+'</strong><em>'+esc(metaDoServico(s))+'</em></span><span class="bk-servico-preco">'+esc(resumoPreco(s.chave))+'</span>';
    if(st.servico===s.chave) b.classList.add("selecionado");
    b.addEventListener("click",()=>{ st.servico=s.chave; st.pacote=null; st.data=null; st.hora=null; st.looks=10; montarServicos(); montarPacotes(); atualizar(); seguir(); });
    el.servicos.appendChild(b);
  });
}
'''

new = '''const DESCRICOES_SERVICOS = {
  gestante: "Estúdio ou ensaio externo",
  abc: "Sessão no estúdio",
  formatura: "Sessão no estúdio",
  "cha-revelacao": "Estúdio ou ensaio externo",
  "acompanhamento-mensal": "Sessão no estúdio",
  corporativa: "Sessão no estúdio",
  moda: "Produção fotográfica por look",
  "pre-wedding": "Ensaio externo",
  casamento: "Cobertura de evento",
  aniversario: "Evento ou sessão em estúdio",
  batizado: "Cobertura de evento"
};
function metaDoServico(s) {
  if (s.produto) return "Produto personalizado";
  return DESCRICOES_SERVICOS[s.chave] || (s.horaLivre ? "Horário a combinar" : "Atendimento personalizado");
}

const capaServicoCache = new Map();
async function capaVisualDoServico(chave) {
  if (capaServicoCache.has(chave)) return capaServicoCache.get(chave);
  let src = "";
  try {
    if (typeof window.midiasDoPainel === "function") {
      const remoto = await window.midiasDoPainel(chave);
      const itens = remoto && remoto.ok && Array.isArray(remoto.items) ? remoto.items : [];
      const capa = itens.find(item => item && item.type !== "video" && item.is_cover) || itens.find(item => item && item.type !== "video");
      if (capa && capa.url) src = capa.url;
    }
  } catch (_) {}
  if (!src) {
    const numero = typeof window.capaDoServico === "function" ? window.capaDoServico(chave) : 1;
    const fallback = "assets/galeria/" + chave + "-" + numero + ".jpg";
    try {
      src = typeof window.testarFoto === "function" ? (await window.testarFoto(fallback) || "") : fallback;
    } catch (_) {}
  }
  capaServicoCache.set(chave, src || "");
  return src || "";
}
function carregarFotoServico(botao, chave) {
  capaVisualDoServico(chave).then(src => {
    if (!botao.isConnected || botao.dataset.chave !== chave) return;
    const moldura = botao.querySelector(".bk-servico-media");
    const img = botao.querySelector(".bk-servico-foto");
    if (!moldura || !img) return;
    if (!src) {
      moldura.hidden = true;
      botao.classList.remove("com-foto");
      return;
    }
    img.src = src;
    img.hidden = false;
    botao.classList.add("com-foto");
  });
}
function montarServicos() {
  el.servicos.innerHTML="";
  CATALOGO.filter(s=>s.grupo===st.grupo).forEach(s=>{
    const b=document.createElement("button");
    const esperaFoto=s.grupo!=="produtos";
    b.type="button"; b.className="bk-servico"+(esperaFoto?" com-foto":""); b.dataset.chave=s.chave; b.setAttribute("role","radio"); b.setAttribute("aria-checked", st.servico===s.chave ? "true" : "false");
    const media=esperaFoto?'<span class="bk-servico-media" aria-hidden="true"><img class="bk-servico-foto" alt="" loading="lazy" decoding="async" hidden></span>':"";
    b.innerHTML=media+'<span class="bk-servico-texto"><span class="bk-servico-linha"><span class="bk-servico-nome">'+esc(s.nome)+'</span><span class="bk-servico-preco">'+esc(resumoPreco(s.chave))+'</span></span><span class="bk-servico-meta">'+esc(metaDoServico(s))+'</span></span>';
    if(st.servico===s.chave) b.classList.add("selecionado");
    b.addEventListener("click",()=>{ st.servico=s.chave; st.pacote=null; st.data=null; st.hora=null; st.looks=10; montarServicos(); montarPacotes(); atualizar(); seguir(); });
    el.servicos.appendChild(b);
    if(esperaFoto) carregarFotoServico(b,s.chave);
  });
}
'''

if old not in s:
    raise SystemExit('Bloco atual de serviços não encontrado em agenda.js')
s = s.replace(old, new, 1)
agenda.write_text(s, encoding='utf-8')

css_path = Path('styles.css')
css = css_path.read_text(encoding='utf-8')
marker = '/* ---------- AGENDAMENTO · CARDS DE SERVIÇO E ALTURA NATURAL ---------- */'
if marker not in css:
    css += r'''

/* ---------- AGENDAMENTO · CARDS DE SERVIÇO E ALTURA NATURAL ---------- */
/* A etapa acompanha o conteúdo real: nenhuma altura antiga/inline pode abrir
   uma faixa vazia entre o progresso, os cartões e a navegação. */
.booking-panel{
  height:auto !important;
  min-height:0 !important;
}
.bk-corpo{
  height:auto !important;
  min-height:0 !important;
}
.bk-etapa{
  height:auto !important;
  min-height:0 !important;
}
.bk-progresso{ margin-bottom:20px; }
.bk-etapa > .booking-label{ margin-bottom:14px; }
.bk-nav{ margin-top:20px; padding-top:16px; }

/* Cards com fotografia: a capa configurada no painel/Neon entra à esquerda;
   nome, contexto e investimento têm linhas próprias para nunca se sobrepor. */
.bk-servicos{ gap:12px; }
.bk-servico{
  align-items:center;
  gap:0;
  min-width:0;
  padding:11px 13px;
  border-radius:14px;
}
.bk-servico.com-foto{
  grid-template-columns:78px minmax(0,1fr);
  column-gap:14px;
}
.bk-servico-media{
  grid-column:1;
  grid-row:1;
  width:78px;
  height:70px;
  overflow:hidden;
  border:1px solid rgba(201,162,75,.14);
  border-radius:11px;
  background:
    radial-gradient(circle at 30% 20%,rgba(201,162,75,.11),transparent 55%),
    rgba(10,9,8,.55);
}
.bk-servico-foto{
  display:block;
  width:100%;
  height:100%;
  object-fit:cover;
  object-position:center 35%;
  border-radius:0;
  filter:brightness(.78) saturate(.72);
  transition:filter .3s ease, transform .45s cubic-bezier(.16,.84,.44,1);
}
.bk-servico:hover .bk-servico-foto,
.bk-servico.selecionado .bk-servico-foto{
  filter:brightness(.94) saturate(.9);
  transform:scale(1.035);
}
.bk-servico-texto{
  grid-column:1;
  min-width:0;
  display:flex;
  flex-direction:column;
  gap:6px;
}
.bk-servico.com-foto .bk-servico-texto{ grid-column:2; }
.bk-servico-linha{
  min-width:0;
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:14px;
}
.bk-servico-nome{
  min-width:0;
  color:var(--cream);
  font-family:'Cormorant Garamond',serif;
  font-size:1.12rem;
  font-weight:500;
  line-height:1.18;
}
.bk-servico-preco{
  grid-row:auto;
  grid-column:auto;
  flex:0 0 auto;
  max-width:48%;
  color:var(--gold-light);
  font-size:.8rem;
  font-weight:500;
  line-height:1.35;
  text-align:right;
  white-space:normal;
}
.bk-servico-meta{
  grid-column:auto;
  color:#887d6b;
  font-size:.7rem;
  line-height:1.35;
  letter-spacing:.035em;
}

@media(max-width:759px){
  .bk-servicos{ grid-template-columns:1fr; }
  .bk-servicos > .bk-servico:last-child:nth-child(odd){
    width:100%;
    grid-column:auto;
  }
}
@media(max-width:520px){
  .bk-servico.com-foto{
    grid-template-columns:70px minmax(0,1fr);
    column-gap:12px;
  }
  .bk-servico-media{ width:70px; height:66px; }
  .bk-servico-linha{
    flex-direction:column;
    gap:3px;
  }
  .bk-servico-preco{
    max-width:none;
    text-align:left;
    font-size:.78rem;
  }
}
@media(prefers-reduced-motion:reduce){
  .bk-servico-foto{ transition:none; }
  .bk-servico:hover .bk-servico-foto,
  .bk-servico.selecionado .bk-servico-foto{ transform:none; }
}
'''
    css_path.write_text(css, encoding='utf-8')
