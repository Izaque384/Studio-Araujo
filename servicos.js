// Lógica dos modais "Mais informações" da página de Serviços.
// Os dados de preços/pacotes vivem em dados-servicos.js, carregado antes deste arquivo.

const modalOverlay = document.getElementById("serviceModal");
const modalContent = document.getElementById("modalContent");
const modalClose = document.getElementById("modalClose");

function buildModalHTML(key) {
  const data = servicePackages[key];
  const label = serviceLabels[key] || "Serviço";
  const waBase = "https://wa.me/5588981886579?text=";

  if (!data) {
    const msg = encodeURIComponent(`Olá! Gostaria de saber mais sobre o serviço de ${label}.`);
    return `
      <div class="m-eyebrow">${label}</div>
      <h3>Pacotes em breve</h3>
      <p class="modal-empty">Ainda estamos organizando os detalhes e valores desse pacote. Fale com a gente pelo WhatsApp que respondemos rapidinho!</p>
      <a href="${waBase}${msg}" target="_blank" rel="noopener" class="btn btn-solid">Perguntar no WhatsApp</a>
    `;
  }

  const optionsHTML = data.options ? data.options.map(opt => `
    <div class="package-option">
      <div class="p-head">
        <span class="p-name">${opt.name}</span>
        <span class="p-price">${opt.price}</span>
      </div>
      ${opt.items && opt.items.length ? `<ul>${opt.items.map(item => `<li>${item}</li>`).join("")}</ul>` : ""}
    </div>
  `).join("") : "";

  const singlePackageHTML = (!data.options && data.price) ? `
    <div class="package-option">
      <div class="p-head">
        <span class="p-name">Investimento</span>
        <span class="p-price">${data.price}</span>
      </div>
      ${data.items ? `<ul>${data.items.map(item => `<li>${item}</li>`).join("")}</ul>` : ""}
    </div>
  ` : "";

  const sectionsHTML = data.sections ? data.sections.map(sec => `
    <div class="package-section">
      <h4>${sec.heading}</h4>
      <ul>
        ${sec.items.map(item => `<li>${item}</li>`).join("")}
      </ul>
    </div>
  `).join("") : "";

  // O botão leva à página de agendamento já com este serviço pré-selecionado.
  return `
    <div class="m-eyebrow">${label}</div>
    <h3>${data.title}</h3>
    ${optionsHTML}
    ${singlePackageHTML}
    ${sectionsHTML}
    <div class="modal-meta">
      ${data.delivery ? `<p><strong>Entrega:</strong> ${data.delivery}</p>` : ""}
      ${data.extra ? `<p>${data.extra}</p>` : ""}
      ${data.displacement ? `<p><strong>Deslocamento:</strong> ${data.displacement}</p>` : ""}
      ${data.payment ? `<p><strong>Pagamento:</strong> ${data.payment}</p>` : ""}
      ${data.note ? `<p>${data.note}</p>` : ""}
    </div>
    <a href="agendamento.html?servico=${encodeURIComponent(key)}" class="btn btn-solid">Agendar esse pacote</a>
  `;
}

function openModal(key) {
  modalContent.innerHTML = buildModalHTML(key);
  modalOverlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modalOverlay.classList.remove("open");
  document.body.style.overflow = "";
}

document.querySelectorAll(".info-btn").forEach(btn => {
  btn.addEventListener("click", () => openModal(btn.dataset.service));
});

modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});
