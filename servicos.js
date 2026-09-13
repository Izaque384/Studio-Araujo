// Lógica dos modais "Mais informações" da página de Serviços.
// Os dados de preços/pacotes vivem em dados-servicos.js, carregado antes deste arquivo.

const modalOverlay = document.getElementById("serviceModal");
const modalContent = document.getElementById("modalContent");
const modalClose = document.getElementById("modalClose");
const modalBox = modalOverlay?.querySelector('.modal-box');
let modalOpener = null;



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
        <h3 class="proposal-title" id="serviceModalTitle">Pacotes em breve</h3>
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
      <h3 class="proposal-title" id="serviceModalTitle">${data.title}</h3>
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

modalOverlay?.setAttribute('role', 'dialog');
modalOverlay?.setAttribute('aria-modal', 'true');
modalOverlay?.setAttribute('aria-hidden', 'true');
modalOverlay?.setAttribute('aria-labelledby', 'serviceModalTitle');
modalBox?.setAttribute('tabindex', '-1');

document.querySelectorAll(".info-btn").forEach(btn => {
  btn.addEventListener("click", () => openModal(btn.dataset.service, btn));
});

modalClose?.addEventListener("click", closeModal);
modalOverlay?.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (!modalOverlay?.classList.contains('open')) return;
  if (e.key === "Escape") { closeModal(); return; }
  if (e.key !== "Tab") return;
  const focusables = [...modalBox.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
    .filter(el => !el.hidden && el.getClientRects().length);
  if (!focusables.length) { e.preventDefault(); modalBox.focus(); return; }
  const first = focusables[0], last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  else if (!modalBox.contains(document.activeElement)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
});
