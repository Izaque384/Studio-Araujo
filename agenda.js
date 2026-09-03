// Assistente de agendamento do Studio Araújo — em 6 etapas.
// Monta o pedido (atendimento, serviço, pacote, data, horário e contato) e
// envia estruturado para o WhatsApp do estúdio, onde a data é confirmada.
//
// TUDO daqui para baixo vive dentro desta função, e não no escopo global.
// Esta página carrega script.js junto com este arquivo, e os dois escopos são
// o mesmo: qualquer nome repetido (CAPAS_DOS_SERVICOS, $, esc, pad,
// testarFoto...) quebra este arquivo por inteiro, antes da primeira linha
// rodar. Encapsulado, isso não pode mais acontecer.
(function () {

const WHATSAPP = "5588981886579";

// ===== CATÁLOGO =====
// Cada serviço declara a que grupo pertence, quanto tempo ocupa na agenda e
// se precisa do local. Antes isso era uma lista de nomes solta no código, que
// quebrava se um item fosse renomeado; agora a chave é a mesma de
// dados-servicos.js e tudo se liga por ela.
const GRUPOS = [
  { id: "estudio",  titulo: "Sessão no estúdio", desc: "Cenário montado, luz e direção de poses" },
  { id: "externa",  titulo: "Ensaio externo",    desc: "Ao ar livre, em locação combinada" },
  { id: "evento",   titulo: "Evento",            desc: "Cobertura de casamento, festa ou celebração" },
  { id: "produtos", titulo: "Álbuns e produtos", desc: "Álbum, luva, maleta e caixa para fotos" }
];

const CATALOGO = [
  // grupo estúdio — usam a grade de horários
  { chave: "ensaio-casal",          nome: "Ensaio de Casal",        grupo: "estudio",  duracao: 60 },
  { chave: "gestante",              nome: "Gestante",               grupo: "estudio",  duracao: 60 },
  { chave: "abc",                   nome: "ABC",                    grupo: "estudio",  duracao: 45 },
  { chave: "formatura",             nome: "Formatura",              grupo: "estudio",  duracao: 45 },
  { chave: "cha-revelacao",         nome: "Chá Revelação",          grupo: "estudio",  duracao: 60 },
  { chave: "acompanhamento-mensal", nome: "Acompanhamento Mensal",  grupo: "estudio",  duracao: 30 },
  { chave: "corporativa",           nome: "Sessão Corporativa",     grupo: "estudio",  duracao: 60 },
  { chave: "moda",                  nome: "Moda",                   grupo: "estudio",  duracao: 120 },
  // grupo externa
  { chave: "pre-wedding",           nome: "Pré-Wedding",            grupo: "externa",  duracao: 120, local: true },
  // grupo evento — horário combinado depois
  { chave: "casamento",             nome: "Casamento",              grupo: "evento",   horaLivre: true, local: true },
  { chave: "aniversario",           nome: "Aniversário",            grupo: "evento",   horaLivre: true, local: true },
  { chave: "batizado",              nome: "Batizado",               grupo: "evento",   horaLivre: true, local: true },
  // grupo produtos
  { chave: "albuns",                nome: "Álbum Fotográfico",      grupo: "produtos", horaLivre: true },
  { chave: "luva",                  nome: "Luva / Estojo",          grupo: "produtos", horaLivre: true },
  { chave: "maleta",                nome: "Maleta / Estojo",        grupo: "produtos", horaLivre: true },
  { chave: "caixa",                 nome: "Caixa para Fotos",       grupo: "produtos", horaLivre: true }
];

const JANELAS = [["09:00", "11:00"], ["14:00", "18:00"]];  // atendimento
const PASSO = 30;        // de quanto em quanto tempo um horário pode começar
const MIN_DIAS = 1;      // antecedência mínima: a partir de amanhã

// ===== AGENDA DA MICHELE (Google Agenda, via Apps Script) =====
// Uma ponte gratuita do Google lê a agenda dela e entrega ao site apenas
// os horários ocupados (sem nomes nem detalhes dos eventos).
const AGENDA_API_URL = "https://script.google.com/macros/s/AKfycby94ybiNzs_9MsHRufebeOQiPOF7icz4ZMw7aUJxXSUc321viw6UcKMbRx5c-rZ4Qhh/exec";

const busyDays = new Set();
const busyIntervals = [];
let agendaCarregada = false;
let agendaFalhou = false;   // a ponte não respondeu: avisamos em vez de fingir que está tudo livre

// ===== ESTADO =====
const st = { grupo: null, servico: null, pacote: null, data: null, hora: null };
let etapa = 1;
let mesVisivel = new Date();
mesVisivel.setDate(1);

// ===== MEMÓRIA DO PROGRESSO =====
// O WhatsApp abre em outro aplicativo e muita gente volta para a página depois.
// Sem isto, tudo o que já foi escolhido se perde. Guardamos por 12 horas.
const MEM_CHAVE = "sa-agendamento";
const MEM_VALIDADE = 12 * 60 * 60 * 1000;
let memPronta = false;

function memGravar() {
  if (!memPronta) return;
  try {
    localStorage.setItem(MEM_CHAVE, JSON.stringify({
      quando: Date.now(), etapa, st,
      nome: elName.value, fone: elFone.value,
      local: elLocal.value, nota: elNote.value
    }));
  } catch (e) { /* navegador sem armazenamento: seguimos sem memória */ }
}

function memLimpar() {
  try { localStorage.removeItem(MEM_CHAVE); } catch (e) {}
}

function memLer() {
  try {
    const bruto = localStorage.getItem(MEM_CHAVE);
    if (!bruto) return null;
    const m = JSON.parse(bruto);
    if (!m || Date.now() - m.quando > MEM_VALIDADE) { memLimpar(); return null; }
    return m;
  } catch (e) { return null; }
}

const $ = (id) => document.getElementById(id);
const elBarra = $("bkBarra"), elPassoNum = $("bkPassoNum"), elPassoNome = $("bkPassoNome");
const elTipos = $("bkTipos"), elServicos = $("bkServicos"), elPacotes = $("bkPacotes");
const elMesNome = $("bkMesNome"), elDias = $("bkDias"), elSlots = $("bkSlots");
const elSlotHint = $("bkSlotHint"), elHoraBloco = $("bkHorarioBloco"), elCombinar = $("bkCombinarHint");
const elName = $("bkName"), elFone = $("bkFone"), elLocal = $("bkLocal");
const elLocalBloco = $("bkLocalBloco"), elNote = $("bkNote");
const elRevisao = $("bkRevisao"), elSinal = $("bkSinal");
const elVoltar = $("bkVoltar"), elEnviar = $("bkEnviar");
const elEscolhidoNome = $("bkEscolhidoNome"), elEscolhidoMeta = $("bkEscolhidoMeta");
const elPacotesLabel = $("bkPacotesLabel"), elTrocar = $("bkTrocar");
const NOMES = ["Tipo de atendimento", "Serviço", "Pacote", "Data e horário", "Seus dados", "Revisão"];
const TOTAL = NOMES.length;

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
const pad = (n) => String(n).padStart(2, "0");
const iso = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const doISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };

function servicoAtual() { return CATALOGO.find((s) => s.chave === st.servico) || null; }
function usaHorario() { const s = servicoAtual(); return !!s && !s.horaLivre; }
function duracao() { const s = servicoAtual(); return (s && s.duracao) || 60; }

// ===== PREÇOS (de dados-servicos.js) =====
function precoNumero(txt) {
  const m = String(txt).match(/([\d.]+),(\d{2})/);
  return m ? parseFloat(m[1].replace(/\./g, "") + "." + m[2]) : null;
}
function fmtPreco(v) { return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2 }); }
function faixaDePreco(opts) {
  const vals = opts.map((o) => precoNumero(o.price)).filter((v) => v !== null);
  if (!vals.length) return "Sob consulta";
  const min = Math.min(...vals), max = Math.max(...vals);
  return min === max ? fmtPreco(min) : "a partir de " + fmtPreco(min);
}
function resumoPreco(chave) {
  const d = (typeof servicePackages !== "undefined") && servicePackages[chave];
  if (!d) return "Sob consulta";
  if (d.options) return faixaDePreco(d.options);
  if (d.price) return d.price;
  return "Sob consulta";
}
function opcoesDe(chave) {
  const d = (typeof servicePackages !== "undefined") && servicePackages[chave];
  if (!d) return null;
  if (d.options) return d.options.map((o) => ({ name: o.name, price: o.price, items: o.items || [] }));
  if (d.price) return [{ name: "Investimento", price: d.price, items: d.items || [], unico: true }];
  return null;
}

// ===== ETAPA 1 · TIPO DE ATENDIMENTO =====
// Cada tipo de atendimento ganha um ícone em traço fino, no mesmo desenho das
// linhas douradas do site. São desenhados aqui (e não no HTML) porque a lista
// é montada por código a partir de GRUPOS.
const ICONES = {
  // holofote de estúdio sobre tripé
  estudio: '<path d="M14 5.5h12l3 7H11l3-7Z"/><path d="M11 12.5h18"/><path d="M20 12.5v9"/>' +
           '<path d="M20 21.5 13 34"/><path d="M20 21.5 27 34"/><path d="M20 26.5h.01"/>',
  // sol acima de morros: ensaio ao ar livre
  externa: '<circle cx="27" cy="12" r="4"/><path d="M6 27l7-8 5.5 6.5L24 18l10 9"/>' +
           '<path d="M5 32h30"/>',
  // taça e serpentina: festa, casamento, celebração
  evento:  '<path d="M13 7h14l-1.5 7a5.5 5.5 0 0 1-11 0L13 7Z"/><path d="M20 20v9"/>' +
           '<path d="M15 33h10"/><path d="M9 8.5 6 6"/><path d="M31 8.5 34 6"/>',
  // álbum de fotos com lombada
  produtos: '<rect x="8" y="8" width="24" height="25" rx="2.5"/><path d="M14 8v25"/>' +
            '<path d="M19 17.5l4.5 5 3-3L31 24"/><circle cx="24.5" cy="14" r="1.6"/>'
};

function icone(id) {
  const d = ICONES[id];
  if (!d) return "";
  return '<span class="bk-tipo-icone" aria-hidden="true">' +
         '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.3" ' +
         'stroke-linecap="round" stroke-linejoin="round">' + d + '</svg></span>';
}

GRUPOS.forEach((g) => {
  const b = document.createElement("button");
  b.type = "button"; b.className = "bk-tipo"; b.dataset.grupo = g.id;
  b.setAttribute("role", "radio"); b.setAttribute("aria-checked", "false");
  b.innerHTML = icone(g.id) +
    '<span class="bk-tipo-txt"><strong>' + esc(g.titulo) + '</strong>' +
    '<em>' + esc(g.desc) + '</em></span>';
  b.addEventListener("click", () => {
    st.grupo = g.id; st.servico = null; st.pacote = null; st.hora = null;
    elTipos.querySelectorAll(".bk-tipo").forEach((o) => {
      const on = o === b;
      o.classList.toggle("selecionado", on);
      o.setAttribute("aria-checked", on ? "true" : "false");
    });
    montarServicos();
    atualizar();
    // Sem isto o cartão continua com o foco do navegador e, ao voltar para a
    // etapa 1, aparece realçado como se ainda estivesse sendo apontado.
    b.blur();
    seguir();
  });
  elTipos.appendChild(b);
});

// ===== ETAPA 2 · SERVIÇO E PACOTE =====
// A foto de capa da galeria de cada serviço vira miniatura no cartão.
// Quem ainda não tem galeria (os produtos) segue sem foto, sem quebrar nada.
//
// CAPAS_DOS_SERVICOS diz QUAL foto da galeria é a capa daquele serviço.
// Por padrão é a foto -1.jpg; aqui você troca só onde o enquadramento
// da primeira foto não ficou bom no cartão.
// ⚠ A FONTE ÚNICA é o CAPAS_DOS_SERVICOS do script.js, que carrega antes
//   desta página. Mexa lá e as duas páginas mudam juntas. O objeto abaixo é
//   só rede de segurança, para o caso de o script.js não estar presente.
//   Antes este arquivo declarava `const CAPAS_DOS_SERVICOS` também, e como
//   scripts clássicos dividem o mesmo escopo global isso derrubava o
//   agenda.js inteiro com "Identifier has already been declared".
const CAPAS_AGENDA = (typeof CAPAS_DOS_SERVICOS !== "undefined") ? CAPAS_DOS_SERVICOS : {
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

function fotoDeCapa(chave) {
  return CAPAS_AGENDA[chave] || 1;
}

function testarFoto(src) {
  return new Promise((ok) => {
    const img = new Image();
    img.onload = () => ok(true);
    img.onerror = () => ok(false);
    img.src = src;
  });
}

function metaDoServico(s) {
  if (s.horaLivre) return "Horário a combinar";
  return s.duracao >= 60
    ? (s.duracao / 60).toLocaleString("pt-BR") + "h em estúdio"
    : s.duracao + " min em estúdio";
}

function montarServicos() {
  elServicos.innerHTML = "";
  elPacotes.innerHTML = "";
  const provasDeFoto = [];
  CATALOGO.filter((s) => s.grupo === st.grupo).forEach((s) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "bk-servico"; b.dataset.chave = s.chave;
    b.setAttribute("role", "radio"); b.setAttribute("aria-checked", "false");
    const meta = metaDoServico(s);
    b.innerHTML = '<span class="bk-servico-nome">' + esc(s.nome) + '</span>' +
                  '<span class="bk-servico-meta">' + esc(meta) + '</span>' +
                  '<span class="bk-servico-preco">' + esc(resumoPreco(s.chave)) + '</span>';
    b.addEventListener("click", () => {
      st.servico = s.chave; st.pacote = null; st.hora = null;
      elServicos.querySelectorAll(".bk-servico").forEach((o) => {
        const on = o === b;
        o.classList.toggle("selecionado", on);
        o.setAttribute("aria-checked", on ? "true" : "false");
      });
      montarPacotes();
      atualizar();
      seguir();
    });
    elServicos.appendChild(b);

    const foto = "assets/galeria/" + s.chave + "-" + fotoDeCapa(s.chave) + ".jpg";
    provasDeFoto.push(testarFoto(foto).then((existe) => {
      if (!existe || !b.isConnected) return;
      const img = document.createElement("img");
      img.className = "bk-servico-foto";
      img.src = foto; img.alt = ""; img.loading = "lazy"; img.decoding = "async";
      b.insertBefore(img, b.firstChild);
      b.classList.add("com-foto");
    }));
  });

  // As miniaturas entram depois que a etapa já apareceu, e cada uma deixa o
  // cartão mais alto. Como a altura do miolo fica travada durante a animação,
  // o conteúdo extra transbordava para fora do painel. Ao terminarem todas as
  // buscas, a altura volta ao natural e nada mais escapa da moldura.
  Promise.all(provasDeFoto).then(() => {
    if (typeof soltarAltura === "function") soltarAltura(corpoEl());
  });
}

function montarPacotes() {
  const s = servicoAtual();
  if (!s) return;
  elEscolhidoNome.textContent = s.nome;
  elEscolhidoMeta.textContent = metaDoServico(s);

  const opts = opcoesDe(st.servico);
  elPacotes.innerHTML = "";
  elPacotes.hidden = false;

  // Sem valores cadastrados: um cartão único para o cliente seguir mesmo assim
  if (!opts) {
    elPacotesLabel.textContent = "Investimento";
    const b = cartaoPacote({ name: "Valor a combinar", price: "Sob consulta",
      items: ["Combinamos o valor pelo WhatsApp, conforme a data e o local"], unico: true });
    elPacotes.appendChild(b);
    return;
  }

  elPacotesLabel.textContent = opts.length > 1
    ? "Escolha o pacote"
    : "Confira o que está incluso";
  opts.forEach((o) => elPacotes.appendChild(cartaoPacote(o)));
}

// Cada pacote é um cartão clicável: o cliente lê o que inclui e o toque
// confirma a escolha e já leva para a etapa seguinte.
function cartaoPacote(o) {
  const b = document.createElement("button");
  b.type = "button"; b.className = "bk-pacote";
  b.innerHTML = '<div class="bk-pacote-topo"><span>' + esc(o.name) + '</span><b>' + esc(o.price) + '</b></div>' +
    ((o.items && o.items.length) ? '<ul>' + o.items.map((i) => '<li>' + esc(i) + '</li>').join("") + '</ul>' : "") +
    '<span class="bk-pacote-cta">Escolher</span>';
  b.addEventListener("click", () => {
    st.pacote = o;
    elPacotes.querySelectorAll(".bk-pacote").forEach((x) => x.classList.toggle("selecionado", x === b));
    atualizar();
    seguir();
  });
  return b;
}

// ===== ETAPA 3 · CALENDÁRIO E HORÁRIOS =====
function minutos(hhmm) { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; }
function hhmm(min) { return pad(Math.floor(min / 60)) + ":" + pad(min % 60); }

// Horários possíveis para a duração do serviço, dentro das janelas de atendimento
function horariosDoServico() {
  const dur = duracao(), out = [];
  JANELAS.forEach(([ini, fim]) => {
    for (let t = minutos(ini); t + dur <= minutos(fim); t += PASSO) out.push(hhmm(t));
  });
  return out;
}

function ocupado(dataISO, hora) {
  if (!busyIntervals.length) return false;
  const d = doISO(dataISO), [h, m] = hora.split(":").map(Number);
  const ini = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m).getTime();
  const fim = ini + duracao() * 60000;
  return busyIntervals.some(([s, e]) => s < fim && e > ini);
}

function primeiraDataValida() {
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + MIN_DIAS);
  return d;
}

// Procura o primeiro dia realmente livre daqui para a frente. Serve para o
// calendário abrir já no mês certo: antes ele abria sempre no mês corrente e,
// quando não havia mais vaga nele, o cliente via um calendário todo apagado e
// concluía que não havia agenda — em vez de avançar o mês.
function primeiroDiaLivre() {
  const d = primeiraDataValida();
  for (let i = 0; i < 180; i++) {
    if (diaDisponivel(d)) return new Date(d);
    d.setDate(d.getDate() + 1);
  }
  return null;
}

function irParaMesComVaga() {
  if (st.data) { mesVisivel = doISO(st.data); mesVisivel.setDate(1); return; }
  const livre = primeiroDiaLivre();
  if (livre) { mesVisivel = new Date(livre.getFullYear(), livre.getMonth(), 1); }
}

function diaDisponivel(d) {
  if (d < primeiraDataValida()) return false;
  if (d.getDay() === 0) return false;                 // domingo
  if (busyDays.has(iso(d))) return false;
  if (!usaHorario()) return true;
  return horariosDoServico().some((h) => !ocupado(iso(d), h));
}

function montarCalendario() {
  const ano = mesVisivel.getFullYear(), mes = mesVisivel.getMonth();
  elMesNome.textContent = mesVisivel.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  elDias.innerHTML = "";
  const primeiro = new Date(ano, mes, 1);
  for (let i = 0; i < primeiro.getDay(); i++) {
    const v = document.createElement("span"); v.className = "bk-dia vazio"; elDias.appendChild(v);
  }
  const total = new Date(ano, mes + 1, 0).getDate();
  for (let n = 1; n <= total; n++) {
    const d = new Date(ano, mes, n);
    const b = document.createElement("button");
    b.type = "button"; b.className = "bk-dia"; b.textContent = n;
    const ok = diaDisponivel(d);
    b.disabled = !ok;
    if (!ok) b.classList.add("indisponivel");
    if (st.data === iso(d)) b.classList.add("selecionado");
    b.setAttribute("aria-label", d.toLocaleDateString("pt-BR", { day: "numeric", month: "long" }) + (ok ? "" : " — indisponível"));
    b.addEventListener("click", () => {
      st.data = iso(d); st.hora = null;
      montarCalendario(); montarSlots(); atualizar();
      if (!usaHorario()) seguir();
    });
    elDias.appendChild(b);
  }
  const limite = new Date(); limite.setDate(1);
  $("bkMesAnt").disabled = mesVisivel <= limite;
}

function montarSlots() {
  elSlots.innerHTML = "";
  if (!usaHorario()) return;
  if (!st.data) { elSlotHint.textContent = "Escolha primeiro o dia."; return; }
  const livres = horariosDoServico().filter((h) => !ocupado(st.data, h));
  if (!livres.length) { elSlotHint.textContent = "Não há horário livre neste dia."; return; }
  elSlotHint.textContent = agendaCarregada
    ? "Agenda sincronizada: horários ocupados não aparecem."
    : agendaFalhou
      ? "Não conseguimos consultar a agenda agora — estes horários podem já estar ocupados. Confirmamos pelo WhatsApp."
      : "Verificando a agenda…";
  elSlotHint.classList.toggle("aviso", agendaFalhou);
  livres.forEach((h) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "slot"; b.textContent = h;
    if (st.hora === h) b.classList.add("selected");
    b.addEventListener("click", () => {
      st.hora = h;
      elSlots.querySelectorAll(".slot").forEach((x) => x.classList.toggle("selected", x === b));
      atualizar();
      seguir();
    });
    elSlots.appendChild(b);
  });
}

$("bkMesAnt").addEventListener("click", () => { mesVisivel.setMonth(mesVisivel.getMonth() - 1); montarCalendario(); });
$("bkMesProx").addEventListener("click", () => { mesVisivel.setMonth(mesVisivel.getMonth() + 1); montarCalendario(); });

// ===== ETAPA 4 · DADOS =====
elFone.addEventListener("input", () => {
  let v = elFone.value.replace(/\D/g, "").slice(0, 11);
  if (v.length > 6) v = "(" + v.slice(0, 2) + ") " + v.slice(2, 7) + "-" + v.slice(7);
  else if (v.length > 2) v = "(" + v.slice(0, 2) + ") " + v.slice(2);
  else if (v.length) v = "(" + v;
  elFone.value = v;
  atualizar();
});
elName.addEventListener("input", atualizar);
elLocal.addEventListener("input", atualizar);

function foneValido() { return elFone.value.replace(/\D/g, "").length >= 10; }
function precisaLocal() { const s = servicoAtual(); return !!(s && s.local); }

// A etapa de dados é preenchimento manual: quem conclui é o cliente, no botão
// (ou no Enter). Só as escolhas por toque é que avançam sozinhas.
[elName, elFone, elLocal, elNote].forEach((el) => {
  el.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (etapaCompleta(5)) mostrarEtapa(6); else el.blur();
  });
});

// ===== ETAPA 5 · REVISÃO =====
function dataPorExtenso() {
  return doISO(st.data).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}
function montarRevisao() {
  const s = servicoAtual();
  const IC = {
    data:  '<path d="M5 8h14M8 3v3M16 3v3"/><rect x="4" y="6" width="16" height="15" rx="2.5"/>',
    hora:  '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2.5"/>',
    nome:  '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c1.4-3.6 4-5.2 7-5.2s5.6 1.6 7 5.2"/>',
    fone:  '<path d="M5 4h3.5l1.8 4.6-2.4 1.7c1 2.4 2.4 3.8 4.8 4.8l1.7-2.4L19 14.5V18c0 .8-.7 1.5-1.5 1.5C10.6 19.5 4.5 13.4 4.5 6.5 4.5 5.7 5.2 5 6 5Z"/>',
    local: '<path d="M12 21s6.5-6.6 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 14.4 12 21 12 21Z"/><circle cx="12" cy="10.2" r="2.4"/>',
    nota:  '<path d="M6 4h9l4 4v12H6z"/><path d="M15 4v4h4"/><path d="M9.5 12.5h6M9.5 16h4"/>'
  };
  const ic = (k) => '<svg class="rev-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[k] + '</svg>';
  const item = (k, rotulo, valor, largo) =>
    '<div class="rev-item' + (largo ? ' largo' : '') + '">' + ic(k) +
    '<div><span class="rev-k">' + esc(rotulo) + '</span>' +
    '<span class="rev-v">' + esc(valor) + '</span></div></div>';

  // Cabeçalho: o que foi escolhido e quanto custa, com o peso que merecem
  let html = '<div class="rev-topo">' +
    '<div class="rev-topo-txt">' +
      '<span class="rev-k">Sua sessão</span>' +
      '<strong class="rev-servico">' + esc(s ? s.nome : "—") + '</strong>' +
      (st.pacote && !st.pacote.unico
        ? '<span class="rev-pacote">' + esc(st.pacote.name) + '</span>' : '') +
    '</div>' +
    '<div class="rev-valor">' +
      '<span class="rev-k">Investimento</span>' +
      '<strong>' + esc(st.pacote ? st.pacote.price : "a combinar") + '</strong>' +
    '</div>' +
  '</div>';

  // Quando: o dado que mais importa conferir antes de enviar
  html += '<div class="rev-bloco rev-quando">' +
    item("data", "Data", dataPorExtenso()) +
    item("hora", "Horário", usaHorario() ? st.hora : "a combinar") +
  '</div>';

  // Contato e detalhes
  html += '<div class="rev-bloco">' +
    item("nome", "Nome", elName.value.trim()) +
    item("fone", "WhatsApp", elFone.value.trim()) +
    (precisaLocal() && elLocal.value.trim() ? item("local", "Local", elLocal.value.trim(), true) : '') +
    (elNote.value.trim() ? item("nota", "Observação", elNote.value.trim(), true) : '') +
  '</div>';

  // O que está incluso fica recolhido: informa sem esticar o card
  const itens = (st.pacote && st.pacote.items) || [];
  if (itens.length) {
    html += '<details class="rev-inclui"><summary>' +
      'O que está incluso <span>(' + itens.length + ')</span></summary><ul>' +
      itens.map((i) => '<li>' + esc(i) + '</li>').join("") + '</ul></details>';
  }
  elRevisao.innerHTML = html;

  // Entrada/sinal, quando o pacote escolhido menciona
  const texto = [st.pacote && st.pacote.items ? st.pacote.items.join(" ") : ""].join(" ");
  const m = texto.match(/entrada de (R\$ ?[\d.,]+)/i) || (/50%\s*na reserva/i.test(texto) ? ["", "50% na reserva"] : null);
  if (m) { elSinal.hidden = false; elSinal.textContent = "Reserva da data: " + m[1] + ". Combinamos a forma de pagamento pelo WhatsApp."; }
  else { elSinal.hidden = true; }
}

// ===== NAVEGAÇÃO =====
function etapaCompleta(n) {
  if (n === 1) return !!st.grupo;
  if (n === 2) return !!st.servico;
  if (n === 3) return !!st.pacote;
  if (n === 4) return !!st.data && (!usaHorario() || !!st.hora);
  if (n === 5) return elName.value.trim().length >= 2 && foneValido() && (!precisaLocal() || elLocal.value.trim().length >= 3);
  return true;
}

// ===== ALTURA ANIMADA DO CARD =====
// Sem altura mínima o card acompanha cada etapa, mas a mudança era um pulo
// seco. Aqui ele cresce e encolhe suavemente, sem sobrar faixa vazia.
const semAnimacao = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

let limpezaAltura = null;

function corpoEl() { return document.querySelector(".bk-corpo"); }

// Devolve o miolo à altura natural. Chamado antes de medir e ao fim da
// animação — sem isso uma altura inline podia ficar presa e abrir uma faixa
// vazia embaixo do conteúdo.
function soltarAltura(el) {
  if (limpezaAltura) { clearTimeout(limpezaAltura); limpezaAltura = null; }
  if (!el) return;
  el.style.height = "";
  el.style.overflow = "";
}

function alturaAtual() {
  const el = corpoEl();
  return el ? el.offsetHeight : 0;
}

function animarAltura(antes) {
  const el = corpoEl();
  if (!el) return;
  soltarAltura(el);                    // mede sempre a altura natural do conteúdo
  if (semAnimacao || !antes) return;
  const depois = el.offsetHeight;
  if (Math.abs(depois - antes) < 4) return;
  el.style.overflow = "hidden";
  el.style.height = antes + "px";
  void el.offsetHeight;                // força o navegador a assumir a altura inicial
  requestAnimationFrame(() => { el.style.height = depois + "px"; });
  // rede de segurança: mesmo que a transição não termine (aba em segundo
  // plano, troca de etapa no meio), a altura volta ao natural.
  limpezaAltura = setTimeout(() => soltarAltura(el), 520);
}

function mostrarEtapa(n) {
  const antes = alturaAtual();
  etapa = n;
  document.querySelectorAll(".bk-etapa").forEach((s) => { s.hidden = Number(s.dataset.etapa) !== n; });
  elBarra.style.width = (n / TOTAL * 100) + "%";
  elPassoNum.textContent = "Etapa " + n + " de " + TOTAL;
  elPassoNome.textContent = NOMES[n - 1];
  elVoltar.hidden = n === 1;
  elEnviar.hidden = n < 5;                        // dados e revisão: confirmação manual
  elEnviar.textContent = n === TOTAL ? "Enviar no WhatsApp" : "Continuar";
  // Nas etapas que avançam sozinhas nenhum botão aparece. Sem isto, a linha
  // vazia deles continuava ocupando espaço abaixo do conteúdo.
  const nav = document.querySelector(".bk-nav");
  if (nav) nav.hidden = elVoltar.hidden && elEnviar.hidden;
  if (n === 3) montarPacotes();
  if (n === 4) {
    elHoraBloco.hidden = !usaHorario();
    elCombinar.hidden = usaHorario();
    irParaMesComVaga();
    montarCalendario(); montarSlots();
  }
  if (n === 5) elLocalBloco.hidden = !precisaLocal();
  if (n === TOTAL) montarRevisao();
  atualizar();
  memGravar();
  animarAltura(antes);
  const atual = document.querySelector('.bk-etapa[data-etapa="' + n + '"]');
  if (atual) { atual.setAttribute("tabindex", "-1"); atual.focus({ preventScroll: true }); }
  const p = $("bkPanel");
  if (p) {
    const topo = p.getBoundingClientRect().top + window.scrollY - 100;
    if (window.scrollY > topo) window.scrollTo({ top: topo, behavior: "smooth" });
  }
}

function atualizar() { elEnviar.disabled = !etapaCompleta(etapa); }

// Nas três primeiras etapas cada escolha já leva para a seguinte: o clique
// funciona como resposta E como avanço. O pequeno atraso deixa a seleção
// aparecer antes da troca, para o cliente ver o que escolheu.
let travaAuto = false;
function seguir(delay) {
  if (travaAuto) return;
  setTimeout(() => { if (etapaCompleta(etapa) && etapa < TOTAL) mostrarEtapa(etapa + 1); }, delay || 260);
}

elEnviar.addEventListener("click", () => {
  if (elEnviar.disabled) return;
  if (etapa < TOTAL) mostrarEtapa(etapa + 1); else enviar();
});

// Botão "Trocar": volta para a lista de serviços daquele tipo de atendimento
elTrocar.addEventListener("click", () => mostrarEtapa(2));
elVoltar.addEventListener("click", () => { if (etapa > 1) mostrarEtapa(etapa - 1); });

function montarLinkWhatsApp() {
  const s = servicoAtual();
  const linhas = [
    "Olá, Studio Araújo! 😊",
    "Gostaria de agendar uma sessão. 📸",
    "• Serviço: " + s.nome
  ];
  if (st.pacote && !st.pacote.unico) linhas.push("• Pacote: " + st.pacote.name);
  if (st.pacote) linhas.push("• Valor: " + st.pacote.price);
  linhas.push(
    "• Data: " + dataPorExtenso(),
    "• Horário: " + (usaHorario() ? st.hora : "a combinar"),
    "• Nome: " + elName.value.trim(),
    "• WhatsApp: " + elFone.value.trim()
  );
  if (precisaLocal() && elLocal.value.trim()) linhas.push("• Local: " + elLocal.value.trim());
  if (elNote.value.trim()) linhas.push("• Observação: " + elNote.value.trim());
  linhas.push("Aguardo a confirmação. Obrigado(a)!");
  return "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(linhas.join("\n"));
}

// Depois de abrir o WhatsApp a página ficava idêntica: se o navegador
// bloqueasse a janela, o cliente não tinha como saber se deu certo. Agora ele
// vê uma confirmação, com um caminho alternativo caso nada tenha aberto.
function telaFinal(link) {
  const painel = $("bkPanel");
  if (!painel) return;
  const antes = alturaAtual();
  // A confirmação entra NO LUGAR das etapas, dentro do .bk-corpo. Se ficasse
  // fora dele, o corpo vazio continuaria ocupando a altura mínima e empurraria
  // a mensagem para o rodapé do card.
  const corpo = painel.querySelector(".bk-corpo") || painel;
  document.querySelectorAll(".bk-etapa").forEach((s) => { s.hidden = true; });
  elVoltar.hidden = true;
  elEnviar.hidden = true;
  const nav = painel.querySelector(".bk-nav");
  if (nav) nav.hidden = true;
  const prog = painel.querySelector(".bk-progresso");
  if (prog) prog.hidden = true;

  let box = $("bkFinal");
  if (!box) {
    box = document.createElement("div");
    box.id = "bkFinal";
    box.className = "bk-final";
    box.innerHTML =
      '<div class="bk-final-icone" aria-hidden="true">' +
        '<svg viewBox="0 0 52 52" fill="none" stroke="currentColor" stroke-width="2.2">' +
          '<circle cx="26" cy="26" r="23" stroke-opacity="0.45"/><path d="M16 27l7 7 14-15"/>' +
        '</svg>' +
      '</div>' +
      '<h3>Pedido montado!</h3>' +
      '<p id="bkFinalTexto">Abrimos o WhatsApp com todos os detalhes preenchidos. ' +
      '<strong>É só tocar em enviar</strong> para a mensagem chegar até nós — respondemos rapidinho ' +
      'confirmando a sua data.</p>' +
      '<div class="bk-final-acoes">' +
        '<a id="bkFinalLink" class="btn btn-solid" target="_blank" rel="noopener">Não abriu? Abrir o WhatsApp</a>' +
        '<button type="button" id="bkFinalNovo" class="btn btn-outline">Fazer outro agendamento</button>' +
      '</div>';
    corpo.appendChild(box);
    $("bkFinalNovo").addEventListener("click", () => {
      memLimpar();
      window.location.href = window.location.pathname;
    });
  }
  $("bkFinalLink").href = link;
  box.hidden = false;
  animarAltura(antes);
  box.setAttribute("tabindex", "-1");
  box.focus({ preventScroll: true });
  const topo = painel.getBoundingClientRect().top + window.scrollY - 100;
  window.scrollTo({ top: topo, behavior: "smooth" });
}

function enviar() {
  const link = montarLinkWhatsApp();
  const aba = window.open(link, "_blank", "noopener");
  // Se a janela foi bloqueada, o texto muda para pedir o toque no botão.
  telaFinal(link);
  if (!aba) {
    const t = $("bkFinalTexto");
    if (t) t.innerHTML = 'Seu pedido está pronto. O navegador bloqueou a abertura automática — ' +
      '<strong>toque no botão abaixo</strong> para abrir o WhatsApp com tudo já preenchido.';
  }
  memLimpar();
}

// ===== RETOMAR DE ONDE PAROU =====
// Roda antes da pré-seleção: se a URL trouxer ?servico=, ela tem prioridade.
(function retomar() {
  const chave = new URLSearchParams(window.location.search).get("servico");
  const m = memLer();
  memPronta = true;
  if (chave || !m || !m.st || !m.st.grupo) return;

  Object.assign(st, m.st);
  elName.value = m.nome || "";
  elFone.value = m.fone || "";
  elLocal.value = m.local || "";
  elNote.value = m.nota || "";

  // Os cliques abaixo zeram o que vem depois deles no estado, então guardamos
  // os alvos ANTES de disparar qualquer um.
  const alvoServico = m.st.servico;
  travaAuto = true;
  const btnGrupo = elTipos.querySelector('[data-grupo="' + st.grupo + '"]');
  if (btnGrupo) btnGrupo.click();
  if (alvoServico) {
    const btnServico = elServicos.querySelector('[data-chave="' + alvoServico + '"]');
    if (btnServico) btnServico.click();
  }
  travaAuto = false;

  // Clicar no grupo e no serviço zera o que vinha depois (é o comportamento
  // correto para quem está escolhendo). Aqui devolvemos o que estava guardado.
  st.pacote = m.st.pacote || null;
  st.data = m.st.data || null;
  st.hora = m.st.hora || null;

  // Uma data guardada ontem pode já ter passado — nesse caso volta para o calendário.
  if (st.data && doISO(st.data) < primeiraDataValida()) { st.data = null; st.hora = null; }

  // Para na PRIMEIRA etapa que ainda não está completa, nunca além da que ele
  // tinha alcançado. Sem isso a etapa 6 abriria sem data e quebraria a revisão.
  let destino = TOTAL;
  for (let n = 1; n < TOTAL; n++) {
    if (!etapaCompleta(n)) { destino = n; break; }
  }
  etapa = Math.min(destino, Number(m.etapa) || 1);
})();

// ===== PRÉ-SELEÇÃO VINDA DA PÁGINA DE SERVIÇOS (?servico=chave) =====
(function preselect() {
  const chave = new URLSearchParams(window.location.search).get("servico");
  const alvo = CATALOGO.find((s) => s.chave === chave);
  if (!alvo) return;
  travaAuto = true;
  const btnGrupo = elTipos.querySelector('[data-grupo="' + alvo.grupo + '"]');
  if (btnGrupo) btnGrupo.click();
  const btnServico = elServicos.querySelector('[data-chave="' + alvo.chave + '"]');
  if (btnServico) btnServico.click();
  mostrarEtapa(3);
  travaAuto = false;
})();

// Cada digitação nos campos também é guardada, para nada se perder no caminho.
[elName, elFone, elLocal, elNote].forEach((el) => el.addEventListener("input", memGravar));

mostrarEtapa(etapa);

// ===== SINCRONIZAÇÃO COM A GOOGLE AGENDA =====
if (AGENDA_API_URL) {
  fetch(AGENDA_API_URL + (AGENDA_API_URL.includes("?") ? "&" : "?") + "cb=" + Date.now())
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
    .then((events) => {
      if (!Array.isArray(events)) throw new Error("formato inesperado");
      events.forEach((ev) => {
        if (ev.d) {
          for (let t = ev.s; t < ev.e; t += 86400000) busyDays.add(iso(new Date(t)));
        } else {
          busyIntervals.push([ev.s, ev.e]);
        }
      });
      agendaCarregada = true;
      if (etapa === 4) { irParaMesComVaga(); montarCalendario(); montarSlots(); }
    })
    .catch(() => {
      // A ponte não respondeu. Em vez de mostrar tudo livre em silêncio,
      // avisamos o cliente de que a checagem não foi possível.
      agendaFalhou = true;
      if (etapa === 4) montarSlots();
    });
}

})();
