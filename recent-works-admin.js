import { createClient, BetterAuthVanillaAdapter } from 'https://esm.sh/@neondatabase/neon-js@0.7.0-beta?bundle';

const AUTH_URL = 'https://ep-lucky-rice-axp36rxg.neonauth.c-4.us-east-2.aws.neon.tech/neondb/auth';
const DATA_API_URL = 'https://ep-lucky-rice-axp36rxg.apirest.c-4.us-east-2.aws.neon.tech/neondb/rest/v1';
const neon = createClient({ auth: { adapter: BetterAuthVanillaAdapter(), url: AUTH_URL }, dataApi: { url: DATA_API_URL } });

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let initialized = false;
let categories = [];
let editingId = null;

function injectStyles() {
  if (document.getElementById('recentAdminStyles')) return;
  const style = document.createElement('style');
  style.id = 'recentAdminStyles';
  style.textContent = `
    .recent-admin{margin-top:36px;padding:28px;border:1px solid rgba(201,162,75,.18);border-radius:20px;background:rgba(201,162,75,.035)}
    .recent-admin-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:22px}
    .recent-admin-head h2{margin:2px 0 6px;font-size:1.65rem}
    .recent-admin-note{color:#a89d86;font-size:.85rem;max-width:620px}
    .recent-form{display:grid;grid-template-columns:1fr 1fr;gap:14px 16px;margin-bottom:24px}
    .recent-form label{display:flex;flex-direction:column;gap:7px;color:#a89d86;font-size:.78rem;letter-spacing:.05em}
    .recent-form input,.recent-form select,.recent-form textarea{width:100%;background:#0e0d0b;border:1px solid rgba(201,162,75,.18);color:#f3ecdc;border-radius:10px;padding:12px 13px;font:inherit}
    .recent-form textarea{min-height:92px;resize:vertical}
    .recent-span-2{grid-column:1/-1}
    .recent-form-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap;grid-column:1/-1}
    .recent-check{display:flex!important;flex-direction:row!important;align-items:center;gap:8px!important}
    .recent-list{display:grid;gap:12px}
    .recent-row{display:grid;grid-template-columns:1.3fr .9fr auto;gap:16px;align-items:center;padding:16px;border:1px solid rgba(201,162,75,.14);border-radius:14px;background:#12100d}
    .recent-row h3{margin:0 0 4px;font-size:1.15rem}
    .recent-row p{margin:0;color:#a89d86;font-size:.82rem}
    .recent-row-meta{display:flex;gap:8px;flex-wrap:wrap;color:#a89d86;font-size:.76rem}
    .recent-pill{display:inline-flex;padding:4px 8px;border-radius:999px;border:1px solid rgba(201,162,75,.18)}
    .recent-row-actions{display:flex;gap:8px}
    .recent-empty{padding:20px;text-align:center;color:#a89d86;border:1px dashed rgba(201,162,75,.16);border-radius:12px}
    .recent-status{min-height:20px;margin:10px 0;color:#a89d86;font-size:.82rem}
    .recent-status.ok{color:#8fcf92}.recent-status.err{color:#ef9a9a}
    @media(max-width:760px){.recent-form{grid-template-columns:1fr}.recent-span-2{grid-column:auto}.recent-row{grid-template-columns:1fr}.recent-row-actions{justify-content:flex-start}.recent-admin{padding:20px}}
  `;
  document.head.appendChild(style);
}

function buildSection(panel) {
  if (document.getElementById('recentAdmin')) return;
  const section = document.createElement('section');
  section.id = 'recentAdmin';
  section.className = 'recent-admin';
  section.innerHTML = `
    <div class="recent-admin-head">
      <div>
        <p class="eyebrow">Home</p>
        <h2>Trabalhos recentes</h2>
        <p class="recent-admin-note">Cadastre os trabalhos que aparecem na página inicial. A home mostra os 3 primeiros itens ativos, de acordo com a ordem.</p>
      </div>
      <button type="button" class="btn btn-ghost" id="recentRefresh">Atualizar</button>
    </div>

    <form id="recentForm" class="recent-form">
      <label>Galeria
        <select id="recentGallery" required></select>
      </label>
      <label>Ordem
        <input id="recentOrder" type="number" value="1" required>
      </label>
      <label>Título
        <input id="recentTitle" type="text" maxlength="120" required placeholder="Ex.: Ensaio da Laura">
      </label>
      <label>Data do trabalho
        <input id="recentDate" type="date">
      </label>
      <label class="recent-span-2">Descrição
        <textarea id="recentDescription" maxlength="240" placeholder="Uma frase curta sobre esse trabalho."></textarea>
      </label>
      <label>Local
        <input id="recentLocation" type="text" maxlength="120" value="Morrinhos, CE">
      </label>
      <label class="recent-check"><input id="recentActive" type="checkbox" checked> Exibir na home</label>
      <div class="recent-form-actions">
        <button type="submit" class="btn btn-primary" id="recentSave">Adicionar trabalho</button>
        <button type="button" class="btn btn-ghost" id="recentCancel" hidden>Cancelar edição</button>
      </div>
    </form>
    <p id="recentStatus" class="recent-status" aria-live="polite"></p>
    <div id="recentList" class="recent-list"></div>
  `;
  const library = panel.querySelector('.library');
  if (library) panel.insertBefore(section, library);
  else panel.appendChild(section);
}

function setStatus(text='', type='') {
  const el = document.getElementById('recentStatus');
  if (!el) return;
  el.textContent = text;
  el.className = 'recent-status' + (type ? ' ' + type : '');
}

async function loadCategories() {
  const { data, error } = await neon.from('site_categories').select('slug,label,area,sort_order').order('sort_order',{ascending:true});
  if (error) throw error;
  categories = data || [];
  const sel = document.getElementById('recentGallery');
  if (sel) sel.innerHTML = categories.map(c => `<option value="${esc(c.slug)}">${esc(c.label)}</option>`).join('');
}

function categoryLabel(slug) {
  return categories.find(c => c.slug === slug)?.label || slug;
}

async function loadRecentWorks() {
  const list = document.getElementById('recentList');
  if (!list) return;
  list.innerHTML = '<div class="recent-empty">Carregando…</div>';
  const { data, error } = await neon.from('recent_works').select('*').order('sort_order',{ascending:true}).order('work_date',{ascending:false});
  if (error) {
    console.error(error);
    list.innerHTML = '<div class="recent-empty">Não foi possível carregar os trabalhos recentes.</div>';
    return;
  }
  const items = data || [];
  if (!items.length) {
    list.innerHTML = '<div class="recent-empty">Nenhum trabalho cadastrado ainda.</div>';
    return;
  }
  list.innerHTML = items.map(item => `
    <article class="recent-row" data-id="${esc(item.id)}">
      <div>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.description || '')}</p>
      </div>
      <div class="recent-row-meta">
        <span class="recent-pill">${esc(categoryLabel(item.gallery_category))}</span>
        <span class="recent-pill">Ordem ${Number(item.sort_order || 0)}</span>
        <span class="recent-pill">${item.is_active ? 'Ativo' : 'Oculto'}</span>
        ${item.work_date ? `<span class="recent-pill">${esc(item.work_date)}</span>` : ''}
      </div>
      <div class="recent-row-actions">
        <button type="button" class="btn btn-ghost recent-edit">Editar</button>
        <button type="button" class="btn btn-danger recent-delete">Excluir</button>
      </div>
    </article>`).join('');

  list.querySelectorAll('.recent-row').forEach(row => {
    const item = items.find(i => i.id === row.dataset.id);
    row.querySelector('.recent-edit').addEventListener('click', () => editItem(item));
    row.querySelector('.recent-delete').addEventListener('click', () => deleteItem(item));
  });
}

function resetForm() {
  editingId = null;
  document.getElementById('recentForm')?.reset();
  const loc = document.getElementById('recentLocation'); if (loc) loc.value = 'Morrinhos, CE';
  const active = document.getElementById('recentActive'); if (active) active.checked = true;
  const save = document.getElementById('recentSave'); if (save) save.textContent = 'Adicionar trabalho';
  const cancel = document.getElementById('recentCancel'); if (cancel) cancel.hidden = true;
}

function editItem(item) {
  editingId = item.id;
  document.getElementById('recentGallery').value = item.gallery_category;
  document.getElementById('recentOrder').value = Number(item.sort_order || 0);
  document.getElementById('recentTitle').value = item.title || '';
  document.getElementById('recentDate').value = item.work_date || '';
  document.getElementById('recentDescription').value = item.description || '';
  document.getElementById('recentLocation').value = item.location || '';
  document.getElementById('recentActive').checked = !!item.is_active;
  document.getElementById('recentSave').textContent = 'Salvar alterações';
  document.getElementById('recentCancel').hidden = false;
  document.getElementById('recentForm').scrollIntoView({behavior:'smooth',block:'center'});
}

async function saveItem(e) {
  e.preventDefault();
  const save = document.getElementById('recentSave');
  const payload = {
    gallery_category: document.getElementById('recentGallery').value,
    title: document.getElementById('recentTitle').value.trim(),
    description: document.getElementById('recentDescription').value.trim(),
    work_date: document.getElementById('recentDate').value || null,
    location: document.getElementById('recentLocation').value.trim() || 'Morrinhos, CE',
    sort_order: Number(document.getElementById('recentOrder').value || 0),
    is_active: document.getElementById('recentActive').checked,
    updated_at: new Date().toISOString()
  };
  save.disabled = true;
  save.textContent = editingId ? 'Salvando…' : 'Adicionando…';
  setStatus('');
  try {
    const query = editingId
      ? neon.from('recent_works').update(payload).eq('id', editingId)
      : neon.from('recent_works').insert(payload);
    const { error } = await query;
    if (error) throw error;
    setStatus(editingId ? 'Trabalho atualizado.' : 'Trabalho adicionado.', 'ok');
    resetForm();
    await loadRecentWorks();
  } catch (err) {
    console.error(err);
    setStatus('Não foi possível salvar este trabalho.', 'err');
  } finally {
    save.disabled = false;
    if (!editingId) save.textContent = 'Adicionar trabalho';
  }
}

async function deleteItem(item) {
  if (!confirm(`Excluir “${item.title}” dos trabalhos recentes?`)) return;
  setStatus('Excluindo…');
  const { error } = await neon.from('recent_works').delete().eq('id', item.id);
  if (error) {
    console.error(error);
    setStatus('Não foi possível excluir este trabalho.', 'err');
    return;
  }
  setStatus('Trabalho excluído.', 'ok');
  if (editingId === item.id) resetForm();
  await loadRecentWorks();
}

async function init() {
  if (initialized) return;
  const panel = document.getElementById('panelView');
  if (!panel || panel.hidden) return;
  initialized = true;
  injectStyles();
  buildSection(panel);
  try {
    await loadCategories();
    await loadRecentWorks();
    document.getElementById('recentForm').addEventListener('submit', saveItem);
    document.getElementById('recentCancel').addEventListener('click', resetForm);
    document.getElementById('recentRefresh').addEventListener('click', loadRecentWorks);
  } catch (err) {
    console.error(err);
    setStatus('Não foi possível iniciar a gestão de trabalhos recentes.', 'err');
  }
}

const panel = document.getElementById('panelView');
if (panel) {
  const obs = new MutationObserver(() => { if (!panel.hidden) init(); });
  obs.observe(panel, { attributes:true, attributeFilter:['hidden'] });
  if (!panel.hidden) init();
}
