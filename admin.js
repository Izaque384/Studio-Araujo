import { createClient, BetterAuthVanillaAdapter } from 'https://esm.sh/@neondatabase/neon-js@0.7.0-beta?bundle';

const AUTH_URL = 'https://ep-lucky-rice-axp36rxg.neonauth.c-4.us-east-2.aws.neon.tech/neondb/auth';
const DATA_API_URL = 'https://ep-lucky-rice-axp36rxg.apirest.c-4.us-east-2.aws.neon.tech/neondb/rest/v1';
const STORAGE_FN = 'https://br-gentle-water-axxtumld-siteimages.compute.c-4.us-east-2.aws.neon.tech/';
const MAX_FILE_BYTES = 25 * 1024 * 1024;

const neon = createClient({
  auth: {
    adapter: BetterAuthVanillaAdapter(),
    url: AUTH_URL
  },
  dataApi: { url: DATA_API_URL }
});

const $ = (id) => document.getElementById(id);
const authView = $('authView');
const panelView = $('panelView');
const authMsg = $('authMsg');
const libraryMsg = $('libraryMsg');
const loginForm = $('loginForm');
const googleBtn = $('googleBtn');
const logoutBtn = $('logoutBtn');
const uploadCategory = $('uploadCategory');
const filterCategory = $('filterCategory');
const uploadAlt = $('uploadAlt');
const fileInput = $('fileInput');
const uploadBtn = $('uploadBtn');
const uploadQueue = $('uploadQueue');
const imageGrid = $('imageGrid');
const dropzone = $('dropzone');
const refreshBtn = $('refreshBtn');

let categories = [];
let selectedFiles = [];
let currentUser = null;

function setMsg(el, text = '', type = '') {
  el.textContent = text;
  el.className = 'msg' + (type ? ' ' + type : '');
}
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
function humanBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

async function getSession() {
  const result = await neon.auth.getSession();
  return result?.data || result || null;
}

async function checkAdmin() {
  const { data, error } = await neon.from('site_admins').select('user_id,email').limit(1);
  if (error) return false;
  return Array.isArray(data) && data.length > 0;
}

async function boot() {
  try {
    const session = await getSession();
    if (!session?.user) return showAuth();
    currentUser = session.user;
    if (!(await checkAdmin())) {
      await neon.auth.signOut();
      setMsg(authMsg, 'Esta conta não tem acesso administrativo.', 'error');
      return showAuth();
    }
    await showPanel();
  } catch (err) {
    console.error(err);
    setMsg(authMsg, 'Não foi possível validar a sessão. Tente novamente.', 'error');
    showAuth();
  }
}

function showAuth() {
  authView.hidden = false;
  panelView.hidden = true;
}
async function showPanel() {
  authView.hidden = true;
  panelView.hidden = false;
  $('welcome').textContent = currentUser?.email || '';
  await loadCategories();
  await loadImages();
}

googleBtn.addEventListener('click', async () => {
  setMsg(authMsg, 'Abrindo o Google…');
  try {
    await neon.auth.signIn.social({
      provider: 'google',
      callbackURL: location.origin + '/admin.html'
    });
  } catch (err) {
    console.error(err);
    setMsg(authMsg, 'Não foi possível iniciar o login com Google.', 'error');
  }
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMsg(authMsg, 'Entrando…');
  try {
    const email = $('loginEmail').value.trim();
    const password = $('loginPassword').value;
    const result = await neon.auth.signIn.email({ email, password });
    if (result?.error) throw new Error(result.error.message || 'Credenciais inválidas.');
    const session = await getSession();
    currentUser = session?.user;
    if (!currentUser || !(await checkAdmin())) {
      await neon.auth.signOut();
      throw new Error('Esta conta não tem acesso administrativo.');
    }
    setMsg(authMsg, '');
    await showPanel();
  } catch (err) {
    setMsg(authMsg, err?.message || 'Não foi possível entrar.', 'error');
  }
});

logoutBtn.addEventListener('click', async () => {
  await neon.auth.signOut();
  currentUser = null;
  showAuth();
});

async function loadCategories() {
  const { data, error } = await neon.from('site_categories').select('slug,label,area,sort_order').order('sort_order', { ascending: true });
  if (error) throw error;
  categories = data || [];
  uploadCategory.innerHTML = categories.map(c => `<option value="${esc(c.slug)}">${esc(c.label)}</option>`).join('');
  filterCategory.innerHTML = '<option value="">Todas as categorias</option>' + categories.map(c => `<option value="${esc(c.slug)}">${esc(c.label)}</option>`).join('');
}

function categoryLabel(slug) {
  return categories.find(c => c.slug === slug)?.label || slug;
}

fileInput.addEventListener('change', () => setFiles([...fileInput.files]));
['dragenter','dragover'].forEach(type => dropzone.addEventListener(type, (e) => { e.preventDefault(); dropzone.classList.add('drag'); }));
['dragleave','drop'].forEach(type => dropzone.addEventListener(type, (e) => { e.preventDefault(); dropzone.classList.remove('drag'); }));
dropzone.addEventListener('drop', (e) => setFiles([...e.dataTransfer.files]));

function setFiles(files) {
  const valid = files.filter(f => /^image\/(jpeg|png|webp|avif)$/i.test(f.type) && f.size <= MAX_FILE_BYTES);
  selectedFiles = valid;
  uploadBtn.disabled = !valid.length;
  uploadQueue.innerHTML = valid.length
    ? valid.map(f => `<div class="queue-item"><span>${esc(f.name)}</span><span>${humanBytes(f.size)}</span></div>`).join('')
    : '<div class="queue-item"><span>Nenhuma imagem válida selecionada.</span><span></span></div>';
}

async function optimizeImage(file) {
  if (file.type === 'image/avif') return file;
  const bitmap = await createImageBitmap(file);
  const maxSide = 2400;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  canvas.getContext('2d', { alpha: true }).drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', .88));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' });
}

async function storageCall(payload) {
  const token = await neon.auth.getJWTToken?.();
  if (!token) throw new Error('Sessão expirada. Entre novamente.');
  const res = await fetch(STORAGE_FN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Falha no armazenamento.');
  return data;
}

uploadBtn.addEventListener('click', async () => {
  if (!selectedFiles.length) return;
  uploadBtn.disabled = true;
  const category = uploadCategory.value;
  const alt = uploadAlt.value.trim();
  let done = 0;
  setMsg(libraryMsg, '');
  try {
    for (const original of selectedFiles) {
      const file = await optimizeImage(original);
      uploadBtn.textContent = `Enviando ${done + 1} de ${selectedFiles.length}…`;
      const signed = await storageCall({ action: 'presign', category, fileName: file.name, contentType: file.type });
      const put = await fetch(signed.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!put.ok) throw new Error('O arquivo não pôde ser enviado.');

      const { error } = await neon.from('site_images').insert({
        storage_key: signed.storageKey,
        public_url: signed.publicUrl,
        category,
        alt_text: alt,
        sort_order: Date.now() + done,
        is_visible: true,
        is_cover: false,
        mime_type: file.type,
        bytes: file.size,
        created_by: currentUser?.id || null
      });
      if (error) {
        await storageCall({ action: 'delete', storageKey: signed.storageKey }).catch(() => {});
        throw error;
      }
      done++;
    }
    setMsg(libraryMsg, `${done} foto${done === 1 ? '' : 's'} enviada${done === 1 ? '' : 's'} com sucesso.`, 'success');
    selectedFiles = [];
    fileInput.value = '';
    uploadQueue.innerHTML = '';
    uploadAlt.value = '';
    await loadImages();
  } catch (err) {
    console.error(err);
    setMsg(libraryMsg, err?.message || 'Não foi possível concluir o envio.', 'error');
  } finally {
    uploadBtn.textContent = 'Enviar selecionadas';
    uploadBtn.disabled = !selectedFiles.length;
  }
});

filterCategory.addEventListener('change', loadImages);
refreshBtn.addEventListener('click', loadImages);

async function loadImages() {
  imageGrid.innerHTML = '<div class="empty">Carregando…</div>';
  let query = neon.from('site_images').select('*').order('category', { ascending: true }).order('sort_order', { ascending: true });
  if (filterCategory.value) query = query.eq('category', filterCategory.value);
  const { data, error } = await query;
  if (error) {
    console.error(error);
    imageGrid.innerHTML = '<div class="empty">Não foi possível carregar as fotos.</div>';
    return;
  }
  renderImages(data || []);
}

function renderImages(images) {
  if (!images.length) {
    imageGrid.innerHTML = '<div class="empty">Ainda não há fotos nesta categoria.</div>';
    return;
  }
  imageGrid.innerHTML = images.map(img => `
    <article class="photo-card" data-id="${esc(img.id)}" data-key="${esc(img.storage_key)}">
      <figure><img src="${esc(img.public_url)}" alt="${esc(img.alt_text || categoryLabel(img.category))}" loading="lazy"></figure>
      <div class="photo-body">
        <div class="photo-meta"><span>${esc(categoryLabel(img.category))}</span><span>${humanBytes(Number(img.bytes || 0))}</span></div>
        <div class="photo-row">
          <select class="card-category" aria-label="Categoria">${categories.map(c => `<option value="${esc(c.slug)}" ${c.slug === img.category ? 'selected' : ''}>${esc(c.label)}</option>`).join('')}</select>
          <input class="card-order" type="number" value="${Number(img.sort_order || 0)}" aria-label="Ordem">
        </div>
        <input class="card-alt" type="text" maxlength="180" value="${esc(img.alt_text || '')}" placeholder="Texto alternativo">
        <div class="toggles">
          <label><input class="card-visible" type="checkbox" ${img.is_visible ? 'checked' : ''}> Publicada</label>
          <label><input class="card-cover" type="checkbox" ${img.is_cover ? 'checked' : ''}> Capa</label>
        </div>
        <div class="card-actions">
          <button type="button" class="btn save-btn">Salvar</button>
          <button type="button" class="btn btn-danger delete-btn">Excluir</button>
        </div>
      </div>
    </article>`).join('');

  imageGrid.querySelectorAll('.photo-card').forEach(card => {
    card.querySelector('.save-btn').addEventListener('click', () => saveCard(card));
    card.querySelector('.delete-btn').addEventListener('click', () => deleteCard(card));
  });
}

async function saveCard(card) {
  const id = card.dataset.id;
  const category = card.querySelector('.card-category').value;
  const isCover = card.querySelector('.card-cover').checked;
  const payload = {
    category,
    sort_order: Number(card.querySelector('.card-order').value || 0),
    alt_text: card.querySelector('.card-alt').value.trim(),
    is_visible: card.querySelector('.card-visible').checked,
    is_cover: isCover
  };
  const btn = card.querySelector('.save-btn');
  btn.disabled = true; btn.textContent = 'Salvando…';
  try {
    if (isCover) {
      const { error: coverError } = await neon.from('site_images').update({ is_cover: false }).eq('category', category).neq('id', id);
      if (coverError) throw coverError;
    }
    const { error } = await neon.from('site_images').update(payload).eq('id', id);
    if (error) throw error;
    setMsg(libraryMsg, 'Alterações salvas.', 'success');
    await loadImages();
  } catch (err) {
    console.error(err);
    setMsg(libraryMsg, 'Não foi possível salvar esta foto.', 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Salvar';
  }
}

async function deleteCard(card) {
  if (!confirm('Excluir esta foto do site e do armazenamento?')) return;
  const id = card.dataset.id;
  const storageKey = card.dataset.key;
  const btn = card.querySelector('.delete-btn');
  btn.disabled = true; btn.textContent = 'Excluindo…';
  try {
    const { error } = await neon.from('site_images').delete().eq('id', id);
    if (error) throw error;
    await storageCall({ action: 'delete', storageKey });
    card.remove();
    setMsg(libraryMsg, 'Foto excluída.', 'success');
    if (!imageGrid.querySelector('.photo-card')) imageGrid.innerHTML = '<div class="empty">Ainda não há fotos nesta categoria.</div>';
  } catch (err) {
    console.error(err);
    setMsg(libraryMsg, 'Não foi possível excluir esta foto.', 'error');
    btn.disabled = false; btn.textContent = 'Excluir';
  }
}

boot();
