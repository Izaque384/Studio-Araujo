import { createClient } from 'https://esm.sh/@neondatabase/neon-js@0.7.0-beta?bundle';

const AUTH_URL = 'https://ep-lucky-rice-axp36rxg.neonauth.c-4.us-east-2.aws.neon.tech/neondb/auth';
const DATA_API_URL = 'https://ep-lucky-rice-axp36rxg.apirest.c-4.us-east-2.aws.neon.tech/neondb/rest/v1';
const STORAGE_FN = 'https://br-gentle-water-axxtumld-siteimages.compute.c-4.us-east-2.aws.neon.tech/';
const RECENT_MEDIA_CATEGORY = 'recent-work-media';
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const neon = createClient({ auth: { url: AUTH_URL }, dataApi: { url: DATA_API_URL } });

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let initialized = false;
let categories = [];
let editingId = null;
let mediaWorkId = null;
let mediaWorkCategory = null;
let recentWorkCount = 0;

function injectStyles() {
  if (document.getElementById('recentAdminStyles')) return;
  const style = document.createElement('style');
  style.id = 'recentAdminStyles';
  style.textContent = `
    .recent-admin{margin-top:0;padding:20px 0 4px;border:0;border-radius:0;background:transparent}
    .recent-admin-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:18px;padding-top:4px}
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
    .recent-step-label{grid-column:1/-1;display:flex;align-items:center;gap:11px;margin:2px 0 14px;color:#f3ecdc}.recent-step-label>span{display:grid;place-items:center;width:29px;height:29px;flex:0 0 29px;border:1px solid rgba(201,162,75,.35);border-radius:50%;color:#e6c878;font-size:.74rem;font-weight:600;background:rgba(201,162,75,.05)}.recent-step-label div{display:grid;gap:1px}.recent-step-label strong{font-size:.85rem;font-weight:500}.recent-step-label small{color:#a89d86;font-size:.72rem}.recent-step-media{margin:0 0 16px}
    .recent-media-manager{position:relative;margin:22px 0 26px;padding:22px;border:1px solid rgba(201,162,75,.18);border-radius:16px;background:#0d0c0a}
    .recent-media-topbar{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:18px;padding-right:34px}.recent-step-media{margin:0}.recent-media-close{position:absolute;top:14px;right:14px;width:32px;height:32px;display:grid;place-items:center;border:1px solid rgba(201,162,75,.18);border-radius:50%;background:transparent;color:#a89d86;font-size:1.35rem;line-height:1;cursor:pointer;transition:.2s}.recent-media-close:hover{color:#f3ecdc;border-color:rgba(230,200,120,.45);background:rgba(201,162,75,.06)}
    .recent-media-context{display:grid;gap:5px;padding:14px 16px;margin-bottom:16px;border:1px solid rgba(201,162,75,.11);border-radius:12px;background:rgba(201,162,75,.025)}.recent-media-context-label{color:#817765;font-size:.65rem;text-transform:uppercase;letter-spacing:.12em}.recent-media-context strong{font-size:1rem;font-weight:500;color:#f3ecdc}
    .recent-media-upload{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:8px}.recent-media-upload input{display:none}.recent-media-add{display:inline-flex;align-items:center;justify-content:center;gap:7px;width:auto;min-width:210px}.recent-media-add-icon{font-size:1rem;line-height:1}.recent-media-upload-help{color:#756d5d;font-size:.72rem}.recent-media-status{display:block;margin:6px 0 14px;min-height:18px}
    .recent-media-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.recent-media-grid:empty{min-height:118px;border:1px dashed rgba(201,162,75,.15);border-radius:12px;display:grid;place-items:center}.recent-media-grid:empty:before{content:'Nenhuma mídia adicionada ainda.';color:#817765;font-size:.82rem}.recent-media-card{border:1px solid rgba(201,162,75,.14);border-radius:12px;overflow:hidden;background:#12100d}.recent-media-card figure{margin:0;aspect-ratio:4/3;background:#070706}.recent-media-card img,.recent-media-card video{width:100%;height:100%;object-fit:cover}.recent-media-card-body{padding:9px;display:grid;gap:8px}.recent-media-card-body input{width:100%;background:#0e0d0b;border:1px solid rgba(201,162,75,.18);color:#f3ecdc;border-radius:8px;padding:8px}.recent-media-actions{display:flex;gap:6px;flex-wrap:wrap}.recent-media-actions .btn{padding:7px 9px;font-size:.72rem}.recent-cover-on{color:#e6c878;border-color:rgba(230,200,120,.5)!important}
    .recent-card-footer{display:flex;justify-content:flex-end;gap:10px;margin-top:22px;padding-top:18px;border-top:1px solid rgba(201,162,75,.12)}.recent-footer-save{min-width:150px}.recent-footer-save:disabled{cursor:not-allowed}
    @media(max-width:980px){.recent-media-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:760px){.recent-form{grid-template-columns:1fr}.recent-span-2{grid-column:auto}.recent-row{grid-template-columns:1fr}.recent-row-actions{justify-content:flex-start}.recent-admin{padding:20px}.recent-media-manager{padding:16px}.recent-media-topbar{align-items:stretch}.recent-media-add{width:100%}.recent-media-upload-help{width:100%}}
  `;
  document.head.appendChild(style);
}

function buildSection(panel) {
  if (document.getElementById('recentAdmin')) return;
  const mount = document.getElementById('recentAdminMount');
  if (!mount) return;
  const section = document.createElement('section');
  section.id = 'recentAdmin';
  section.className = 'recent-admin';
  section.innerHTML = `
    <div class="recent-admin-head">
      <div>
        <p class="eyebrow">Home</p>
        <h2>Trabalhos recentes</h2>
        <p class="recent-admin-note">Crie o trabalho primeiro e, em seguida, adicione suas fotos e vídeos. É possível cadastrar no máximo 3 trabalhos, que são exibidos na Home de acordo com a ordem.</p>
      </div>
    </div>

    <div class="recent-step-label"><span>1</span><div><strong>Informações do trabalho</strong><small>Título, categoria, data e publicação</small></div></div>
    <form id="recentForm" class="recent-form">
      <label>Categoria
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
        <button type="button" class="btn btn-ghost" id="recentCancel" hidden>Cancelar edição</button>
      </div>
    </form>
    <section id="recentMediaManager" class="recent-media-manager" hidden>
      <div class="recent-media-topbar">
        <div class="recent-step-label recent-step-media"><span>2</span><div><strong>Fotos e vídeos</strong><small>Adicione as mídias, escolha a capa e organize a ordem</small></div></div>
        <button type="button" class="recent-media-close" id="recentMediaClose" aria-label="Fechar" title="Fechar">×</button>
      </div>
      <div class="recent-media-context">
        <span class="recent-media-context-label">Trabalho selecionado</span>
        <strong id="recentMediaTitle">Selecione um trabalho para gerenciar suas fotos e vídeos.</strong>
      </div>
      <div class="recent-media-upload">
        <label class="btn btn-primary recent-media-add" for="recentMediaInput"><span class="recent-media-add-icon">＋</span>Adicionar fotos ou vídeos</label>
        <input id="recentMediaInput" type="file" accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm" multiple>
        <span class="recent-media-upload-help">JPG, PNG, WebP, AVIF, MP4 ou WebM</span>
      </div>
      <span id="recentMediaStatus" class="recent-status recent-media-status"></span>
      <div id="recentMediaGrid" class="recent-media-grid"></div>
    </section>
    <p id="recentStatus" class="recent-status" aria-live="polite"></p>
    <div id="recentList" class="recent-list"></div>
    <div class="recent-card-footer">
      <button type="submit" form="recentForm" class="btn btn-primary recent-footer-save" id="recentSave">Salvar</button>
    </div>
  `;
  mount.appendChild(section);
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
  categories = (data || []).filter(c => c.area === 'portfolio' && c.slug !== RECENT_MEDIA_CATEGORY);
  const sel = document.getElementById('recentGallery');
  if (sel) sel.innerHTML = categories.map(c => `<option value="${esc(c.slug)}">${esc(c.label.replace(/^Portfólio\s*[—-]\s*/i, ''))}</option>`).join('');
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
  recentWorkCount = items.length;
  updateRecentLimitState();
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
        <button type="button" class="btn btn-ghost recent-media">Mídias</button><button type="button" class="btn btn-ghost recent-edit">Editar</button>
        <button type="button" class="btn btn-danger recent-delete">Excluir</button>
      </div>
    </article>`).join('');

  list.querySelectorAll('.recent-row').forEach(row => {
    const item = items.find(i => i.id === row.dataset.id);
    row.querySelector('.recent-media').addEventListener('click', () => openMediaManager(item));
    row.querySelector('.recent-edit').addEventListener('click', () => editItem(item));
    row.querySelector('.recent-delete').addEventListener('click', () => deleteItem(item));
  });
}

function updateRecentLimitState(){
  const save=document.getElementById('recentSave');
  if(!save)return;
  const atLimit=recentWorkCount>=3 && !editingId;
  save.disabled=atLimit;
  save.textContent=atLimit?'Limite de 3 trabalhos atingido':'Salvar';
  const form=document.getElementById('recentForm');
  if(form)form.classList.toggle('recent-limit-reached',atLimit);
  if(atLimit)setStatus('Você já cadastrou o máximo de 3 trabalhos recentes. Exclua um trabalho para adicionar outro.','');
}

function resetForm() {
  editingId = null;
  closeMediaManager();
  document.getElementById('recentForm')?.reset();
  const loc = document.getElementById('recentLocation'); if (loc) loc.value = 'Morrinhos, CE';
  const active = document.getElementById('recentActive'); if (active) active.checked = true;
  const save = document.getElementById('recentSave'); if (save) save.textContent = 'Salvar';
  updateRecentLimitState();
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
  document.getElementById('recentSave').disabled = false;
  document.getElementById('recentSave').textContent = 'Salvar';
  document.getElementById('recentCancel').hidden = false;
  openMediaManager(item);
  document.getElementById('recentForm').scrollIntoView({behavior:'smooth',block:'center'});
}

async function saveItem(e) {
  e.preventDefault();
  const save = document.getElementById('recentSave');
  if(!editingId && recentWorkCount>=3){
    setStatus('Limite de 3 trabalhos recentes atingido. Exclua um trabalho antes de cadastrar outro.','err');
    updateRecentLimitState();
    return;
  }
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
  save.textContent = 'Salvando…';
  setStatus('');
  try {
    const wasEditing = !!editingId;
    let savedItem = null;
    if (wasEditing) {
      const { error } = await neon.from('recent_works').update(payload).eq('id', editingId);
      if (error) throw error;
    } else {
      const { data, error } = await neon.from('recent_works').insert(payload).select('*').single();
      if (error) throw error;
      savedItem = data;
    }
    setStatus(wasEditing ? 'Trabalho atualizado.' : 'Trabalho criado. Agora adicione as fotos ou vídeos.', 'ok');
    resetForm();
    await loadRecentWorks();
    if (savedItem) {
      await openMediaManager(savedItem);
      setMediaStatus('Trabalho criado com sucesso. Adicione as mídias abaixo para concluir.', 'ok');
    }
  } catch (err) {
    console.error(err);
    setStatus('Não foi possível salvar este trabalho.', 'err');
  } finally {
    save.disabled = false;
    if (!editingId) save.textContent = 'Salvar';
    updateRecentLimitState();
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


function setMediaStatus(text='', type='') {
  const el=document.getElementById('recentMediaStatus'); if(!el)return;
  el.textContent=text; el.className='recent-status'+(type?' '+type:'');
}
function isVideoFile(file){return /^video\//i.test(file?.type||'');}
function fileIssue(file){
  const image=/^image\/(jpeg|png|webp|avif)$/i.test(file.type),video=/^video\/(mp4|webm)$/i.test(file.type);
  if(!image&&!video)return'Formato não aceito';
  if(image&&file.size>MAX_IMAGE_BYTES)return'Foto acima de 25 MB';
  if(video&&file.size>MAX_VIDEO_BYTES)return'Vídeo acima de 100 MB';
  return'';
}
async function optimizeImage(file){
  if(isVideoFile(file)||file.type==='image/avif')return file;
  try{const bitmap=await createImageBitmap(file),maxSide=2400,scale=Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height));const w=Math.max(1,Math.round(bitmap.width*scale)),h=Math.max(1,Math.round(bitmap.height*scale));const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;canvas.getContext('2d',{alpha:true}).drawImage(bitmap,0,0,w,h);bitmap.close();const blob=await new Promise(r=>canvas.toBlob(r,'image/webp',.88));return blob?new File([blob],file.name.replace(/\.[^.]+$/,'')+'.webp',{type:'image/webp'}):file;}catch(_){return file;}
}
async function storageCall(payload){
  const token=await neon.auth.getJWTToken?.(); if(!token)throw new Error('Sessão expirada. Entre novamente.');
  const res=await fetch(STORAGE_FN,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(payload)});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||'Falha no armazenamento.');return data;
}
async function loadWorkMedia(){
  const grid=document.getElementById('recentMediaGrid'); if(!grid||!mediaWorkId)return;
  grid.innerHTML='<div class="recent-empty">Carregando mídias…</div>';
  const {data:media,error}=await neon.from('site_images').select('id,public_url,storage_key,mime_type,bytes,alt_text,sort_order,is_cover').eq('recent_work_id',mediaWorkId).order('sort_order',{ascending:true});
  if(error){console.error('Falha ao carregar mídias do trabalho',error);grid.innerHTML='<div class="recent-empty">Não foi possível carregar as mídias.</div>';setMediaStatus(error.message||'Não foi possível carregar as mídias.','err');return;}
  if(!media?.length){grid.innerHTML='<div class="recent-empty">Nenhuma mídia adicionada ainda.</div>';return;}
  grid.innerHTML=media.map(m=>{const video=String(m.mime_type||'').startsWith('video/');const preview=video?`<video src="${esc(m.public_url)}" controls preload="metadata"></video>`:`<img src="${esc(m.public_url)}" alt="${esc(m.alt_text||'')}" loading="lazy">`;return `<article class="recent-media-card" data-media-id="${esc(m.id)}" data-key="${esc(m.storage_key)}"><figure>${preview}</figure><div class="recent-media-card-body"><label>Ordem<input class="recent-media-order" type="number" value="${Number(m.sort_order||0)}"></label><div class="recent-media-actions"><button type="button" class="btn btn-ghost recent-set-cover ${m.is_cover?'recent-cover-on':''}" ${video?'disabled title="Vídeo não pode ser capa"':''}>${m.is_cover?'Capa atual':'Definir capa'}</button><button type="button" class="btn btn-danger recent-remove-media">Excluir</button></div></div></article>`}).join('');
  grid.querySelectorAll('.recent-media-card').forEach(card=>{card.querySelector('.recent-media-order')?.addEventListener('change',()=>updateMediaOrder(card));card.querySelector('.recent-set-cover')?.addEventListener('click',()=>setWorkCover(card));card.querySelector('.recent-remove-media')?.addEventListener('click',()=>deleteWorkMedia(card));});
}
async function openMediaManager(item){
  mediaWorkCategory=item?.gallery_category||null;mediaWorkId=item.id;const box=document.getElementById('recentMediaManager');if(!box)return;box.hidden=false;document.getElementById('recentMediaTitle').textContent=item.title;setMediaStatus('');await loadWorkMedia();box.scrollIntoView({behavior:'smooth',block:'start'});
}
function closeMediaManager(){
  mediaWorkCategory=null;mediaWorkId=null;const box=document.getElementById('recentMediaManager');if(box)box.hidden=true;const input=document.getElementById('recentMediaInput');if(input)input.value='';
}
async function uploadWorkMedia(files){
  if(!mediaWorkId||!files.length)return;
  const valid=files.filter(f=>!fileIssue(f));const invalid=files.length-valid.length;
  if(!valid.length){setMediaStatus('Nenhum arquivo válido selecionado.','err');return;}
  setMediaStatus(`Enviando 0 de ${valid.length}…`);let done=0;
  try{
    // A grade já contém as mídias atuais do trabalho. Usar seus valores elimina
    // a antiga consulta extra ao Data API que falhava com HTTP 404 antes do upload.
    const visibleOrders=[...document.querySelectorAll('#recentMediaGrid .recent-media-order')]
      .map(input=>Number(input.value||0)).filter(Number.isFinite);
    let order=visibleOrders.length?Math.max(...visibleOrders)+1:1;
    for(const original of valid){
      const uploader=window.studioUploadMedia;
      if(typeof uploader!=='function')throw new Error('O uploader principal do painel não está disponível. Recarregue a página.');
      await uploader({file:original,storageCategory:(mediaWorkCategory||categories[0]?.slug||'portfolio-casamentos'),databaseCategory:RECENT_MEDIA_CATEGORY,altText:'',sortOrder:order,recentWorkId:mediaWorkId});
      done++;order++;setMediaStatus(`Enviando ${done} de ${valid.length}…`);
    }
    setMediaStatus(`${done} arquivo${done===1?'':'s'} enviado${done===1?'':'s'}${invalid?` · ${invalid} ignorado${invalid===1?'':'s'}`:''}.`,'ok');
    await loadWorkMedia();
  }catch(err){
    console.error('Upload de trabalho recente falhou',err);
    setMediaStatus(`Falha no upload: ${err?.message||'erro desconhecido'}`,'err');
  }
}
async function updateMediaOrder(card){
  const mediaId=card.dataset.mediaId,order=Number(card.querySelector('.recent-media-order').value||0);
  const {error}=await neon.from('site_images').update({sort_order:order}).eq('id',mediaId).eq('recent_work_id',mediaWorkId);
  setMediaStatus(error?'Não foi possível alterar a ordem.':'Ordem atualizada.',error?'err':'ok');if(!error)await loadWorkMedia();
}
async function setWorkCover(card){
  const mediaId=card.dataset.mediaId;setMediaStatus('Atualizando capa…');
  const {error:e1}=await neon.from('site_images').update({is_cover:false}).eq('recent_work_id',mediaWorkId);if(e1){setMediaStatus('Não foi possível atualizar a capa.','err');return;}
  const {error:e2}=await neon.from('site_images').update({is_cover:true}).eq('id',mediaId).eq('recent_work_id',mediaWorkId);setMediaStatus(e2?'Não foi possível definir a capa.':'Capa atualizada.',e2?'err':'ok');if(!e2)await loadWorkMedia();
}
async function deleteWorkMedia(card){
  if(!confirm('Excluir esta mídia deste trabalho?'))return;const mediaId=card.dataset.mediaId,key=card.dataset.key;setMediaStatus('Excluindo…');
  const {error}=await neon.from('site_images').delete().eq('id',mediaId).eq('recent_work_id',mediaWorkId);if(error){setMediaStatus('Não foi possível excluir esta mídia.','err');return;}
  if(key&&!key.startsWith('legacy:')){const deleter=window.studioStorageCall||storageCall;await deleter({action:'delete',storageKey:key}).catch(()=>{});}setMediaStatus('Mídia excluída.','ok');await loadWorkMedia();
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
    document.getElementById('recentMediaInput').addEventListener('change',e=>uploadWorkMedia([...e.target.files]).finally(()=>{e.target.value='';}));
    document.getElementById('recentMediaClose').addEventListener('click',closeMediaManager);
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
