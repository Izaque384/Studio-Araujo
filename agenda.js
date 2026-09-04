// Assistente de agendamento do Studio Araújo
// Mantém todo o estado isolado para não conflitar com script.js.
(function () {
"use strict";

const WHATSAPP = "5588981886579";
const AGENDA_API_URL = "https://script.google.com/macros/s/AKfycby94ybiNzs_9MsHRufebeOQiPOF7icz4ZMw7aUJxXSUc321viw6UcKMbRx5c-rZ4Qhh/exec";
const JANELAS = [["09:00", "11:00"], ["14:00", "18:00"]];
const PASSO = 30;
const MIN_DIAS = 1;
const MEM_CHAVE = "sa-agendamento";
const MEM_VALIDADE = 12 * 60 * 60 * 1000;

const GRUPOS = [
  { id: "estudio", titulo: "Sessão no estúdio", desc: "Cenário montado, luz e direção de poses" },
  { id: "externa", titulo: "Ensaio externo", desc: "Ao ar livre, em locação combinada" },
  { id: "evento", titulo: "Evento", desc: "Cobertura de casamento, festa ou celebração" },
  { id: "produtos", titulo: "Álbuns e produtos", desc: "Álbum, luva, maleta e caixa para fotos" }
];

// As durações abaixo foram preservadas de propósito. Ajustes de duração do
// catálogo comercial ficam fora desta correção.
const CATALOGO = [
  { chave: "ensaio-casal", nome: "Ensaio de Casal", grupo: "estudio", duracao: 60 },
  { chave: "gestante", nome: "Gestante", grupo: "estudio", duracao: 60 },
  { chave: "abc", nome: "ABC", grupo: "estudio", duracao: 45 },
  { chave: "formatura", nome: "Formatura", grupo: "estudio", duracao: 45 },
  { chave: "cha-revelacao", nome: "Chá Revelação", grupo: "estudio", duracao: 60 },
  { chave: "acompanhamento-mensal", nome: "Acompanhamento Mensal", grupo: "estudio", duracao: 30 },
  { chave: "corporativa", nome: "Sessão Corporativa", grupo: "estudio", duracao: 60 },
  { chave: "moda", nome: "Moda", grupo: "estudio", duracao: 120 },
  { chave: "pre-wedding", nome: "Pré-Wedding", grupo: "externa", duracao: 120, local: true },
  { chave: "casamento", nome: "Casamento", grupo: "evento", horaLivre: true, local: true },
  { chave: "aniversario", nome: "Aniversário", grupo: "evento", horaLivre: true, local: true },
  { chave: "batizado", nome: "Batizado", grupo: "evento", horaLivre: true, local: true },
  { chave: "albuns", nome: "Álbum Fotográfico", grupo: "produtos", produto: true },
  { chave: "luva", nome: "Luva / Estojo", grupo: "produtos", produto: true },
  { chave: "maleta", nome: "Maleta / Estojo", grupo: "produtos", produto: true },
  { chave: "caixa", nome: "Caixa para Fotos", grupo: "produtos", produto: true }
];

const $ = (id) => document.getElementById(id);
const el = {
  barra: $("bkBarra"), passoNum: $("bkPassoNum"), passoNome: $("bkPassoNome"),
  tipos: $("bkTipos"), servicos: $("bkServicos"), pacotes: $("bkPacotes"),
  mesNome: $("bkMesNome"), dias: $("bkDias"), slots: $("bkSlots"), slotHint: $("bkSlotHint"),
  horaBloco: $("bkHorarioBloco"), combinar: $("bkCombinarHint"),
  nome: $("bkName"), fone: $("bkFone"), local: $("bkLocal"), localBloco: $("bkLocalBloco"), nota: $("bkNote"),
  revisao: $("bkRevisao"), sinal: $("bkSinal"), voltar: $("bkVoltar"), enviar: $("bkEnviar"),
  escolhidoNome: $("bkEscolhidoNome"), escolhidoMeta: $("bkEscolhidoMeta"), pacotesLabel: $("bkPacotesLabel"), trocar: $("bkTrocar")
};

const NOMES = ["Tipo de atendimento", "Serviço", "Pacote", "Data e horário", "Seus dados", "Revisão"];
const TOTAL = 6;
const busyDays = new Set();
const busyIntervals = [];
let agendaCarregada = false;
let agendaFalhou = false;
let etapa = 1;
let mesVisivel = new Date();
mesVisivel.setDate(1);
let memPronta = false;
let travaAuto = false;

const st = { grupo: null, servico: null, pacote: null, data: null, hora: null, looks: 10 };

function esc(s) { return String(s == null ? "" : s).replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;"}[c])); }
const pad = (n) => String(n).padStart(2, "0");
const iso = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const doISO = (s) => { const [y,m,d] = String(s).split("-").map(Number); return new Date(y,m-1,d); };
const servicoAtual = () => CATALOGO.find(s => s.chave === st.servico) || null;
const ehProduto = () => !!(servicoAtual() && servicoAtual().produto);

function opcoesDe(chave) {
  const d = typeof servicePackages !== "undefined" ? servicePackages[chave] : null;
  if (!d) return null;
  if (d.options) return d.options.map(o => ({ name:o.name, price:o.price, items:o.items || [], unico:false }));
  if (d.price) return [{ name:"Investimento", price:d.price, items:d.items || [], unico:true }];
  return null;
}
function precoNumero(txt) {
  const m = String(txt || "").match(/([\d.]+),(\d{2})/);
  return m ? parseFloat(m[1].replace(/\./g, "") + "." + m[2]) : null;
}
function fmtPreco(v) { return "R$ " + v.toLocaleString("pt-BR", {minimumFractionDigits:2}); }
function resumoPreco(chave) {
  const opts = opcoesDe(chave);
  if (!opts || !opts.length) return "Sob consulta";
  const vals = opts.map(o => precoNumero(o.price)).filter(v => v !== null);
  if (!vals.length) return opts[0].price || "Sob consulta";
  return vals.length > 1 ? "a partir de " + fmtPreco(Math.min(...vals)) : opts[0].price;
}

// Pacotes podem alterar a natureza do atendimento sem alterar o catálogo visual.
function pacoteEh(nome) { return !!(st.pacote && st.pacote.name === nome); }
function gestanteExterna() { return st.servico === "gestante" && pacoteEh("Opção 3 — Ensaio Externo"); }
function aniversarioEstudio() { return st.servico === "aniversario" && pacoteEh("Sessão Feminina em Estúdio"); }
function chaExterno() { return st.servico === "cha-revelacao" && pacoteEh("Opção 3 — Externo"); }
function usaHorario() {
  const s = servicoAtual();
  if (!s || ehProduto()) return false;
  if (gestanteExterna() || chaExterno()) return false;
  if (aniversarioEstudio()) return true;
  return !s.horaLivre;
}
function precisaLocal() {
  const s = servicoAtual();
  if (!s || ehProduto()) return false;
  if (aniversarioEstudio()) return false;
  return !!s.local || gestanteExterna() || chaExterno();
}
function duracao() { const s = servicoAtual(); return (s && s.duracao) || 60; }

function pacoteCanonico(p) {
  if (!p || !st.servico) return null;
  const opts = opcoesDe(st.servico) || [];
  return opts.find(o => o.name === p.name) || (p.unico && opts.length === 1 ? opts[0] : null);
}

function memGravar() {
  if (!memPronta) return;
  try { localStorage.setItem(MEM_CHAVE, JSON.stringify({quando:Date.now(), etapa, st, nome:el.nome.value, fone:el.fone.value, local:el.local.value, nota:el.nota.value})); } catch (_) {}
}
function memLimpar() { try { localStorage.removeItem(MEM_CHAVE); } catch (_) {} }
function memLer() {
  try {
    const m = JSON.parse(localStorage.getItem(MEM_CHAVE) || "null");
    if (!m || Date.now() - m.quando > MEM_VALIDADE) { memLimpar(); return null; }
    return m;
  } catch (_) { return null; }
}

const ICONES = {
  estudio:'<path d="M14 5.5h12l3 7H11l3-7Z"/><path d="M11 12.5h18M20 12.5v9M20 21.5 13 34M20 21.5 27 34"/>',
  externa:'<circle cx="27" cy="12" r="4"/><path d="M6 27l7-8 5.5 6.5L24 18l10 9M5 32h30"/>',
  evento:'<path d="M13 7h14l-1.5 7a5.5 5.5 0 0 1-11 0L13 7ZM20 20v9M15 33h10"/>',
  produtos:'<rect x="8" y="8" width="24" height="25" rx="2.5"/><path d="M14 8v25M19 17.5l4.5 5 3-3L31 24"/>'
};
function icone(id) { return '<span class="bk-tipo-icone" aria-hidden="true"><svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">'+(ICONES[id]||"")+'</svg></span>'; }

function montarTipos() {
  el.tipos.innerHTML = "";
  GRUPOS.forEach(g => {
    const b = document.createElement("button");
    b.type="button"; b.className="bk-tipo"; b.dataset.grupo=g.id; b.setAttribute("role","radio");
    b.innerHTML = icone(g.id)+'<span class="bk-tipo-txt"><strong>'+esc(g.titulo)+'</strong><em>'+esc(g.desc)+'</em></span>';
    b.addEventListener("click", () => {
      st.grupo=g.id; st.servico=null; st.pacote=null; st.data=null; st.hora=null; st.looks=10;
      montarTipos(); montarServicos(); atualizar(); seguir();
    });
    if (st.grupo===g.id) { b.classList.add("selecionado"); b.setAttribute("aria-checked","true"); }
    el.tipos.appendChild(b);
  });
}

function metaDoServico(s) {
  if (s.produto) return "Produto personalizado";
  if (s.horaLivre) return "Horário a combinar";
  return resumoPreco(s.chave);
}
function montarServicos() {
  el.servicos.innerHTML="";
  CATALOGO.filter(s=>s.grupo===st.grupo).forEach(s=>{
    const b=document.createElement("button");
    b.type="button"; b.className="bk-servico"; b.dataset.chave=s.chave; b.setAttribute("role","radio");
    b.innerHTML='<span class="bk-servico-txt"><strong>'+esc(s.nome)+'</strong><em>'+esc(metaDoServico(s))+'</em></span><span class="bk-servico-preco">'+esc(resumoPreco(s.chave))+'</span>';
    if(st.servico===s.chave) b.classList.add("selecionado");
    b.addEventListener("click",()=>{ st.servico=s.chave; st.pacote=null; st.data=null; st.hora=null; st.looks=10; montarServicos(); montarPacotes(); atualizar(); seguir(); });
    el.servicos.appendChild(b);
  });
}

function montarPacotes() {
  const s=servicoAtual(); if(!s) return;
  el.escolhidoNome.textContent=s.nome; el.escolhidoMeta.textContent=metaDoServico(s);
  el.pacotes.innerHTML="";
  const opts=opcoesDe(st.servico) || [{name:"Valor a combinar",price:"Sob consulta",items:[],unico:true}];
  el.pacotesLabel.textContent=opts.length>1?"Escolha o pacote":"Confira o que está incluso";
  opts.forEach(o=>{
    const b=document.createElement("button"); b.type="button"; b.className="bk-pacote";
    b.innerHTML='<div class="bk-pacote-topo"><span>'+esc(o.name)+'</span><b>'+esc(o.price)+'</b></div>'+(o.items.length?'<ul>'+o.items.map(i=>'<li>'+esc(i)+'</li>').join("")+'</ul>':"")+'<span class="bk-pacote-cta">Escolher</span>';
    if(st.pacote && st.pacote.name===o.name) b.classList.add("selecionado");
    b.addEventListener("click",()=>{ st.pacote=o; st.data=null; st.hora=null; montarPacotes(); atualizar(); if(ehProduto()) mostrarEtapa(5); else seguir(); });
    el.pacotes.appendChild(b);
  });
}

function minutos(h){const [a,b]=h.split(":").map(Number);return a*60+b;}
function hhmm(m){return pad(Math.floor(m/60))+":"+pad(m%60);}
function horariosDoServico(){const out=[];JANELAS.forEach(([i,f])=>{for(let t=minutos(i);t+duracao()<=minutos(f);t+=PASSO)out.push(hhmm(t));});return out;}
function ocupado(dataISO,hora){
  const d=doISO(dataISO), [h,m]=hora.split(":").map(Number);
  const ini=new Date(d.getFullYear(),d.getMonth(),d.getDate(),h,m).getTime(), fim=ini+duracao()*60000;
  return busyIntervals.some(([s,e])=>s<fim&&e>ini);
}
function primeiraDataValida(){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+MIN_DIAS);return d;}
function diaDisponivel(d){
  if(d<primeiraDataValida()||d.getDay()===0||busyDays.has(iso(d)))return false;
  if(usaHorario() && !agendaCarregada && !agendaFalhou)return false;
  return !usaHorario() || horariosDoServico().some(h=>!ocupado(iso(d),h));
}
function validarEscolhaAgenda(){
  if(ehProduto()) return true;
  if(!st.data || doISO(st.data)<primeiraDataValida() || doISO(st.data).getDay()===0 || busyDays.has(st.data)){st.data=null;st.hora=null;return false;}
  if(usaHorario()){
    if(!agendaCarregada && !agendaFalhou) return false;
    if(!st.hora || !horariosDoServico().includes(st.hora) || ocupado(st.data,st.hora)){st.hora=null;return false;}
  }
  return true;
}
function primeiroDiaLivre(){const d=primeiraDataValida();for(let i=0;i<180;i++){if(diaDisponivel(d))return new Date(d);d.setDate(d.getDate()+1);}return null;}
function irParaMesComVaga(){if(st.data){mesVisivel=doISO(st.data);mesVisivel.setDate(1);return;}const d=primeiroDiaLivre();if(d)mesVisivel=new Date(d.getFullYear(),d.getMonth(),1);}
function montarCalendario(){
  const ano=mesVisivel.getFullYear(), mes=mesVisivel.getMonth(); el.mesNome.textContent=mesVisivel.toLocaleDateString("pt-BR",{month:"long",year:"numeric"}); el.dias.innerHTML="";
  const primeiro=new Date(ano,mes,1); for(let i=0;i<primeiro.getDay();i++){const v=document.createElement("span");v.className="bk-dia vazio";el.dias.appendChild(v);}
  const total=new Date(ano,mes+1,0).getDate();
  for(let n=1;n<=total;n++){
    const d=new Date(ano,mes,n), b=document.createElement("button"), ok=diaDisponivel(d); b.type="button";b.className="bk-dia";b.textContent=n;b.disabled=!ok;
    if(!ok)b.classList.add("indisponivel");if(st.data===iso(d))b.classList.add("selecionado");
    b.addEventListener("click",()=>{st.data=iso(d);st.hora=null;montarCalendario();montarSlots();atualizar();if(!usaHorario())seguir();}); el.dias.appendChild(b);
  }
  const lim=new Date();lim.setDate(1);$("bkMesAnt").disabled=mesVisivel<=lim;
}
function montarSlots(){
  el.slots.innerHTML=""; el.slotHint.classList.toggle("aviso",agendaFalhou);
  if(!usaHorario())return;
  if(!agendaCarregada&&!agendaFalhou){el.slotHint.textContent="Verificando a agenda… Os horários serão liberados assim que a consulta terminar.";return;}
  if(!st.data){el.slotHint.textContent="Escolha primeiro o dia.";return;}
  const livres=horariosDoServico().filter(h=>!ocupado(st.data,h));
  if(!livres.length){el.slotHint.textContent="Não há horário livre neste dia.";return;}
  el.slotHint.textContent=agendaFalhou?"Não conseguimos consultar a agenda agora — estes horários precisam ser confirmados pelo WhatsApp.":"Agenda sincronizada: horários ocupados não aparecem.";
  livres.forEach(h=>{const b=document.createElement("button");b.type="button";b.className="slot";b.textContent=h;if(st.hora===h)b.classList.add("selected");b.addEventListener("click",()=>{st.hora=h;montarSlots();atualizar();seguir();});el.slots.appendChild(b);});
}

function garantirCampoLooks(){
  let bloco=$("bkLooksBloco");
  if(!bloco){
    bloco=document.createElement("div");bloco.id="bkLooksBloco";bloco.className="booking-step";
    bloco.innerHTML='<label class="booking-label" for="bkLooks">Quantidade de looks</label><input type="number" id="bkLooks" class="booking-input" min="10" step="1" inputmode="numeric" value="10"><p class="booking-hint">Mínimo de 10 looks · R$ 25,00 por look.</p>';
    el.localBloco.parentNode.insertBefore(bloco,el.localBloco);
    $("bkLooks").addEventListener("input",()=>{st.looks=Math.max(0,parseInt($("bkLooks").value,10)||0);atualizar();memGravar();});
  }
  bloco.hidden=st.servico!=="moda";
  if(st.servico==="moda") $("bkLooks").value=st.looks || 10;
}
function foneValido(){return el.fone.value.replace(/\D/g,"").length>=10;}
function etapaCompleta(n){
  if(n===1)return !!st.grupo;if(n===2)return !!st.servico;if(n===3)return !!st.pacote;
  if(n===4)return ehProduto() || (!!st.data && (!usaHorario() || !!st.hora) && validarEscolhaAgenda());
  if(n===5)return el.nome.value.trim().length>=2&&foneValido()&&(!precisaLocal()||el.local.value.trim().length>=3)&&(st.servico!=="moda"||st.looks>=10);
  return true;
}
function dataPorExtenso(){return st.data?doISO(st.data).toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long",year:"numeric"}):"—";}
function valorAtual(){if(st.servico==="moda")return fmtPreco(Math.max(10,st.looks||10)*25);return st.pacote?st.pacote.price:"a combinar";}

function montarRevisao(){
  const s=servicoAtual(); if(!s)return;
  let html='<div class="rev-topo"><div class="rev-topo-txt"><span class="rev-k">'+(ehProduto()?"Seu produto":"Sua sessão")+'</span><strong class="rev-servico">'+esc(s.nome)+'</strong>'+(st.pacote&&!st.pacote.unico?'<span class="rev-pacote">'+esc(st.pacote.name)+'</span>':"")+'</div><div class="rev-valor"><span class="rev-k">Investimento</span><strong>'+esc(valorAtual())+'</strong></div></div>';
  if(!ehProduto()) html+='<div class="rev-bloco rev-quando"><div class="rev-item"><div><span class="rev-k">Data</span><span class="rev-v">'+esc(dataPorExtenso())+'</span></div></div><div class="rev-item"><div><span class="rev-k">Horário</span><span class="rev-v">'+esc(usaHorario()?st.hora:"a combinar")+'</span></div></div></div>';
  html+='<div class="rev-bloco"><div class="rev-item"><div><span class="rev-k">Nome</span><span class="rev-v">'+esc(el.nome.value.trim())+'</span></div></div><div class="rev-item"><div><span class="rev-k">WhatsApp</span><span class="rev-v">'+esc(el.fone.value.trim())+'</span></div></div>';
  if(st.servico==="moda")html+='<div class="rev-item"><div><span class="rev-k">Looks</span><span class="rev-v">'+esc(st.looks)+'</span></div></div>';
  if(precisaLocal()&&el.local.value.trim())html+='<div class="rev-item largo"><div><span class="rev-k">Local</span><span class="rev-v">'+esc(el.local.value.trim())+'</span></div></div>';
  if(el.nota.value.trim())html+='<div class="rev-item largo"><div><span class="rev-k">Observação</span><span class="rev-v">'+esc(el.nota.value.trim())+'</span></div></div>';
  html+='</div>'; el.revisao.innerHTML=html;
  const txt=st.pacote&&st.pacote.items?st.pacote.items.join(" "):"";const m=txt.match(/entrada de (R\$ ?[\d.,]+)/i)||(/50%\s*na reserva/i.test(txt)?["","50% na reserva"]:null);
  if(m){el.sinal.hidden=false;el.sinal.textContent="Reserva da data: "+m[1]+". Combinamos a forma de pagamento pelo WhatsApp.";}else el.sinal.hidden=true;
}

function atualizar(){el.enviar.disabled=!etapaCompleta(etapa);memGravar();}
function mostrarEtapa(n){
  // Produtos não passam pelo calendário.
  if(ehProduto()&&n===4)n=5;
  etapa=n; document.querySelectorAll(".bk-etapa").forEach(s=>s.hidden=Number(s.dataset.etapa)!==n);
  el.barra.style.width=(n/TOTAL*100)+"%";el.passoNum.textContent="Etapa "+n+" de "+TOTAL;el.passoNome.textContent=NOMES[n-1];
  el.voltar.hidden=n===1;el.enviar.hidden=n<5;el.enviar.textContent=n===TOTAL?"Enviar no WhatsApp":"Continuar";
  const nav=document.querySelector(".bk-nav");if(nav)nav.hidden=el.voltar.hidden&&el.enviar.hidden;
  if(n===3)montarPacotes();
  if(n===4){el.horaBloco.hidden=!usaHorario();el.combinar.hidden=usaHorario();irParaMesComVaga();montarCalendario();montarSlots();}
  if(n===5){garantirCampoLooks();el.localBloco.hidden=!precisaLocal();}
  if(n===TOTAL)montarRevisao(); atualizar();
}
function seguir(){if(travaAuto)return;setTimeout(()=>{if(etapaCompleta(etapa)&&etapa<TOTAL)mostrarEtapa(ehProduto()&&etapa===3?5:etapa+1);},220);}

function montarLinkWhatsApp(){
  const s=servicoAtual(), linhas=["Olá, Studio Araújo! 😊",ehProduto()?"Gostaria de solicitar um produto. 📸":"Gostaria de agendar uma sessão. 📸","• Serviço: "+s.nome];
  if(st.pacote&&!st.pacote.unico)linhas.push("• Pacote: "+st.pacote.name);
  if(st.servico==="moda")linhas.push("• Quantidade de looks: "+st.looks);
  linhas.push("• Valor: "+valorAtual());
  if(!ehProduto()){linhas.push("• Data: "+dataPorExtenso());linhas.push("• Horário: "+(usaHorario()?st.hora:"a combinar"));}
  linhas.push("• Nome: "+el.nome.value.trim(),"• WhatsApp: "+el.fone.value.trim());
  if(precisaLocal()&&el.local.value.trim())linhas.push("• Local: "+el.local.value.trim());
  if(el.nota.value.trim())linhas.push("• Observação: "+el.nota.value.trim());
  linhas.push("Aguardo a confirmação. Obrigado(a)!");
  return "https://wa.me/"+WHATSAPP+"?text="+encodeURIComponent(linhas.join("\n"));
}
function telaFinal(link){
  const painel=$("bkPanel"), corpo=painel.querySelector(".bk-corpo")||painel;document.querySelectorAll(".bk-etapa").forEach(s=>s.hidden=true);const nav=painel.querySelector(".bk-nav");if(nav)nav.hidden=true;const prog=painel.querySelector(".bk-progresso");if(prog)prog.hidden=true;
  let box=$("bkFinal");if(!box){box=document.createElement("div");box.id="bkFinal";box.className="bk-final";box.innerHTML='<h3>Pedido montado!</h3><p id="bkFinalTexto">Abrimos o WhatsApp com todos os detalhes preenchidos. <strong>É só tocar em enviar</strong> para a mensagem chegar até nós.</p><div class="bk-final-acoes"><a id="bkFinalLink" class="btn btn-solid" target="_blank" rel="noopener">Não abriu? Abrir o WhatsApp</a><button type="button" id="bkFinalNovo" class="btn btn-outline">Fazer outro agendamento</button></div>';corpo.appendChild(box);$("bkFinalNovo").addEventListener("click",()=>{memLimpar();window.location.href=window.location.pathname;});}$("bkFinalLink").href=link;box.hidden=false;
}
function enviar(){
  // Revalida no último instante. Se a agenda ainda está carregando ou o horário
  // ficou ocupado, o cliente volta ao calendário em vez de enviar dado obsoleto.
  if(!ehProduto() && !validarEscolhaAgenda()){mostrarEtapa(4);el.slotHint.textContent=agendaCarregada?"Esse horário não está mais disponível. Escolha outro.":"Aguarde a verificação da agenda antes de continuar.";el.slotHint.classList.add("aviso");return;}
  const link=montarLinkWhatsApp(),aba=window.open(link,"_blank","noopener");telaFinal(link);if(!aba){const t=$("bkFinalTexto");if(t)t.innerHTML='Seu pedido está pronto. O navegador bloqueou a abertura automática — <strong>toque no botão abaixo</strong> para abrir o WhatsApp.';}memLimpar();
}

$("bkMesAnt").addEventListener("click",()=>{mesVisivel.setMonth(mesVisivel.getMonth()-1);montarCalendario();});
$("bkMesProx").addEventListener("click",()=>{mesVisivel.setMonth(mesVisivel.getMonth()+1);montarCalendario();});
el.trocar.addEventListener("click",()=>mostrarEtapa(2));
el.voltar.addEventListener("click",()=>{if(etapa===5&&ehProduto())mostrarEtapa(3);else if(etapa>1)mostrarEtapa(etapa-1);});
el.enviar.addEventListener("click",()=>{if(el.enviar.disabled)return;if(etapa<TOTAL)mostrarEtapa(etapa+1);else enviar();});
el.fone.addEventListener("input",()=>{let v=el.fone.value.replace(/\D/g,"").slice(0,11);if(v.length>6)v="("+v.slice(0,2)+") "+v.slice(2,7)+"-"+v.slice(7);else if(v.length>2)v="("+v.slice(0,2)+") "+v.slice(2);else if(v.length)v="("+v;el.fone.value=v;atualizar();});
[el.nome,el.local,el.nota].forEach(x=>x.addEventListener("input",atualizar));

montarTipos();
(function retomar(){
  const chave=new URLSearchParams(location.search).get("servico"),m=memLer();memPronta=true;
  if(chave)return;
  if(!m||!m.st)return;
  st.grupo=m.st.grupo||null;st.servico=m.st.servico||null;st.pacote=pacoteCanonico.call(null,m.st.pacote);st.data=m.st.data||null;st.hora=m.st.hora||null;st.looks=Math.max(10,parseInt(m.st.looks,10)||10);
  // pacoteCanonico depende do serviço já restaurado.
  st.pacote=pacoteCanonico(m.st.pacote);
  el.nome.value=m.nome||"";el.fone.value=m.fone||"";el.local.value=m.local||"";el.nota.value=m.nota||"";
  if(st.data&&doISO(st.data)<primeiraDataValida()){st.data=null;st.hora=null;}
  montarTipos();montarServicos();
  let destino=Math.min(Number(m.etapa)||1,TOTAL);if(ehProduto()&&destino===4)destino=5;etapa=destino;
})();
(function preselect(){const chave=new URLSearchParams(location.search).get("servico"),s=CATALOGO.find(x=>x.chave===chave);if(!s)return;st.grupo=s.grupo;st.servico=s.chave;montarTipos();montarServicos();montarPacotes();etapa=3;})();
mostrarEtapa(etapa);

if(AGENDA_API_URL){
  fetch(AGENDA_API_URL+(AGENDA_API_URL.includes("?")?"&":"?")+"cb="+Date.now())
    .then(r=>r.ok?r.json():Promise.reject(new Error("HTTP "+r.status)))
    .then(events=>{
      if(!Array.isArray(events))throw new Error("formato inesperado");
      events.forEach(ev=>{if(ev.d){for(let t=ev.s;t<ev.e;t+=86400000)busyDays.add(iso(new Date(t)));}else busyIntervals.push([ev.s,ev.e]);});
      agendaCarregada=true;
      // Revalida estado restaurado mesmo que o usuário já tenha avançado.
      const tinhaData=!!st.data,tinhaHora=!!st.hora;validarEscolhaAgenda();
      if((tinhaData&&!st.data)||(tinhaHora&&!st.hora)){if(!ehProduto())mostrarEtapa(4);}
      else if(etapa===4){irParaMesComVaga();montarCalendario();montarSlots();}
      atualizar();
    })
    .catch(()=>{agendaFalhou=true;if(etapa===4){montarCalendario();montarSlots();}atualizar();});
}

})();