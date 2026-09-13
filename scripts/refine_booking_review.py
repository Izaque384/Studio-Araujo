from pathlib import Path
import re

agenda = Path('agenda.js')
s = agenda.read_text(encoding='utf-8')

pattern = re.compile(r'function montarRevisao\(\)\{.*?\n\}\n\nfunction atualizar\(\)', re.S)
new_fn = r'''function montarRevisao(){
  const s=servicoAtual(); if(!s)return;
  const pacoteNome=st.pacote&&!st.pacote.unico?st.pacote.name:"";
  const itens=st.pacote&&Array.isArray(st.pacote.items)?st.pacote.items:[];
  let html='<div class="rev-premium">';

  html+='<div class="rev-hero"><div class="rev-hero-copy"><span class="rev-eyebrow"><i></i>'+(ehProduto()?"Resumo do pedido":"Resumo do agendamento")+'</span><strong class="rev-servico">'+esc(s.nome)+'</strong>'+(pacoteNome?'<span class="rev-pacote">'+esc(pacoteNome)+'</span>':"")+'</div><div class="rev-valor"><span class="rev-k">Investimento</span><strong>'+esc(valorAtual())+'</strong><small>valor do serviço</small></div></div>';

  if(!ehProduto()){
    html+='<div class="rev-section rev-section-quando"><div class="rev-section-head"><div><span class="rev-section-kicker">Quando</span><h4>Data e horário</h4></div><span class="rev-section-number">01</span></div><div class="rev-grid"><div class="rev-detail"><span class="rev-detail-mark" aria-hidden="true"></span><div><span class="rev-k">Data escolhida</span><span class="rev-v rev-v-destaque">'+esc(dataPorExtenso())+'</span></div></div><div class="rev-detail"><span class="rev-detail-mark" aria-hidden="true"></span><div><span class="rev-k">Horário</span><span class="rev-v rev-v-destaque">'+esc(precisaHorarioSelecionado()?st.hora:"a combinar")+'</span></div></div></div></div>';
  }

  html+='<div class="rev-section"><div class="rev-section-head"><div><span class="rev-section-kicker">Contato</span><h4>Seus dados</h4></div><span class="rev-section-number">'+(ehProduto()?"01":"02")+'</span></div><div class="rev-grid rev-grid-dados"><div class="rev-detail"><span class="rev-detail-mark" aria-hidden="true"></span><div><span class="rev-k">Nome</span><span class="rev-v">'+esc(el.nome.value.trim())+'</span></div></div><div class="rev-detail"><span class="rev-detail-mark" aria-hidden="true"></span><div><span class="rev-k">WhatsApp</span><span class="rev-v">'+esc(el.fone.value.trim())+'</span></div></div>';
  if(st.servico==="moda")html+='<div class="rev-detail"><span class="rev-detail-mark" aria-hidden="true"></span><div><span class="rev-k">Quantidade de looks</span><span class="rev-v">'+esc(st.looks)+'</span></div></div>';
  if(precisaLocal()&&el.local.value.trim())html+='<div class="rev-detail rev-detail-wide"><span class="rev-detail-mark" aria-hidden="true"></span><div><span class="rev-k">Local</span><span class="rev-v">'+esc(el.local.value.trim())+'</span></div></div>';
  if(el.nota.value.trim())html+='<div class="rev-detail rev-detail-wide rev-detail-note"><span class="rev-detail-mark" aria-hidden="true"></span><div><span class="rev-k">Observação</span><span class="rev-v">'+esc(el.nota.value.trim())+'</span></div></div>';
  html+='</div></div>';

  if(itens.length){
    html+='<details class="rev-inclui"><summary><span><b>O que está incluído</b><small>'+itens.length+' '+(itens.length===1?"item":"itens")+' no pacote</small></span><i aria-hidden="true"></i></summary><ul>'+itens.map(i=>'<li>'+esc(i)+'</li>').join("")+'</ul></details>';
  }

  html+='<div class="rev-confirm-note"><span class="rev-confirm-icon" aria-hidden="true">✓</span><div><strong>Tudo certo?</strong><p>Ao confirmar, abriremos o WhatsApp com estes dados já organizados. Você revisa a mensagem e envia quando estiver pronto.</p></div></div></div>';
  el.revisao.innerHTML=html;

  const txt=itens.join(" ");
  const m=txt.match(/entrada de (R\$ ?[\d.,]+)/i)||(/50%\s*na reserva/i.test(txt)?["","50% na reserva"]:null);
  if(m){el.sinal.hidden=false;el.sinal.textContent="Reserva da data: "+m[1]+". Combinamos a forma de pagamento pelo WhatsApp.";}else el.sinal.hidden=true;
}

function atualizar()'''

s2, count = pattern.subn(new_fn, s, count=1)
if count != 1:
    raise SystemExit(f'Não foi possível substituir montarRevisao: {count}')

s2 = s2.replace('el.enviar.textContent=n===6?"Enviar no WhatsApp":"Continuar";', 'el.enviar.textContent=n===6?"Confirmar no WhatsApp":"Continuar";', 1)
agenda.write_text(s2, encoding='utf-8')

css_path = Path('styles.css')
css = css_path.read_text(encoding='utf-8')
marker = '/* ---------- AGENDAMENTO · REVISÃO PREMIUM 2026-09 ---------- */'
if marker not in css:
    css += r'''

/* ---------- AGENDAMENTO · REVISÃO PREMIUM 2026-09 ---------- */
.bk-etapa[data-etapa="6"] > .booking-label{
  margin-bottom:16px;
}
.rev-premium{
  display:flex;
  flex-direction:column;
  gap:14px;
}
.rev-hero{
  position:relative;
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  gap:26px;
  align-items:end;
  padding:22px 24px;
  overflow:hidden;
  border:1px solid rgba(201,162,75,.26);
  border-radius:18px;
  background:
    radial-gradient(circle at 8% 0%,rgba(230,200,120,.09),transparent 32%),
    linear-gradient(145deg,rgba(201,162,75,.075),rgba(255,255,255,.01));
}
.rev-hero::before{
  content:'';
  position:absolute;
  top:0;
  left:9%;
  right:9%;
  height:1px;
  background:linear-gradient(90deg,transparent,rgba(230,200,120,.72),transparent);
}
.rev-hero-copy{min-width:0;}
.rev-eyebrow{
  display:flex;
  align-items:center;
  gap:9px;
  margin-bottom:8px;
  color:var(--gold);
  font-size:.62rem;
  letter-spacing:.19em;
  text-transform:uppercase;
}
.rev-eyebrow i{
  width:24px;
  height:1px;
  background:var(--gold);
  opacity:.72;
}
.rev-servico{
  display:block;
  color:var(--cream);
  font-family:'Cormorant Garamond',serif;
  font-size:clamp(1.65rem,3.2vw,2.15rem);
  font-weight:500;
  line-height:1.02;
}
.rev-pacote{
  display:block;
  margin-top:7px;
  color:#b9aa8d;
  font-size:.78rem;
  line-height:1.45;
}
.rev-valor{
  min-width:155px;
  padding-left:22px;
  border-left:1px solid rgba(201,162,75,.17);
  text-align:right;
}
.rev-valor strong{
  display:block;
  margin-top:2px;
  color:var(--gold-light);
  font-family:'Cormorant Garamond',serif;
  font-size:clamp(1.55rem,2.8vw,1.95rem);
  font-weight:500;
  line-height:1;
}
.rev-valor small{
  display:block;
  margin-top:6px;
  color:#746a59;
  font-size:.61rem;
  letter-spacing:.07em;
}
.rev-k{
  display:block;
  margin-bottom:3px;
  color:#817662;
  font-size:.59rem;
  letter-spacing:.15em;
  text-transform:uppercase;
}
.rev-v{
  display:block;
  color:var(--cream);
  font-size:.88rem;
  line-height:1.45;
  overflow-wrap:anywhere;
}
.rev-v-destaque{
  font-family:'Cormorant Garamond',serif;
  font-size:1.08rem;
  color:#e9dfca;
}
.rev-section{
  padding:17px 19px 5px;
  border:1px solid rgba(201,162,75,.12);
  border-radius:16px;
  background:rgba(8,7,6,.22);
}
.rev-section-head{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:16px;
  margin-bottom:8px;
}
.rev-section-kicker{
  display:block;
  margin-bottom:1px;
  color:#746a59;
  font-size:.58rem;
  letter-spacing:.16em;
  text-transform:uppercase;
}
.rev-section-head h4{
  margin:0;
  color:var(--cream);
  font-family:'Cormorant Garamond',serif;
  font-size:1.18rem;
  font-weight:500;
}
.rev-section-number{
  color:rgba(201,162,75,.46);
  font-family:'Cormorant Garamond',serif;
  font-size:1.15rem;
  font-style:italic;
}
.rev-grid{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  column-gap:30px;
}
.rev-detail{
  position:relative;
  display:grid;
  grid-template-columns:8px minmax(0,1fr);
  gap:11px;
  align-items:start;
  min-width:0;
  padding:11px 0 13px;
  border-top:1px solid rgba(201,162,75,.09);
}
.rev-detail-mark{
  width:5px;
  height:5px;
  margin-top:8px;
  border-radius:50%;
  background:var(--gold);
  box-shadow:0 0 0 4px rgba(201,162,75,.055);
}
.rev-detail-wide{grid-column:1 / -1;}
.rev-detail-note .rev-v{
  color:#c8bda8;
  font-style:italic;
}
.rev-inclui{
  padding:0;
  overflow:hidden;
  border:1px solid rgba(201,162,75,.13);
  border-radius:16px;
  background:rgba(8,7,6,.22);
}
.rev-inclui summary{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:18px;
  min-height:58px;
  padding:13px 18px;
  cursor:pointer;
  list-style:none;
}
.rev-inclui summary::-webkit-details-marker{display:none;}
.rev-inclui summary span{display:flex;flex-direction:column;gap:2px;}
.rev-inclui summary b{
  color:var(--cream);
  font-family:'Cormorant Garamond',serif;
  font-size:1.05rem;
  font-weight:500;
}
.rev-inclui summary small{
  color:#776d5c;
  font-size:.64rem;
  letter-spacing:.05em;
}
.rev-inclui summary i{
  position:relative;
  width:26px;
  height:26px;
  flex:0 0 auto;
  border:1px solid rgba(201,162,75,.2);
  border-radius:50%;
}
.rev-inclui summary i::before,
.rev-inclui summary i::after{
  content:'';
  position:absolute;
  top:50%;
  left:50%;
  width:8px;
  height:1px;
  background:var(--gold);
  transform:translate(-50%,-50%);
  transition:transform .25s ease;
}
.rev-inclui summary i::after{transform:translate(-50%,-50%) rotate(90deg);}
.rev-inclui[open] summary i::after{transform:translate(-50%,-50%) rotate(0deg);}
.rev-inclui ul{
  list-style:none;
  margin:0;
  padding:2px 18px 15px;
  border-top:1px solid rgba(201,162,75,.08);
}
.rev-inclui li{
  position:relative;
  padding:9px 0 0 17px;
  color:#a99e89;
  font-size:.78rem;
  line-height:1.48;
}
.rev-inclui li::before{
  content:'✓';
  position:absolute;
  left:0;
  top:9px;
  color:var(--gold);
  font-size:.68rem;
}
.rev-confirm-note{
  display:grid;
  grid-template-columns:34px minmax(0,1fr);
  gap:13px;
  align-items:start;
  padding:2px 3px 0;
}
.rev-confirm-icon{
  width:30px;
  height:30px;
  display:grid;
  place-items:center;
  border:1px solid rgba(201,162,75,.25);
  border-radius:50%;
  background:rgba(201,162,75,.055);
  color:var(--gold-light);
  font-size:.75rem;
}
.rev-confirm-note strong{
  display:block;
  margin-bottom:2px;
  color:var(--cream);
  font-family:'Cormorant Garamond',serif;
  font-size:1rem;
  font-weight:500;
}
.rev-confirm-note p{
  max-width:62ch;
  color:#817765;
  font-size:.72rem;
  line-height:1.5;
}
.bk-etapa[data-etapa="6"] > .booking-hint{
  margin-top:15px;
  padding-top:13px;
  border-top:1px solid rgba(201,162,75,.08);
  color:#776d5c;
  font-size:.7rem;
  line-height:1.5;
}
.bk-etapa[data-etapa="6"] + *{}
.bk-sinal{
  position:relative;
  margin-top:14px;
  padding:13px 16px 13px 42px;
  border:1px solid rgba(201,162,75,.22);
  border-radius:13px;
  background:linear-gradient(90deg,rgba(201,162,75,.075),rgba(201,162,75,.025));
  color:#d7c59a;
  font-size:.76rem;
  line-height:1.5;
}
.bk-sinal::before{
  content:'';
  position:absolute;
  left:18px;
  top:50%;
  width:7px;
  height:7px;
  border-radius:50%;
  background:var(--gold);
  box-shadow:0 0 0 5px rgba(201,162,75,.07);
  transform:translateY(-50%);
}
.bk-etapa[data-etapa="6"] ~ .bk-nav{}
#bkPanel:has(.bk-etapa[data-etapa="6"]:not([hidden])) .bk-nav{
  padding-top:18px;
  border-top:1px solid rgba(201,162,75,.1);
}
#bkPanel:has(.bk-etapa[data-etapa="6"]:not([hidden])) #bkEnviar{
  min-width:230px;
}
@media(max-width:620px){
  .rev-hero{grid-template-columns:1fr;gap:16px;padding:19px 18px;}
  .rev-valor{padding:14px 0 0;border-left:0;border-top:1px solid rgba(201,162,75,.12);text-align:left;}
  .rev-grid{grid-template-columns:1fr;}
  .rev-detail-wide{grid-column:auto;}
  .rev-section{padding:15px 16px 4px;}
  .rev-confirm-note{grid-template-columns:30px minmax(0,1fr);}
  #bkPanel:has(.bk-etapa[data-etapa="6"]:not([hidden])) #bkEnviar{min-width:0;}
}
'''
    css_path.write_text(css, encoding='utf-8')
