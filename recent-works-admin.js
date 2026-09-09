import { createClient } from 'https://esm.sh/@neondatabase/neon-js@latest?bundle';

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
    .recent-media-manager{margin:22px 0 26px;padding:18px;border:1px solid rgba(201,162,75,.18);border-radius:14px;background:#0f0e0c}
    .recent-media-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:14px}.recent-media-head h3{margin:0 0 4px;font-size:1.2rem}.recent-media-head p{margin:0;color:#a89d86;font-size:.8rem}
    .recent-media-upload{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px}.recent-media-upload input{display:none}.recent-media-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.recent-media-card{border:1px solid rgba(201,162,75,.14);border-radius:12px;overflow:hidden;background:#12100d}.recent-media-card figure{margin:0;aspect-ratio:4/3;background:#070706}.recent-media-card img,.recent-media-card video{width:100%;height:100%;object-fit:cover}.recent-media-card-body{padding:9px;display:grid;gap:8px}.recent-media-card-body input{width:100%;background:#0e0d0b;border:1px solid rgba(201,162,75,.18);color:#f3ecdc;border-radius:8px;padding:8px}.recent-media-actions{display:flex;gap:6px;flex-wrap:wrap}.recent-media-actions .btn{padding:7px 9px;font-size:.72rem}.recent-cover-on{color:#e6c878;border-color:rgba(230,200,120,.5)!important}
    @media(max-width:980px){.recent-media-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
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
        <p class="recent-admin-note">Cada trabalho pode ter suas próprias fotos e vídeos. A Home mostra os 3 primeiros itens ativos, de acordo com a ordem.</p>
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
    <section id="recentMediaManager" class="recent-media-manager" hidden>
      <div class="recent-media-head"><div><h3>Mídias deste trabalho</h3><p id="recentMediaTitle">Selecione um trabalho para gerenciar suas fotos e vídeos.</p></div><button type="button" class="btn btn-ghost" id="recentMediaClose">Fechar</button></div>
      <div class="recent-media-upload"><label class="btn btn-primary" for="recentMediaInput">Adicionar fotos ou vídeos</label><input id="recentMediaInput" type="file" accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm" multiple><span id="recentMediaStatus" class="recent-status"></span></div>
      <div id="recentMediaGrid" class="recent-media-grid"></div>
    </section>
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

function resetForm() {
  editingId = null;
  closeMediaManager();
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
  openMediaManager(item);
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
  const {data:links,error}=await neon.from('recent_work_media').select('media_id,sort_order,is_cover').eq('recent_work_id',mediaWorkId).order('sort_order',{ascending:true});
  if(error){grid.innerHTML='<div class="recent-empty">Não foi possível carregar as mídias.</div>';return;}
  if(!links?.length){grid.innerHTML='<div class="recent-empty">Nenhuma mídia adicionada ainda.</div>';return;}
  const ids=links.map(x=>x.media_id); const {data:media,error:mediaError}=await neon.from('site_images').select('id,public_url,storage_key,mime_type,bytes,alt_text').in('id',ids);
  if(mediaError){grid.innerHTML='<div class="recent-empty">Não foi possível carregar os arquivos.</div>';return;}
  const map=new Map((media||[]).map(m=>[m.id,m]));
  grid.innerHTML=links.map(link=>{const m=map.get(link.media_id);if(!m)return'';const video=String(m.mime_type||'').startsWith('video/');const preview=video?`<video src="${esc(m.public_url)}" controls preload="metadata"></video>`:`<img src="${esc(m.public_url)}" alt="${esc(m.alt_text||'')}" loading="lazy">`;return `<article class="recent-media-card" data-media-id="${esc(m.id)}" data-key="${esc(m.storage_key)}"><figure>${preview}</figure><div class="recent-media-card-body"><label>Ordem<input class="recent-media-order" type="number" value="${Number(link.sort_order||0)}"></label><div class="recent-media-actions"><button type="button" class="btn btn-ghost recent-set-cover ${link.is_cover?'recent-cover-on':''}" ${video?'disabled title="Vídeo não pode ser capa"':''}>${link.is_cover?'Capa atual':'Definir capa'}</button><button type="button" class="btn btn-danger recent-remove-media">Excluir</button></div></div></article>`}).join('');
  grid.querySelectorAll('.recent-media-card').forEach(card=>{card.querySelector('.recent-media-order')?.addEventListener('change',()=>updateMediaOrder(card));card.querySelector('.recent-set-cover')?.addEventListener('click',()=>setWorkCover(card));card.querySelector('.recent-remove-media')?.addEventListener('click',()=>deleteWorkMedia(card));});
}
async function openMediaManager(item){mediaWorkId=item.id;const box=document.getElementById('recentMediaManager');if(!box)return;box.hidden=false;document.getElementById('recentMediaTitle').textContent=item.title;setMediaStatus('');await loadWorkMedia();box.scrollIntoView({behavior:'smooth',block:'start'});}
function closeMediaManager(){mediaWorkId=null;const box=document.getElementById('recentMediaManager');if(box)box.hidden=true;const input=document.getElementById('recentMediaInput');if(input)input.value='';}
async function uploadWorkMedia(files){
  if(!mediaWorkId||!files.length)return; const valid=files.filter(f=>!fileIssue(f)); const invalid=files.length-valid.length;if(!valid.length){setMediaStatus('Nenhum arquivo válido selecionado.','err');return;}
  setMediaStatus(`Enviando 0 de ${valid.length}…`); let done=0;
  try{const {data:existing}=await neon.from('recent_work_media').select('sort_order').eq('recent_work_id',mediaWorkId).order('sort_order',{ascending:false}).limit(1);let order=existing?.length?Number(existing[0].sort_order||0)+1:1;
    for(const original of valid){const file=await optimizeImage(original);const signed=await storageCall({action:'presign',category:RECENT_MEDIA_CATEGORY,fileName:file.name,contentType:file.type});const put=await fetch(signed.uploadUrl,{method:'PUT',headers:{'Content-Type':file.type},body:file});if(!put.ok)throw new Error(`Não foi possível enviar ${original.name}.`);const {data:inserted,error}=await neon.from('site_images').insert({storage_key:signed.storageKey,public_url:signed.publicUrl,category:RECENT_MEDIA_CATEGORY,alt_text:'',sort_order:order,is_visible:true,is_cover:false,mime_type:file.type,bytes:file.size}).select('id').single();if(error){await storageCall({action:'delete',storageKey:signed.storageKey}).catch(()=>{});throw error;}const {error:linkError}=await neon.from('recent_work_media').insert({recent_work_id:mediaWorkId,media_id:inserted.id,sort_order:order,is_cover:false});if(linkError){await neon.from('site_images').delete().eq('id',inserted.id);await storageCall({action:'delete',storageKey:signed.storageKey}).catch(()=>{});throw linkError;}done++;order++;setMediaStatus(`Enviando ${done} de ${valid.length}…`);}
    setMediaStatus(`${done} arquivo${done===1?'':'s'} enviado${done===1?'':'s'}${invalid?` · ${invalid} ignorado${invalid===1?'':'s'}`:''}.`,'ok');await loadWorkMedia();
  }catch(err){console.error(err);setMediaStatus(err?.message||'Não foi possível enviar as mídias.','err');}
}
async function updateMediaOrder(card){const mediaId=card.dataset.mediaId,order=Number(card.querySelector('.recent-media-order').value||0);const {error}=await neon.from('recent_work_media').update({sort_order:order}).eq('recent_work_id',mediaWorkId).eq('media_id',mediaId);setMediaStatus(error?'Não foi possível alterar a ordem.':'Ordem atualizada.',error?'err':'ok');if(!error)await loadWorkMedia();}
async function setWorkCover(card){const mediaId=card.dataset.mediaId;setMediaStatus('Atualizando capa…');const {error:e1}=await neon.from('recent_work_media').update({is_cover:false}).eq('recent_work_id',mediaWorkId);if(e1){setMediaStatus('Não foi possível atualizar a capa.','err');return;}const {error:e2}=await neon.from('recent_work_media').update({is_cover:true}).eq('recent_work_id',mediaWorkId).eq('media_id',mediaId);setMediaStatus(e2?'Não foi possível definir a capa.':'Capa atualizada.',e2?'err':'ok');if(!e2)await loadWorkMedia();}
async function deleteWorkMedia(card){if(!confirm('Excluir esta mídia deste trabalho?'))return;const mediaId=card.dataset.mediaId,key=card.dataset.key;setMediaStatus('Excluindo…');const {error}=await neon.from('site_images').delete().eq('id',mediaId);if(error){setMediaStatus('Não foi possível excluir esta mídia.','err');return;}if(key&&!key.startsWith('legacy:'))await storageCall({action:'delete',storageKey:key}).catch(()=>{});setMediaStatus('Mídia excluída.','ok');await loadWorkMedia();}

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
