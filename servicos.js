// Lógica dos modais "Mais informações" da página de Serviços.
// Os dados de preços/pacotes vivem em dados-servicos.js, carregado antes deste arquivo.

const modalOverlay = document.getElementById("serviceModal");
const modalContent = document.getElementById("modalContent");
const modalClose = document.getElementById("modalClose");
const modalBox = modalOverlay?.querySelector('.modal-box');
let modalOpener = null;

function injectProposalStyles() {
  if (document.getElementById('serviceProposalStyles')) return;
  const style = document.createElement('style');
  style.id = 'serviceProposalStyles';
  style.textContent = `
    #serviceModal.modal-overlay{
      padding:28px;
      background:rgba(7,6,5,.84);
      backdrop-filter:blur(10px);
    }
    #serviceModal .modal-box{
      width:min(760px,100%);
      max-width:760px;
      max-height:min(88vh,920px);
      padding:0;
      overflow:hidden;
      border:1px solid rgba(201,162,75,.28);
      border-radius:22px;
      background:
        radial-gradient(circle at 8% 0%,rgba(201,162,75,.09),transparent 34%),
        linear-gradient(180deg,#17140f 0%,#100f0c 100%);
      box-shadow:0 32px 90px rgba(0,0,0,.58),0 0 0 1px rgba(255,255,255,.018) inset;
    }
    #serviceModal .modal-content{
      max-height:min(88vh,920px);
      overflow-y:auto;
      overscroll-behavior:contain;
      scrollbar-gutter:stable;
      padding:46px 46px 0;
    }
    #serviceModal .modal-content::-webkit-scrollbar{width:9px}
    #serviceModal .modal-content::-webkit-scrollbar-track{background:rgba(255,255,255,.025)}
    #serviceModal .modal-content::-webkit-scrollbar-thumb{background:rgba(201,162,75,.28);border:2px solid transparent;border-radius:99px;background-clip:padding-box}
    #serviceModal .modal-close{
      top:18px;
      right:18px;
      z-index:5;
      width:40px;
      height:40px;
      display:grid;
      place-items:center;
      border-radius:50%;
      border:1px solid rgba(201,162,75,.22);
      background:rgba(14,13,11,.78);
      backdrop-filter:blur(8px);
      color:var(--cream);
      font-size:1.45rem;
      line-height:1;
    }
    #serviceModal .modal-close:hover{
      border-color:rgba(230,200,120,.7);
      background:rgba(201,162,75,.08);
      color:var(--gold-light);
    }
    #serviceModal .proposal-header{
      position:static;
      inset:auto;
      z-index:auto;
      width:auto;
      padding:4px 56px 30px 0;
      border-bottom:1px solid rgba(201,162,75,.13);
      margin-bottom:26px;
    }
    #serviceModal .proposal-kicker{
      display:inline-flex;
      align-items:center;
      gap:10px;
      margin-bottom:13px;
      color:var(--gold);
      font-size:.68rem;
      letter-spacing:.22em;
      text-transform:uppercase;
    }
    #serviceModal .proposal-kicker::before{
      content:'';
      width:26px;
      height:1px;
      background:var(--gold);
      opacity:.75;
    }
    #serviceModal .proposal-title{
      margin:0;
      padding:0;
      max-width:640px;
      color:var(--cream);
      font-family:'Cormorant Garamond',serif;
      font-size:clamp(2rem,4vw,2.75rem);
      font-weight:500;
      line-height:1.05;
      letter-spacing:.005em;
    }
    #serviceModal .proposal-subtitle{
      max-width:560px;
      margin:14px 0 0;
      color:#968a76;
      font-size:.88rem;
      line-height:1.65;
    }
    #serviceModal .proposal-options{
      display:grid;
      gap:18px;
    }
    #serviceModal .package-option{
      margin:0;
      padding:0;
      overflow:hidden;
      border:1px solid rgba(201,162,75,.16);
      border-radius:16px;
      background:linear-gradient(145deg,rgba(255,255,255,.018),rgba(201,162,75,.025));
    }
    #serviceModal .package-option .p-head{
      display:grid;
      grid-template-columns:minmax(0,1fr) auto;
      gap:20px;
      align-items:center;
      margin:0;
      padding:21px 22px 19px;
      border-bottom:1px solid rgba(201,162,75,.12);
      background:rgba(201,162,75,.025);
    }
    #serviceModal .proposal-option-label{
      display:block;
      margin-bottom:5px;
      color:#7e7464;
      font-size:.62rem;
      letter-spacing:.16em;
      text-transform:uppercase;
    }
    #serviceModal .package-option .p-name{
      display:block;
      color:var(--cream);
      font-family:'Cormorant Garamond',serif;
      font-size:1.28rem;
      line-height:1.15;
      letter-spacing:.01em;
      text-transform:none;
    }
    #serviceModal .proposal-price{
      text-align:right;
      white-space:nowrap;
    }
    #serviceModal .proposal-price small{
      display:block;
      margin-bottom:2px;
      color:#7f7566;
      font-size:.58rem;
      letter-spacing:.14em;
      text-transform:uppercase;
      font-style:normal;
    }
    #serviceModal .package-option .p-price{
      color:var(--gold-light);
      font-family:'Cormorant Garamond',serif;
      font-size:1.75rem;
      font-weight:500;
      font-style:normal;
      line-height:1;
    }
    #serviceModal .proposal-includes{
      padding:20px 22px 22px;
    }
    #serviceModal .proposal-includes-title{
      display:flex;
      align-items:center;
      gap:9px;
      margin-bottom:13px;
      color:#9f927d;
      font-size:.63rem;
      letter-spacing:.14em;
      text-transform:uppercase;
    }
    #serviceModal .proposal-includes-title::before{
      content:'✓';
      color:var(--gold-light);
      font-size:.72rem;
    }
    #serviceModal .package-option ul{
      display:grid;
      gap:10px;
      list-style:none;
      margin:0;
    }
    #serviceModal .package-option ul li{
      position:relative;
      margin:0;
      padding:0 0 0 24px;
      color:#b0a48f;
      font-size:.88rem;
      line-height:1.6;
    }
    #serviceModal .package-option ul li::before{
      content:'✓';
      position:absolute;
      left:0;
      top:.05em;
      color:var(--gold);
      font-size:.72rem;
    }
    #serviceModal .package-option.single-package .p-head{
      grid-template-columns:1fr auto;
    }
    #serviceModal .package-section{
      margin-top:18px;
      padding:20px 22px;
      border:1px solid rgba(201,162,75,.15);
      border-radius:14px;
      background:rgba(255,255,255,.014);
    }
    #serviceModal .package-section h4{
      margin:0 0 12px;
      color:var(--gold-light);
      font-size:.72rem;
      font-weight:500;
      letter-spacing:.14em;
      text-transform:uppercase;
    }
    #serviceModal .package-section ul{
      display:grid;
      gap:9px;
      list-style:none;
    }
    #serviceModal .package-section li{
      position:relative;
      padding-left:22px;
      color:#aaa08f;
      font-size:.86rem;
      line-height:1.6;
    }
    #serviceModal .package-section li::before{
      content:'—';
      position:absolute;
      left:0;
      color:var(--gold);
    }
    #serviceModal .modal-meta{
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:10px;
      margin:24px 0 0;
      color:inherit;
      font-size:inherit;
    }
    #serviceModal .proposal-detail{
      min-height:78px;
      padding:14px 15px;
      border:1px solid rgba(201,162,75,.11);
      border-radius:12px;
      background:rgba(255,255,255,.012);
    }
    #serviceModal .proposal-impact{
      position:relative;
      grid-column:1/-1;
      margin-top:8px;
      padding:24px 28px 24px 58px;
      overflow:hidden;
      border-top:1px solid rgba(201,162,75,.18);
      border-bottom:1px solid rgba(201,162,75,.12);
      background:linear-gradient(90deg,rgba(201,162,75,.065),rgba(201,162,75,.018) 62%,transparent);
    }
    #serviceModal .proposal-impact::before{
      content:'“';
      position:absolute;
      left:20px;
      top:8px;
      color:rgba(230,200,120,.48);
      font-family:'Cormorant Garamond',serif;
      font-size:3.8rem;
      line-height:1;
    }
    #serviceModal .proposal-impact::after{
      content:'';
      position:absolute;
      left:0;
      top:18px;
      bottom:18px;
      width:2px;
      background:linear-gradient(180deg,transparent,var(--gold),transparent);
    }
    #serviceModal .proposal-impact p{
      margin:0;
      color:var(--cream);
      font-family:'Cormorant Garamond',serif;
      font-size:1.18rem;
      font-style:italic;
      line-height:1.55;
      letter-spacing:.01em;
    }
    #serviceModal .proposal-detail-label{
      display:block;
      margin-bottom:5px;
      color:var(--gold);
      font-size:.58rem;
      letter-spacing:.14em;
      text-transform:uppercase;
    }
    #serviceModal .proposal-detail p{
      margin:0;
      color:#a99d89;
      font-size:.8rem;
      line-height:1.55;
    }
    #serviceModal .proposal-footer{
      position:sticky;
      bottom:0;
      z-index:3;
      display:grid;
      grid-template-columns:minmax(0,1fr) auto;
      gap:20px;
      align-items:center;
      margin:30px -46px 0;
      padding:20px 46px 22px;
      border-top:1px solid rgba(201,162,75,.16);
      background:linear-gradient(180deg,rgba(16,15,12,.93),#100f0c 34%);
      backdrop-filter:blur(10px);
    }
    #serviceModal .proposal-footer-copy strong{
      display:block;
      margin-bottom:2px;
      color:var(--cream);
      font-family:'Cormorant Garamond',serif;
      font-size:1.15rem;
      font-weight:500;
    }
    #serviceModal .proposal-footer-copy span{
      color:#827867;
      font-size:.72rem;
      line-height:1.4;
    }
    #serviceModal .proposal-footer .btn{
      width:auto;
      min-width:220px;
      margin:0;
      justify-content:center;
      border-radius:9px;
      padding:14px 22px;
    }
    #serviceModal .proposal-footer .btn span{
      font-size:1rem;
      transition:transform .25s ease;
    }
    #serviceModal .proposal-footer .btn:hover span{
      transform:translateX(3px);
    }
    #serviceModal .modal-empty{
      margin:0;
      padding:18px 0 4px;
      color:#a99d89;
      font-size:.9rem;
      line-height:1.65;
    }
    @media(max-width:700px){
      #serviceModal.modal-overlay{padding:12px;align-items:flex-end}
      #serviceModal .modal-box{max-height:92dvh;border-radius:18px 18px 0 0}
      #serviceModal .modal-content{max-height:92dvh;padding:34px 20px 0}
      #serviceModal .modal-close{top:12px;right:12px;width:38px;height:38px}
      #serviceModal .proposal-header{padding:2px 46px 24px 0;margin-bottom:20px}
      #serviceModal .proposal-title{font-size:2rem}
      #serviceModal .package-option .p-head{grid-template-columns:1fr;gap:12px;padding:18px}
      #serviceModal .proposal-price{text-align:left}
      #serviceModal .package-option .p-price{font-size:1.6rem}
      #serviceModal .proposal-includes{padding:18px}
      #serviceModal .modal-meta{grid-template-columns:1fr}
      #serviceModal .proposal-impact{grid-column:auto;padding:21px 20px 21px 50px}
      #serviceModal .proposal-impact::before{left:16px;top:7px;font-size:3.2rem}
      #serviceModal .proposal-impact p{font-size:1.08rem}
      #serviceModal .proposal-footer{grid-template-columns:1fr;margin:26px -20px 0;padding:17px 20px 20px}
      #serviceModal .proposal-footer-copy{display:none}
      #serviceModal .proposal-footer .btn{width:100%;min-width:0;min-height:50px}
    }
    @media(prefers-reduced-motion:reduce){
      #serviceModal .proposal-footer .btn span{transition:none}
    }
  `;
  document.head.appendChild(style);
}

function detailCard(label, text, isNote = false) {
  if (!text) return "";
  return `
    <div class="proposal-detail${isNote ? ' is-note' : ''}">
      <span class="proposal-detail-label">${label}</span>
      <p>${text}</p>
    </div>
  `;
}

function optionHTML(opt, index, total) {
  const hasItems = Array.isArray(opt.items) && opt.items.length;
  return `
    <section class="package-option">
      <div class="p-head">
        <div>
          ${total > 1 ? `<span class="proposal-option-label">Opção ${String(index + 1).padStart(2, '0')}</span>` : ''}
          <span class="p-name">${opt.name}</span>
        </div>
        <div class="proposal-price">
          <small>Investimento</small>
          <span class="p-price">${opt.price}</span>
        </div>
      </div>
      ${hasItems ? `
        <div class="proposal-includes">
          <span class="proposal-includes-title">O que está incluso</span>
          <ul>${opt.items.map(item => `<li>${item}</li>`).join("")}</ul>
        </div>
      ` : ''}
    </section>
  `;
}

function buildModalHTML(key) {
  const data = servicePackages[key];
  const label = serviceLabels[key] || "Serviço";
  const waBase = "https://wa.me/5588981886579?text=";

  if (!data) {
    const msg = encodeURIComponent(`Olá! Gostaria de saber mais sobre o serviço de ${label}.`);
    return `
      <div class="proposal-header">
        <span class="proposal-kicker">${label}</span>
        <h3 class="proposal-title">Pacotes em breve</h3>
        <p class="proposal-subtitle">Estamos finalizando os detalhes desta experiência. Fale diretamente com o Studio para receber as informações atualizadas.</p>
      </div>
      <p class="modal-empty">Ainda estamos organizando os detalhes e valores desse pacote.</p>
      <div class="proposal-footer">
        <div class="proposal-footer-copy"><strong>Quer saber mais?</strong><span>Respondemos pelo WhatsApp com os detalhes deste serviço.</span></div>
        <a href="${waBase}${msg}" target="_blank" rel="noopener" class="btn btn-solid">Perguntar no WhatsApp <span aria-hidden="true">→</span></a>
      </div>
    `;
  }

  const optionsHTML = data.options
    ? `<div class="proposal-options">${data.options.map((opt, index) => optionHTML(opt, index, data.options.length)).join("")}</div>`
    : "";

  const singlePackageHTML = (!data.options && data.price) ? `
    <div class="proposal-options">
      <section class="package-option single-package">
        <div class="p-head">
          <div>
            <span class="proposal-option-label">Pacote</span>
            <span class="p-name">Experiência completa</span>
          </div>
          <div class="proposal-price">
            <small>Investimento</small>
            <span class="p-price">${data.price}</span>
          </div>
        </div>
        ${Array.isArray(data.items) && data.items.length ? `
          <div class="proposal-includes">
            <span class="proposal-includes-title">O que está incluso</span>
            <ul>${data.items.map(item => `<li>${item}</li>`).join("")}</ul>
          </div>
        ` : ''}
      </section>
    </div>
  ` : "";

  const sectionsHTML = data.sections ? data.sections.map(sec => `
    <div class="package-section">
      <h4>${sec.heading}</h4>
      <ul>${sec.items.map(item => `<li>${item}</li>`).join("")}</ul>
    </div>
  `).join("") : "";

  const metaHTML = [
    detailCard('Prazo de entrega', data.delivery),
    detailCard('Adicionais', data.extra),
    detailCard('Deslocamento', data.displacement),
    detailCard('Pagamento', data.payment)
  ].join('');
  const impactHTML = data.note ? `<div class="proposal-impact"><p>${data.note}</p></div>` : '';

  return `
    <div class="proposal-header">
      <span class="proposal-kicker">${label}</span>
      <h3 class="proposal-title">${data.title}</h3>
      <p class="proposal-subtitle">Confira com calma o investimento e tudo o que faz parte desta experiência fotográfica.</p>
    </div>
    ${optionsHTML}
    ${singlePackageHTML}
    ${sectionsHTML}
    ${(metaHTML || impactHTML) ? `<div class="modal-meta">${metaHTML}${impactHTML}</div>` : ''}
    <div class="proposal-footer">
      <div class="proposal-footer-copy">
        <strong>Pronto para reservar?</strong>
        <span>Na próxima etapa você escolhe a melhor data para o serviço.</span>
      </div>
      <a href="agendamento.html?servico=${encodeURIComponent(key)}" class="btn btn-solid">Agendar este serviço <span aria-hidden="true">→</span></a>
    </div>
  `;
}

function openModal(key, opener = null) {
  modalOpener = opener || document.activeElement;
  modalContent.innerHTML = buildModalHTML(key);
  modalContent.scrollTop = 0;
  modalOverlay.classList.add("open");
  modalOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => modalClose?.focus());
}

function closeModal() {
  modalOverlay.classList.remove("open");
  modalOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = "";
  if (modalOpener && typeof modalOpener.focus === 'function') modalOpener.focus();
  modalOpener = null;
}

injectProposalStyles();
modalOverlay?.setAttribute('role', 'dialog');
modalOverlay?.setAttribute('aria-modal', 'true');
modalOverlay?.setAttribute('aria-hidden', 'true');
modalBox?.setAttribute('tabindex', '-1');

document.querySelectorAll(".info-btn").forEach(btn => {
  btn.addEventListener("click", () => openModal(btn.dataset.service, btn));
});

modalClose?.addEventListener("click", closeModal);
modalOverlay?.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalOverlay?.classList.contains('open')) closeModal();
});
