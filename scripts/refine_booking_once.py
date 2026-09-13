from pathlib import Path

# 1) Centraliza os metadados operacionais no mesmo arquivo comercial usado por Serviços.
data_path = Path('dados-servicos.js')
data = data_path.read_text(encoding='utf-8')
marker = '// ---------- CATÁLOGO OPERACIONAL DO AGENDAMENTO ----------'
if marker not in data:
    data += r'''

// ---------- CATÁLOGO OPERACIONAL DO AGENDAMENTO ----------
// A existência do serviço vem de servicePackages. Se um serviço for removido
// do catálogo comercial, ele deixa automaticamente de aparecer no agendamento.
// As durações abaixo são bloqueios operacionais da agenda e são intencionais.
const bookingGroups = [
  { id: "estudio", titulo: "Sessão no estúdio", desc: "Cenário montado, luz e direção de poses" },
  { id: "externa", titulo: "Ensaio externo", desc: "Ao ar livre, em locação combinada" },
  { id: "evento", titulo: "Evento", desc: "Cobertura de casamento, festa ou celebração" },
  { id: "produtos", titulo: "Álbuns e produtos", desc: "Álbum, luva, maleta e caixa para fotos" }
];

const serviceBookingMeta = {
  gestante: { nome: "Gestante", grupo: "estudio", duracao: 60 },
  abc: { nome: "ABC", grupo: "estudio", duracao: 45 },
  formatura: { nome: "Formatura", grupo: "estudio", duracao: 45 },
  "cha-revelacao": { nome: "Chá Revelação", grupo: "estudio", duracao: 60 },
  "acompanhamento-mensal": { nome: "Acompanhamento Mensal", grupo: "estudio", duracao: 30 },
  corporativa: { nome: "Sessão Corporativa", grupo: "estudio", duracao: 60 },
  moda: { nome: "Moda", grupo: "estudio", duracao: 120 },
  "pre-wedding": { nome: "Pré-Wedding", grupo: "externa", duracao: 120, local: true },
  casamento: { nome: "Casamento", grupo: "evento", horaLivre: true, local: true },
  aniversario: { nome: "Aniversário", grupo: "evento", horaLivre: true, local: true },
  batizado: { nome: "Batizado", grupo: "evento", horaLivre: true, local: true },
  albuns: { nome: "Álbum Fotográfico", grupo: "produtos", produto: true },
  luva: { nome: "Luva / Estojo", grupo: "produtos", produto: true },
  maleta: { nome: "Maleta / Estojo", grupo: "produtos", produto: true },
  caixa: { nome: "Caixa para Fotos", grupo: "produtos", produto: true }
};

const bookingCatalog = Object.entries(serviceBookingMeta)
  .filter(([chave]) => Object.prototype.hasOwnProperty.call(servicePackages, chave))
  .map(([chave, meta]) => ({ chave, ...meta }));
'''
    data_path.write_text(data, encoding='utf-8')

# 2) Refina lógica, fallback e acessibilidade do assistente.
agenda_path = Path('agenda.js')
s = agenda_path.read_text(encoding='utf-8')

start = s.index('const GRUPOS = [')
end = s.index('const $ = (id)', start)
s = s[:start] + '''const GRUPOS = typeof bookingGroups !== "undefined" ? bookingGroups : [];
const CATALOGO = typeof bookingCatalog !== "undefined" ? bookingCatalog : [];
if (!GRUPOS.length || !CATALOGO.length) {
  console.error("Catálogo de agendamento indisponível. Verifique dados-servicos.js.");
}

''' + s[end:]

s = s.replace(
'''const NOMES = ["Tipo de atendimento", "Serviço", "Pacote", "Data e horário", "Seus dados", "Revisão"];
const TOTAL = 6;''',
'''const NOMES = ["Tipo de atendimento", "Serviço", "Pacote", "Data e horário", "Seus dados", "Revisão"];
function fluxoAtual() { return ehProduto() ? [1, 2, 3, 5, 6] : [1, 2, 3, 4, 5, 6]; }
function progressoDaEtapa(n) {
  const fluxo = fluxoAtual();
  const indice = Math.max(0, fluxo.indexOf(n));
  return { atual: indice + 1, total: fluxo.length };
}''')

s = s.replace(
'''function usaHorario() {
  const s = servicoAtual();
  if (!s || ehProduto()) return false;
  if (gestanteExterna() || chaExterno()) return false;
  if (aniversarioEstudio()) return true;
  return !s.horaLivre;
}''',
'''function usaHorario() {
  const s = servicoAtual();
  if (!s || ehProduto()) return false;
  if (gestanteExterna() || chaExterno()) return false;
  if (aniversarioEstudio()) return true;
  return !s.horaLivre;
}
function precisaHorarioSelecionado() { return usaHorario() && !agendaFalhou; }''')

s = s.replace(
'''    b.type="button"; b.className="bk-tipo"; b.dataset.grupo=g.id; b.setAttribute("role","radio");''',
'''    b.type="button"; b.className="bk-tipo"; b.dataset.grupo=g.id; b.setAttribute("role","radio"); b.setAttribute("aria-checked", st.grupo===g.id ? "true" : "false");''')
s = s.replace(
'''    if (st.grupo===g.id) { b.classList.add("selecionado"); b.setAttribute("aria-checked","true"); }''',
'''    if (st.grupo===g.id) b.classList.add("selecionado");''')

s = s.replace(
'''    b.type="button"; b.className="bk-servico"; b.dataset.chave=s.chave; b.setAttribute("role","radio");''',
'''    b.type="button"; b.className="bk-servico"; b.dataset.chave=s.chave; b.setAttribute("role","radio"); b.setAttribute("aria-checked", st.servico===s.chave ? "true" : "false");''')

s = s.replace(
'''    const b=document.createElement("button"); b.type="button"; b.className="bk-pacote";''',
'''    const b=document.createElement("button"); b.type="button"; b.className="bk-pacote"; b.setAttribute("role","radio"); b.setAttribute("aria-checked", st.pacote && st.pacote.name===o.name ? "true" : "false");''')

s = s.replace(
'''    b.addEventListener("click",()=>{ st.pacote=o; st.data=null; st.hora=null; montarPacotes(); atualizar(); if(ehProduto()) mostrarEtapa(5); else seguir(); });''',
'''    b.addEventListener("click",()=>{ st.pacote=o; st.data=null; st.hora=null; montarPacotes(); atualizar(); if(ehProduto()) mostrarEtapa(5, true); else seguir(); });''')

s = s.replace(
'''function diaDisponivel(d){
  if(d<primeiraDataValida()||d.getDay()===0||busyDays.has(iso(d)))return false;
  if(usaHorario() && !agendaCarregada && !agendaFalhou)return false;
  return !usaHorario() || horariosDoServico().some(h=>!ocupado(iso(d),h));
}''',
'''function diaDisponivel(d){
  if(d<primeiraDataValida()||d.getDay()===0||busyDays.has(iso(d)))return false;
  if(usaHorario() && !agendaCarregada && !agendaFalhou)return false;
  if(agendaFalhou && usaHorario()) return true;
  return !usaHorario() || horariosDoServico().some(h=>!ocupado(iso(d),h));
}''')

s = s.replace(
'''  if(usaHorario()){
    if(!agendaCarregada && !agendaFalhou) return false;
    if(!st.hora || !horariosDoServico().includes(st.hora) || ocupado(st.data,st.hora)){st.hora=null;return false;}
  }
  return true;''',
'''  if(precisaHorarioSelecionado()){
    if(!agendaCarregada && !agendaFalhou) return false;
    if(!st.hora || !horariosDoServico().includes(st.hora) || ocupado(st.data,st.hora)){st.hora=null;return false;}
  } else if (agendaFalhou && usaHorario()) {
    st.hora=null;
  }
  return true;''')

s = s.replace(
'''    const d=new Date(ano,mes,n), b=document.createElement("button"), ok=diaDisponivel(d); b.type="button";b.className="bk-dia";b.textContent=n;b.disabled=!ok;
    if(!ok)b.classList.add("indisponivel");if(st.data===iso(d))b.classList.add("selecionado");''',
'''    const d=new Date(ano,mes,n), b=document.createElement("button"), ok=diaDisponivel(d); b.type="button";b.className="bk-dia";b.textContent=n;b.disabled=!ok;b.setAttribute("role","gridcell");b.setAttribute("aria-disabled",ok?"false":"true");b.setAttribute("aria-selected",st.data===iso(d)?"true":"false");
    if(!ok)b.classList.add("indisponivel");if(st.data===iso(d))b.classList.add("selecionado");''')

s = s.replace(
'''function montarSlots(){
  el.slots.innerHTML=""; el.slotHint.classList.toggle("aviso",agendaFalhou);
  if(!usaHorario())return;
  if(!agendaCarregada&&!agendaFalhou){el.slotHint.textContent="Verificando a agenda… Os horários serão liberados assim que a consulta terminar.";return;}
  if(!st.data){el.slotHint.textContent="Escolha primeiro o dia.";return;}
  const livres=horariosDoServico().filter(h=>!ocupado(st.data,h));
  if(!livres.length){el.slotHint.textContent="Não há horário livre neste dia.";return;}
  el.slotHint.textContent=agendaFalhou?"Não conseguimos consultar a agenda agora — estes horários precisam ser confirmados pelo WhatsApp.":"Agenda sincronizada: horários ocupados não aparecem.";
  livres.forEach(h=>{const b=document.createElement("button");b.type="button";b.className="slot";b.textContent=h;if(st.hora===h)b.classList.add("selected");b.addEventListener("click",()=>{st.hora=h;montarSlots();atualizar();seguir();});el.slots.appendChild(b);});
}''',
'''function montarSlots(){
  el.slots.innerHTML=""; el.slotHint.classList.toggle("aviso",agendaFalhou);
  el.slots.hidden=false;
  if(!usaHorario())return;
  if(!agendaCarregada&&!agendaFalhou){el.slotHint.textContent="Verificando a agenda… Os horários serão liberados assim que a consulta terminar.";return;}
  if(agendaFalhou){
    st.hora=null;
    el.slots.hidden=true;
    el.slotHint.textContent="Não conseguimos consultar os horários agora. Escolha a data e combinaremos o melhor horário com você pelo WhatsApp.";
    return;
  }
  if(!st.data){el.slotHint.textContent="Escolha primeiro o dia.";return;}
  const livres=horariosDoServico().filter(h=>!ocupado(st.data,h));
  if(!livres.length){el.slotHint.textContent="Não há horário livre neste dia.";return;}
  el.slotHint.textContent="Agenda sincronizada: horários ocupados não aparecem.";
  livres.forEach(h=>{const b=document.createElement("button");b.type="button";b.className="slot";b.textContent=h;b.setAttribute("aria-pressed",st.hora===h?"true":"false");if(st.hora===h)b.classList.add("selected");b.addEventListener("click",()=>{st.hora=h;montarSlots();atualizar();seguir();});el.slots.appendChild(b);});
}''')

s = s.replace(
'''  if(n===4)return ehProduto() || (!!st.data && (!usaHorario() || !!st.hora) && validarEscolhaAgenda());''',
'''  if(n===4)return ehProduto() || (!!st.data && (!precisaHorarioSelecionado() || !!st.hora) && validarEscolhaAgenda());''')

s = s.replace(
'''<span class="rev-v">'+esc(usaHorario()?st.hora:"a combinar")+'</span>''',
'''<span class="rev-v">'+esc(precisaHorarioSelecionado()?st.hora:"a combinar")+'</span>''')
s = s.replace(
'''linhas.push("• Horário: "+(usaHorario()?st.hora:"a combinar"));''',
'''linhas.push("• Horário: "+(precisaHorarioSelecionado()?st.hora:"a combinar"));''')

old_show = '''function mostrarEtapa(n){
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
function seguir(){if(travaAuto)return;setTimeout(()=>{if(etapaCompleta(etapa)&&etapa<TOTAL)mostrarEtapa(ehProduto()&&etapa===3?5:etapa+1);},220);}'''
new_show = '''function mostrarEtapa(n, moverFoco=false){
  // Produtos não passam pelo calendário.
  if(ehProduto()&&n===4)n=5;
  etapa=n;
  let ativa=null;
  document.querySelectorAll(".bk-etapa").forEach(sec=>{
    const atual=Number(sec.dataset.etapa)===n;
    sec.hidden=!atual;
    sec.setAttribute("aria-hidden", atual?"false":"true");
    if(atual){sec.setAttribute("tabindex","-1");sec.setAttribute("aria-label",NOMES[n-1]);ativa=sec;}
  });
  const prog=progressoDaEtapa(n);
  el.barra.style.width=(prog.atual/prog.total*100)+"%";el.passoNum.textContent="Etapa "+prog.atual+" de "+prog.total;el.passoNome.textContent=NOMES[n-1];
  el.voltar.hidden=n===1;el.enviar.hidden=n<5;el.enviar.textContent=n===6?"Enviar no WhatsApp":"Continuar";
  const nav=document.querySelector(".bk-nav");if(nav)nav.hidden=el.voltar.hidden&&el.enviar.hidden;
  if(n===3)montarPacotes();
  if(n===4){el.horaBloco.hidden=!usaHorario();el.combinar.hidden=usaHorario();irParaMesComVaga();montarCalendario();montarSlots();}
  if(n===5){garantirCampoLooks();el.localBloco.hidden=!precisaLocal();}
  if(n===6)montarRevisao(); atualizar();
  if(moverFoco&&ativa)requestAnimationFrame(()=>ativa.focus({preventScroll:true}));
}
function seguir(){if(travaAuto)return;setTimeout(()=>{if(etapaCompleta(etapa)&&etapa<6)mostrarEtapa(ehProduto()&&etapa===3?5:etapa+1,true);},220);}'''
if old_show not in s:
    raise SystemExit('Bloco mostrarEtapa não encontrado')
s = s.replace(old_show, new_show)

s = s.replace('''if(!ehProduto() && !validarEscolhaAgenda()){mostrarEtapa(4);''','''if(!ehProduto() && !validarEscolhaAgenda()){mostrarEtapa(4,true);''')
s = s.replace('''el.trocar.addEventListener("click",()=>mostrarEtapa(2));''','''el.trocar.addEventListener("click",()=>mostrarEtapa(2,true));''')
s = s.replace('''el.voltar.addEventListener("click",()=>{if(etapa===5&&ehProduto())mostrarEtapa(3);else if(etapa>1)mostrarEtapa(etapa-1);});''','''el.voltar.addEventListener("click",()=>{if(etapa===5&&ehProduto())mostrarEtapa(3,true);else if(etapa>1)mostrarEtapa(etapa-1,true);});''')
s = s.replace('''el.enviar.addEventListener("click",()=>{if(el.enviar.disabled)return;if(etapa<TOTAL)mostrarEtapa(etapa+1);else enviar();});''','''el.enviar.addEventListener("click",()=>{if(el.enviar.disabled)return;if(etapa<6)mostrarEtapa(etapa+1,true);else enviar();});''')
s = s.replace('''if((tinhaData&&!st.data)||(tinhaHora&&!st.hora)){if(!ehProduto())mostrarEtapa(4);}''','''if((tinhaData&&!st.data)||(tinhaHora&&!st.hora)){if(!ehProduto())mostrarEtapa(4,true);}''')

# ARIA em grupos gerados dinamicamente e status do progresso.
s = s.replace('''montarTipos();
(function retomar(){''','''el.pacotes.setAttribute("role","radiogroup");
el.pacotes.setAttribute("aria-label","Pacotes disponíveis");
el.passoNum.parentElement?.setAttribute("aria-live","polite");
montarTipos();
(function retomar(){''')

agenda_path.write_text(s, encoding='utf-8')

# 3) Refinamento visual editorial, sem trocar a câmera SVG.
css_path = Path('styles.css')
css = css_path.read_text(encoding='utf-8')
css_marker = '/* ---------- AGENDAMENTO · REFINAMENTO PREMIUM ---------- */'
if css_marker not in css:
    css += r'''

/* ---------- AGENDAMENTO · REFINAMENTO PREMIUM ---------- */
.booking-panel{
  overflow:hidden;
  border-color:rgba(201,162,75,.16);
  border-radius:24px;
  background:
    radial-gradient(circle at 8% 0%,rgba(201,162,75,.07),transparent 30%),
    linear-gradient(180deg,rgba(23,20,15,.96),rgba(14,13,11,.98));
  box-shadow:0 28px 78px rgba(0,0,0,.3), inset 0 0 0 1px rgba(255,255,255,.012);
}
.booking-panel::before{
  content:'';
  position:absolute;
  top:0;
  left:8%;
  right:8%;
  height:1px;
  background:linear-gradient(90deg,transparent,rgba(230,200,120,.58),transparent);
  pointer-events:none;
}
.bk-progresso{margin-bottom:26px;}
.bk-barra{background:rgba(201,162,75,.13);}
.bk-passo{letter-spacing:.04em;}
.bk-etapa > .booking-label{
  margin-bottom:18px;
  color:var(--cream);
  font-family:'Cormorant Garamond',serif;
  font-size:1.34rem;
  font-weight:500;
  letter-spacing:.01em;
  text-transform:none;
}
.bk-tipo,.bk-servico,.bk-pacote{
  border-color:rgba(201,162,75,.13);
  background:linear-gradient(145deg,rgba(255,255,255,.014),rgba(201,162,75,.012));
  box-shadow:inset 0 1px rgba(255,255,255,.012);
}
.bk-tipo:hover,.bk-servico:hover,.bk-pacote:hover{
  border-color:rgba(201,162,75,.42);
  background:linear-gradient(145deg,rgba(201,162,75,.055),rgba(255,255,255,.012));
}
.bk-tipo.selecionado,.bk-servico.selecionado,.bk-pacote.selecionado{
  border-color:rgba(230,200,120,.7);
  background:linear-gradient(145deg,rgba(201,162,75,.095),rgba(201,162,75,.025));
  box-shadow:0 0 0 1px rgba(201,162,75,.05),inset 0 1px rgba(255,255,255,.02);
}
.bk-tipo strong,.bk-servico strong,.bk-pacote-topo span{
  font-family:'Cormorant Garamond',serif;
  font-size:1.08rem;
  font-weight:500;
  letter-spacing:.01em;
}
.bk-pacote{padding:17px 20px;}
.bk-pacote ul{margin-top:12px;}
.bk-cal{
  border-color:rgba(201,162,75,.14);
  background:rgba(10,9,8,.38);
  box-shadow:inset 0 1px rgba(255,255,255,.012);
}
.booking-input,.booking-select,.slot{
  border-color:rgba(201,162,75,.14);
  background:rgba(10,9,8,.42);
}
.bk-nav{
  margin-top:26px;
  padding-top:20px;
  border-top:1px solid rgba(201,162,75,.1);
}
.rev-topo{
  border-color:rgba(201,162,75,.22);
  background:linear-gradient(145deg,rgba(201,162,75,.065),rgba(255,255,255,.012));
}
.booking-hint.aviso{
  margin-top:12px;
  padding:12px 14px;
  border:1px solid rgba(217,164,65,.22);
  border-radius:10px;
  background:rgba(217,164,65,.055);
  line-height:1.55;
}
@media(max-width:600px){
  .booking-panel{border-radius:20px;}
  .bk-etapa > .booking-label{font-size:1.22rem;}
  .bk-tipo,.bk-servico,.bk-pacote{border-radius:13px;}
}
'''
    css_path.write_text(css, encoding='utf-8')
