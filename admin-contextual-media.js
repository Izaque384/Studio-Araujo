const STORAGE_FN = 'https://br-gentle-water-axxtumld-siteimages.compute.c-4.us-east-2.aws.neon.tech/';
const RETIRED_PRODUCT_SERVICES = new Set(['albuns','luva','maleta','caixa']);

let initialized = false;
let categories = [];
let allMedia = [];
let recentWorks = new Map();
let currentArea = null;
let editingMediaId = null;
let uploadWasRunning = false;
let refreshTimer = null;

const byId = id => document.getElementById(id);
const isVideo = mime => /^video\//i.test(mime || '');
const humanBytes = bytes => {
  const value = Number(bytes || 0);
  if (!value) return '—';
  if (value < 1024 * 1024) return Math.max(1, Math.round(value / 1024)) + ' KB';
  return (value / 1024 / 1024).toFixed(1) + ' MB';
};

function injectStyles() {
  if (byId('contextualAdminStyles')) return;
  const style = document.createElement('style');
  style.id = 'contextualAdminStyles';
  style.textContent = `
    .media-summary{display:none!important}
    #mediaOverview{display:none!important}
    .upload-area-tabs{display:none!important}
    #librarySection{display:none!important}
    .header-actions{align-items:center}
    .header-media-stat{min-width:88px;display:flex;align-items:baseline;justify-content:center;gap:8px;padding:9px 13px;border:1px solid var(--line);border-radius:10px;background:rgba(255,255,255,.018)}
    .header-media-stat small{color:var(--muted);font-size:.68rem;letter-spacing:.08em;text-transform:uppercase}
    .header-media-stat strong{font-family:'Cormorant Garamond',serif;font-size:1.55rem;font-weight:500;color:var(--gold2);line-height:1}
    .hub-card.active{border-color:var(--line-strong);background:rgba(255,255,255,.04);transform:translateY(-2px)}
    .contextual-manager{scroll-margin-top:18px}
    .context-manager-msg{margin:14px 0 0}
    .context-edit-panel{margin-top:20px;padding:18px;border:1px solid var(--line);border-radius:14px;background:var(--card-2)}
    .context-edit-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:16px}
    .context-edit-head h3,.context-media-group h3{font-family:'Cormorant Garamond',serif;font-weight:500;margin:0;color:var(--cream)}
    .context-edit-layout{display:grid;grid-template-columns:minmax(180px,.65fr) minmax(0,1.7fr);gap:18px}
    .context-edit-preview{margin:0;min-height:190px;aspect-ratio:4/3;border-radius:12px;overflow:hidden;background:#090908}
    .context-edit-preview img,.context-edit-preview video{width:100%;height:100%;display:block;object-fit:cover}
    .context-edit-fields{display:grid;grid-template-columns:1fr 150px;gap:12px}
    .context-edit-fields label{display:grid;gap:6px;color:var(--muted);font-size:.76rem}
    .context-edit-fields select,.context-edit-fields input[type=text]{width:100%;background:var(--card-2);border:1px solid var(--line);border-radius:10px;color:var(--cream);padding:10px 11px;outline:none}
    .context-edit-fields select:focus,.context-edit-fields input[type=text]:focus{border-color:var(--line-strong)}
    .context-edit-wide{grid-column:1/-1}
    .context-edit-toggles{display:flex;gap:18px;align-items:center;flex-wrap:wrap;color:var(--muted);font-size:.8rem}
    .context-edit-toggles label{display:flex;flex-direction:row;align-items:center;gap:7px}
    .context-edit-toggles input{accent-color:var(--gold)}
    .context-edit-actions{display:flex;justify-content:flex-end}
    .context-media-section{scroll-margin-top:18px}
    .context-media-count{display:inline-flex;align-items:center;justify-content:center;min-width:84px;padding:8px 12px;border:1px solid var(--line);border-radius:999px;color:var(--gold2);font-size:.78rem}
    .context-media-groups{display:grid;gap:24px;margin-top:22px}
    .context-media-group{display:grid;gap:11px;padding-top:20px;border-top:1px solid var(--line)}
    .context-media-group:first-child{padding-top:0;border-top:0}
    .context-media-group-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px}
    .context-media-group-title{display:grid;gap:2px}
    .context-media-group-title h3{font-size:1.25rem}
    .context-media-group-title small{color:var(--muted);font-size:.68rem}
    .context-media-group-head>span{color:var(--muted);font-size:.72rem;white-space:nowrap}
    .context-media-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(145px,1fr));gap:10px}
    .context-media-card{min-width:0;overflow:hidden;border:1px solid var(--line);border-radius:12px;background:var(--card-2)}
    .context-media-card figure{position:relative;margin:0;aspect-ratio:4/3;overflow:hidden;background:#090908}
    .context-media-card img,.context-media-card video{width:100%;height:100%;display:block;object-fit:cover}
    .context-media-badges{position:absolute;left:7px;top:7px;display:flex;gap:5px;flex-wrap:wrap}
    .context-media-badge{padding:4px 6px;border:1px solid rgba(241,238,232,.16);border-radius:999px;background:rgba(8,8,7,.82);font-size:.58rem;color:var(--cream)}
    .context-media-badge.hidden-badge{color:var(--danger)}
    .context-media-card-body{display:grid;gap:8px;padding:9px}
    .context-media-meta{display:flex;align-items:center;justify-content:space-between;gap:7px;color:var(--muted);font-size:.62rem}
    .context-media-card-body p{margin:0;min-height:30px;color:var(--muted);font-size:.7rem;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .context-media-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px}
    .context-media-actions .btn{padding:7px 6px;font-size:.68rem}
    .context-media-empty{padding:34px 18px;border:1px dashed var(--line);border-radius:12px;color:var(--muted);text-align:center}
    @media(max-width:820px){
      .context-edit-layout{grid-template-columns:1fr}
      .context-edit-preview{max-height:320px}
      .context-media-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
    }
    @media(max-width:560px){
      .header-actions{display:grid;grid-template-columns:1fr 1fr}
      .header-media-stat{grid-column:1/-1;justify-content:flex-start}
      .context-edit-head{flex-direction:column}
      .context-edit-fields{grid-template-columns:1fr}
      .context-edit-wide{grid-column:auto}
      .context-edit-actions .btn{width:100%}
      .context-media-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
      .context-media-card-body p{min-height:0}
      .context-media-actions{grid-template-columns:1fr}
      .context-media-actions .btn{width:100%}
    }
  `;
  document.head.appendChild(style);
}

function areaMeta(area) {
  if (area === 'recent') return {
    title: 'Trabalhos recentes',
    eyebrow: 'Gerenciar trabalhos',
    help: 'Cadastre trabalhos, altere informações e gerencie as fotos e vídeos vinculados a cada um.'
  };
  if (area === 'servico') return {
    title: 'Galerias de serviços',
    eyebrow: 'Gerenciar galerias',
    help: 'Envie, edite e organize as mídias exibidas nas galerias dos serviços.'
  };
  return {
    title: 'Portfólio',
    eyebrow: 'Gerenciar portfólio',
    help: 'Envie, edite e organize as fotos e vídeos do portfólio principal.'
  };
}

function categoryArea(slug) {
  if (slug === 'recent-work-media') return 'recent';
  return categories.find(c => c.slug === slug)?.area || '';
}
function categoryLabel(slug) {
  return categories.find(c => c.slug === slug)?.label || slug;
}
function categoryRank(slug) {
  const index = categories.findIndex(c => c.slug === slug);
  return index < 0 ? 9999 : index;
}
function categoriesForArea(area) {
  return categories.filter(c => categoryArea(c.slug) === area);
}
function cleanLabel(label) {
  return String(label || '').replace(/^Portfólio\s*[—-]\s*/i, '');
}
function orderScopeKey(media) {
  if (media?.recent_work_id) return `recent:${media.recent_work_id}`;
  return `category:${media?.category || ''}`;
}
function orderValue(media) {
  const value = Number(media?.sort_order);
  return Number.isFinite(value) && value > 0 ? value : Number.MAX_SAFE_INTEGER;
}
function compareMediaOrder(a, b) {
  return orderValue(a) - orderValue(b)
    || new Date(a?.created_at || 0) - new Date(b?.created_at || 0)
    || String(a?.id || '').localeCompare(String(b?.id || ''));
}
function orderedScopeItems(media, source = allMedia) {
  const key = orderScopeKey(media);
  return source.filter(item => orderScopeKey(item) === key).slice().sort(compareMediaOrder);
}
function orderOptions(count, selected = 1) {
  const total = Math.max(1, Number(count) || 1);
  const current = Math.min(total, Math.max(1, Math.trunc(Number(selected) || 1)));
  return Array.from({length: total}, (_, index) => `<option value="${index + 1}" ${index + 1 === current ? 'selected' : ''}>${index + 1}</option>`).join('');
}

function ensureLayout() {
  const panel = byId('panelView');
  const uploadSection = byId('uploadSection');
  if (!panel || !uploadSection) return;

  const headerActions = panel.querySelector('.header-actions');
  if (headerActions && !byId('headerMediaStat')) {
    const stat = document.createElement('div');
    stat.id = 'headerMediaStat';
    stat.className = 'header-media-stat';
    stat.setAttribute('aria-label', 'Total de mídias cadastradas');
    stat.innerHTML = '<small>Mídias</small><strong id="headerMediaStatValue">—</strong>';
    headerActions.insertBefore(stat, headerActions.firstChild);
  }

  const openLibraryBtn = byId('openLibraryBtn');
  if (openLibraryBtn) openLibraryBtn.hidden = true;
  const library = byId('librarySection');
  if (library) library.hidden = true;
  const overview = byId('mediaOverview');
  if (overview) overview.hidden = true;

  uploadSection.classList.add('contextual-manager');
  uploadSection.hidden = true;
  const uploadHead = uploadSection.querySelector('.upload-head');
  const actions = uploadHead?.querySelector('.upload-head-actions');
  if (actions && !byId('closeContextManagerBtn')) {
    const close = document.createElement('button');
    close.type = 'button';
    close.id = 'closeContextManagerBtn';
    close.className = 'btn btn-ghost btn-small';
    close.textContent = 'Fechar';
    actions.appendChild(close);
    close.addEventListener('click', closeAreaManager);
  }

  if (!byId('contextManagerMsg')) {
    const msg = document.createElement('p');
    msg.id = 'contextManagerMsg';
    msg.className = 'msg context-manager-msg';
    msg.setAttribute('role', 'status');
    msg.setAttribute('aria-live', 'polite');
    uploadHead?.insertAdjacentElement('afterend', msg);
  }

  if (!byId('contextEditPanel')) {
    const editor = document.createElement('section');
    editor.id = 'contextEditPanel';
    editor.className = 'context-edit-panel';
    editor.hidden = true;
    editor.innerHTML = `
      <div class="context-edit-head">
        <div><p class="eyebrow">Editar mídia</p><h3>Alterar mídia selecionada</h3><p id="contextEditScope" class="section-copy"></p></div>
        <button type="button" id="contextEditCancel" class="btn btn-ghost btn-small">Cancelar edição</button>
      </div>
      <div class="context-edit-layout">
        <figure id="contextEditPreview" class="context-edit-preview"></figure>
        <div class="context-edit-fields">
          <label id="contextEditCategoryField">Pasta / categoria<select id="contextEditCategory"></select></label>
          <label>Posição<select id="contextEditOrder"></select></label>
          <label class="context-edit-wide">Descrição<input id="contextEditAlt" type="text" maxlength="180" placeholder="Descrição da mídia"></label>
          <div class="context-edit-toggles context-edit-wide">
            <label><input id="contextEditVisible" type="checkbox"> Publicada</label>
            <label><input id="contextEditCover" type="checkbox"> Capa da galeria</label>
          </div>
          <div class="context-edit-actions context-edit-wide"><button type="button" id="contextEditSave" class="btn btn-primary">Salvar alterações</button></div>
        </div>
      </div>`;
    const recentNotice = byId('recentUploadNotice');
    if (recentNotice) uploadSection.insertBefore(editor, recentNotice);
    else uploadHead?.insertAdjacentElement('afterend', editor);
    byId('contextEditCancel')?.addEventListener('click', closeEditor);
    byId('contextEditSave')?.addEventListener('click', saveEditor);
    byId('contextEditCategory')?.addEventListener('change', () => syncEditorOrder());
  }

  if (!byId('contextMediaSection')) {
    const section = document.createElement('section');
    section.id = 'contextMediaSection';
    section.className = 'admin-section context-media-section';
    section.hidden = true;
    section.innerHTML = `
      <div class="section-heading context-media-head">
        <div><p class="eyebrow">Mídias cadastradas</p><h2 id="contextMediaTitle">Mídias</h2><p class="section-copy">Conteúdo compacto, separado por pasta ou serviço. Use Editar para ajustar uma mídia ou Excluir para removê-la definitivamente.</p></div>
        <span id="contextMediaCount" class="context-media-count">—</span>
      </div>
      <div id="contextMediaGroups" class="context-media-groups" aria-live="polite"></div>`;
    uploadSection.insertAdjacentElement('afterend', section);
  }

  bindHub();
  bindSyncObservers();
}

function updateHeaderCount() {
  const value = byId('headerMediaStatValue');
  if (value) value.textContent = String(allMedia.length);
}

async function refreshData({silent = false} = {}) {
  try {
    const [categoryResult, workResult, mediaResult] = await Promise.all([
      window.__studioContextNeon.from('site_categories').select('slug,label,area,sort_order').order('sort_order',{ascending:true}),
      window.__studioContextNeon.from('recent_works').select('id,title,sort_order,gallery_category').order('sort_order',{ascending:true}),
      window.__studioContextNeon.from('site_images').select('*').order('category',{ascending:true}).order('sort_order',{ascending:true})
    ]);
    if (categoryResult.error) throw categoryResult.error;
    if (workResult.error) throw workResult.error;
    if (mediaResult.error) throw mediaResult.error;
    categories = (categoryResult.data || []).filter(c => !RETIRED_PRODUCT_SERVICES.has(c.slug));
    recentWorks = new Map((workResult.data || []).map(item => [String(item.id), item]));
    allMedia = (mediaResult.data || []).filter(m => !RETIRED_PRODUCT_SERVICES.has(m.category));
    updateHeaderCount();
    renderCurrentMedia();
    if (!silent) setManagerMsg('');
  } catch (error) {
    console.error('Falha ao atualizar o gerenciador contextual.', error);
    if (!silent) setManagerMsg('Não foi possível atualizar as mídias do painel.', 'error');
  }
}

function setManagerMsg(text = '', type = '') {
  const el = byId('contextManagerMsg');
  if (!el) return;
  el.textContent = text;
  el.className = 'msg context-manager-msg' + (type ? ' ' + type : '');
}

function updateAreaHeader(area) {
  const meta = areaMeta(area);
  const uploadSection = byId('uploadSection');
  const eyebrow = uploadSection?.querySelector('.upload-head .eyebrow');
  const title = uploadSection?.querySelector('.upload-head h2');
  const help = byId('uploadContextHelp');
  if (eyebrow) eyebrow.textContent = meta.eyebrow;
  if (title) title.textContent = meta.title;
  if (help) help.textContent = meta.help;
  const mediaTitle = byId('contextMediaTitle');
  if (mediaTitle) mediaTitle.textContent = meta.title;
}

function clickInternalAreaTab(area) {
  const tab = document.querySelector(`[data-upload-area="${area}"]`);
  if (tab) tab.click();
}

async function openAreaManager(area) {
  currentArea = area;
  closeEditor();
  const overview = byId('mediaOverview');
  if (overview) overview.hidden = true;
  const testimonials = byId('testimonialsAdmin');
  if (testimonials) testimonials.hidden = true;
  clickInternalAreaTab(area);
  updateAreaHeader(area);
  const uploadSection = byId('uploadSection');
  const mediaSection = byId('contextMediaSection');
  if (uploadSection) uploadSection.hidden = false;
  if (mediaSection) mediaSection.hidden = false;
  document.querySelectorAll('[data-overview-area]').forEach(btn => btn.classList.toggle('active', btn.dataset.overviewArea === area));
  await refreshData({silent:true});
  uploadSection?.scrollIntoView({behavior:'smooth',block:'start'});
}

function closeAreaManager() {
  currentArea = null;
  closeEditor();
  const uploadSection = byId('uploadSection');
  const mediaSection = byId('contextMediaSection');
  if (uploadSection) uploadSection.hidden = true;
  if (mediaSection) mediaSection.hidden = true;
  document.querySelectorAll('[data-overview-area]').forEach(btn => btn.classList.remove('active'));
  document.querySelector('.admin-hub')?.scrollIntoView({behavior:'smooth',block:'start'});
}

function bindHub() {
  document.querySelectorAll('[data-overview-area]').forEach(btn => {
    if (btn.dataset.contextualBound === '1') return;
    btn.dataset.contextualBound = '1';
    btn.addEventListener('click', event => {
      event.stopImmediatePropagation();
      openAreaManager(btn.dataset.overviewArea);
    });
    const link = btn.querySelector('.hub-link');
    if (link) link.textContent = 'Gerenciar conteúdo →';
  });
  const testimonialsBtn = byId('openTestimonialsBtn');
  if (testimonialsBtn && testimonialsBtn.dataset.contextualBound !== '1') {
    testimonialsBtn.dataset.contextualBound = '1';
    testimonialsBtn.addEventListener('click', () => {
      currentArea = null;
      closeEditor();
      const uploadSection = byId('uploadSection');
      const mediaSection = byId('contextMediaSection');
      if (uploadSection) uploadSection.hidden = true;
      if (mediaSection) mediaSection.hidden = true;
      document.querySelectorAll('[data-overview-area]').forEach(btn => btn.classList.remove('active'));
    });
  }
}

function groupInfo(media) {
  if (media.recent_work_id) {
    const work = recentWorks.get(String(media.recent_work_id));
    return {
      key: 'recent:' + media.recent_work_id,
      label: work?.title || 'Trabalho recente',
      subtitle: work?.gallery_category ? cleanLabel(categoryLabel(work.gallery_category)) : 'Trabalho recente',
      rank: Number(work?.sort_order ?? 9999)
    };
  }
  return {
    key: 'category:' + media.category,
    label: cleanLabel(categoryLabel(media.category)),
    subtitle: currentArea === 'servico' ? 'Galeria de serviço' : 'Pasta do portfólio',
    rank: categoryRank(media.category)
  };
}

function renderCurrentMedia() {
  const groupsEl = byId('contextMediaGroups');
  if (!groupsEl || !currentArea) return;
  const items = allMedia.filter(m => categoryArea(m.category) === currentArea);
  const count = byId('contextMediaCount');
  if (count) count.textContent = `${items.length} mídia${items.length === 1 ? '' : 's'}`;
  if (!items.length) {
    groupsEl.innerHTML = '<div class="context-media-empty">Nenhuma mídia cadastrada nesta área.</div>';
    return;
  }
  const groups = new Map();
  items.forEach(media => {
    const info = groupInfo(media);
    if (!groups.has(info.key)) groups.set(info.key, {...info, items: []});
    groups.get(info.key).items.push(media);
  });
  const ordered = [...groups.values()].sort((a,b) => a.rank - b.rank || a.label.localeCompare(b.label,'pt-BR'));
  groupsEl.innerHTML = ordered.map(group => {
    const cards = group.items.slice().sort(compareMediaOrder).map(media => {
      const video = isVideo(media.mime_type);
      const preview = video
        ? `<video src="${window.__studioContextEsc(media.public_url)}" muted preload="metadata"></video>`
        : `<img src="${window.__studioContextEsc(media.public_url)}" alt="${window.__studioContextEsc(media.alt_text || group.label)}" loading="lazy">`;
      const badges = [
        media.is_cover ? '<span class="context-media-badge">Capa</span>' : '',
        !media.is_visible ? '<span class="context-media-badge hidden-badge">Oculta</span>' : ''
      ].join('');
      return `<article class="context-media-card" data-media-id="${window.__studioContextEsc(media.id)}">
        <figure>${preview}<div class="context-media-badges">${badges}</div></figure>
        <div class="context-media-card-body">
          <div class="context-media-meta"><span>${video ? 'Vídeo' : 'Foto'}</span><span>${humanBytes(media.bytes)}</span></div>
          <p>${window.__studioContextEsc(media.alt_text || (video ? 'Vídeo' : 'Foto'))}</p>
          <div class="context-media-actions"><button type="button" class="btn btn-ghost context-edit-media">Editar</button><button type="button" class="btn btn-danger context-delete-media">Excluir</button></div>
        </div>
      </article>`;
    }).join('');
    return `<section class="context-media-group"><div class="context-media-group-head"><div class="context-media-group-title"><h3>${window.__studioContextEsc(group.label)}</h3><small>${window.__studioContextEsc(group.subtitle)}</small></div><span>${group.items.length} mídia${group.items.length === 1 ? '' : 's'}</span></div><div class="context-media-grid">${cards}</div></section>`;
  }).join('');
  groupsEl.querySelectorAll('.context-media-card').forEach(card => {
    const id = card.dataset.mediaId;
    card.querySelector('.context-edit-media')?.addEventListener('click', () => openEditor(id));
    card.querySelector('.context-delete-media')?.addEventListener('click', () => deleteMedia(id));
  });
}

function syncEditorOrder(preferred = null) {
  const original = allMedia.find(item => String(item.id) === String(editingMediaId));
  const select = byId('contextEditOrder');
  if (!original || !select) return;
  const categorySelect = byId('contextEditCategory');
  const category = original.recent_work_id ? original.category : categorySelect.value;
  const target = {...original, category};
  const peers = allMedia.filter(item => String(item.id) !== String(original.id) && orderScopeKey(item) === orderScopeKey(target)).slice().sort(compareMediaOrder);
  let selected = preferred;
  if (selected == null) {
    const sameScope = orderScopeKey(original) === orderScopeKey(target);
    const current = sameScope ? orderedScopeItems(original).findIndex(item => String(item.id) === String(original.id)) + 1 : peers.length + 1;
    selected = current || 1;
  }
  select.innerHTML = orderOptions(peers.length + 1, selected);
}

function openEditor(id) {
  const media = allMedia.find(item => String(item.id) === String(id));
  const panel = byId('contextEditPanel');
  if (!media || !panel) return;
  editingMediaId = media.id;
  const video = isVideo(media.mime_type);
  const preview = byId('contextEditPreview');
  if (preview) preview.innerHTML = video
    ? `<video src="${window.__studioContextEsc(media.public_url)}" controls preload="metadata"></video>`
    : `<img src="${window.__studioContextEsc(media.public_url)}" alt="${window.__studioContextEsc(media.alt_text || '')}" loading="lazy">`;
  const info = groupInfo(media);
  const scope = byId('contextEditScope');
  if (scope) scope.textContent = info.label;
  const categoryField = byId('contextEditCategoryField');
  const categorySelect = byId('contextEditCategory');
  if (media.recent_work_id) {
    if (categoryField) categoryField.hidden = true;
    categorySelect.innerHTML = `<option value="${window.__studioContextEsc(media.category)}">${window.__studioContextEsc(info.label)}</option>`;
  } else {
    if (categoryField) categoryField.hidden = false;
    categorySelect.innerHTML = categoriesForArea(currentArea).map(c => `<option value="${window.__studioContextEsc(c.slug)}" ${c.slug === media.category ? 'selected' : ''}>${window.__studioContextEsc(cleanLabel(c.label))}</option>`).join('');
  }
  byId('contextEditAlt').value = media.alt_text || '';
  byId('contextEditVisible').checked = !!media.is_visible;
  const cover = byId('contextEditCover');
  cover.checked = !!media.is_cover;
  cover.disabled = video;
  syncEditorOrder();
  panel.hidden = false;
  panel.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function closeEditor() {
  editingMediaId = null;
  const panel = byId('contextEditPanel');
  if (panel) panel.hidden = true;
  const preview = byId('contextEditPreview');
  if (preview) preview.innerHTML = '';
}

async function persistSequence(items) {
  for (let index = 0; index < items.length; index++) {
    const wanted = index + 1;
    if (Number(items[index].sort_order) === wanted) continue;
    const {error} = await window.__studioContextNeon.from('site_images').update({sort_order:wanted}).eq('id', items[index].id);
    if (error) throw error;
  }
}

async function saveEditor() {
  const neon = window.__studioContextNeon;
  const original = allMedia.find(item => String(item.id) === String(editingMediaId));
  if (!original) return;
  const category = original.recent_work_id ? original.category : byId('contextEditCategory').value;
  const video = isVideo(original.mime_type);
  const isCover = !video && byId('contextEditCover').checked;
  const target = {...original, category};
  const oldScope = orderScopeKey(original);
  const newScope = orderScopeKey(target);
  const peers = allMedia.filter(item => String(item.id) !== String(original.id) && orderScopeKey(item) === newScope).slice().sort(compareMediaOrder);
  const desired = Math.min(peers.length + 1, Math.max(1, Math.trunc(Number(byId('contextEditOrder').value) || 1)));
  const payload = {
    category,
    sort_order: desired,
    alt_text: byId('contextEditAlt').value.trim(),
    is_visible: byId('contextEditVisible').checked,
    is_cover: isCover
  };
  const save = byId('contextEditSave');
  save.disabled = true;
  save.textContent = 'Salvando…';
  setManagerMsg('Salvando alterações…');
  try {
    if (isCover) {
      let query = neon.from('site_images').update({is_cover:false});
      query = original.recent_work_id ? query.eq('recent_work_id', original.recent_work_id) : query.eq('category', category);
      const {error} = await query.neq('id', original.id);
      if (error) throw error;
    }
    const {error} = await neon.from('site_images').update(payload).eq('id', original.id);
    if (error) throw error;
    const sequence = peers.slice();
    sequence.splice(desired - 1, 0, {...original, ...payload});
    await persistSequence(sequence);
    if (oldScope !== newScope) {
      const oldSequence = allMedia.filter(item => String(item.id) !== String(original.id) && orderScopeKey(item) === oldScope).slice().sort(compareMediaOrder);
      await persistSequence(oldSequence);
    }
    await refreshData({silent:true});
    closeEditor();
    setManagerMsg('Mídia atualizada com sucesso.', 'success');
  } catch (error) {
    console.error(error);
    setManagerMsg('Não foi possível salvar esta mídia.', 'error');
  } finally {
    save.disabled = false;
    save.textContent = 'Salvar alterações';
  }
}

async function deleteStorage(storageKey) {
  if (!storageKey || storageKey.startsWith('legacy:')) return;
  if (typeof window.studioStorageCall === 'function') {
    await window.studioStorageCall({action:'delete', storageKey});
    return;
  }
  const token = await window.__studioContextNeon.auth.getJWTToken?.();
  if (!token) throw new Error('Sessão expirada.');
  const response = await fetch(STORAGE_FN, {
    method:'POST',
    headers:{'Content-Type':'application/json', Authorization:'Bearer ' + token},
    body:JSON.stringify({action:'delete', storageKey})
  });
  if (!response.ok) throw new Error('Não foi possível remover o arquivo do armazenamento.');
}

async function deleteMedia(id) {
  const neon = window.__studioContextNeon;
  const media = allMedia.find(item => String(item.id) === String(id));
  if (!media) return;
  if (!confirm('Excluir esta mídia desta galeria e do site? Esta ação não pode ser desfeita.')) return;
  setManagerMsg('Excluindo mídia…');
  try {
    const {error} = await neon.from('site_images').delete().eq('id', media.id);
    if (error) throw error;
    const remaining = allMedia.filter(item => String(item.id) !== String(media.id));
    let storageWarning = false;
    try { await deleteStorage(media.storage_key); }
    catch (storageError) { storageWarning = true; console.warn('Registro removido, mas o arquivo não pôde ser apagado do Storage.', storageError); }
    try { await persistSequence(orderedScopeItems(media, remaining)); }
    catch (orderError) { console.warn('A mídia foi removida, mas a ordem não pôde ser renumerada.', orderError); }
    if (String(editingMediaId) === String(media.id)) closeEditor();
    await refreshData({silent:true});
    setManagerMsg(storageWarning ? 'Mídia removida do site. O arquivo no armazenamento precisa de uma nova tentativa de limpeza.' : 'Mídia excluída com sucesso.', storageWarning ? 'warn' : 'success');
  } catch (error) {
    console.error(error);
    setManagerMsg('Não foi possível excluir esta mídia.', 'error');
  }
}

function scheduleRefresh(delay = 500) {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => refreshData({silent:true}), delay);
}

function bindSyncObservers() {
  const uploadBtn = byId('uploadBtn');
  if (uploadBtn && uploadBtn.dataset.contextualObserved !== '1') {
    uploadBtn.dataset.contextualObserved = '1';
    const observer = new MutationObserver(() => {
      const text = uploadBtn.textContent || '';
      if (/Enviando/i.test(text)) uploadWasRunning = true;
      else if (uploadWasRunning && /Enviar selecionadas/i.test(text)) {
        uploadWasRunning = false;
        scheduleRefresh(450);
      }
    });
    observer.observe(uploadBtn, {childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['disabled']});
  }
  const recentMount = byId('recentAdminMount');
  if (recentMount && recentMount.dataset.contextualObserved !== '1') {
    recentMount.dataset.contextualObserved = '1';
    const observer = new MutationObserver(() => {
      if (currentArea === 'recent') scheduleRefresh(650);
    });
    observer.observe(recentMount, {childList:true,subtree:true});
  }
}

function onPanelOpened() {
  ensureLayout();
  refreshData({silent:true});
}

export function initContextualMediaAdmin({neon, esc}) {
  if (initialized) return;
  initialized = true;
  window.__studioContextNeon = neon;
  window.__studioContextEsc = esc;
  injectStyles();
  ensureLayout();
  const panel = byId('panelView');
  if (!panel) return;
  if (!panel.hidden) onPanelOpened();
  const observer = new MutationObserver(() => { if (!panel.hidden) onPanelOpened(); });
  observer.observe(panel, {attributes:true,attributeFilter:['hidden']});
}
