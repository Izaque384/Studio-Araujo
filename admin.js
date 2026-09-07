import { createClient, BetterAuthVanillaAdapter } from 'https://esm.sh/@neondatabase/neon-js@0.7.0-beta?bundle';

const AUTH_URL = 'https://ep-lucky-rice-axp36rxg.neonauth.c-4.us-east-2.aws.neon.tech/neondb/auth';
const DATA_API_URL = 'https://ep-lucky-rice-axp36rxg.apirest.c-4.us-east-2.aws.neon.tech/neondb/rest/v1';
const STORAGE_FN = 'https://br-gentle-water-axxtumld-siteimages.compute.c-4.us-east-2.aws.neon.tech/';
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

const neon = createClient({ auth: { adapter: BetterAuthVanillaAdapter(), url: AUTH_URL }, dataApi: { url: DATA_API_URL } });
const $ = id => document.getElementById(id);
const authView=$('authView'), panelView=$('panelView'), authMsg=$('authMsg'), libraryMsg=$('libraryMsg');
const loginForm=$('loginForm'), googleBtn=$('googleBtn'), logoutBtn=$('logoutBtn');
const uploadCategory=$('uploadCategory'), filterCategory=$('filterCategory'), uploadAlt=$('uploadAlt');
const fileInput=$('fileInput'), uploadBtn=$('uploadBtn'), uploadQueue=$('uploadQueue'), uploadSummary=$('uploadSummary');
const imageGrid=$('imageGrid'), dropzone=$('dropzone'), refreshBtn=$('refreshBtn');
const filterSearch=$('filterSearch'), filterType=$('filterType'), filterVisibility=$('filterVisibility'), filterSort=$('filterSort');
let categories=[], queueEntries=[], currentUser=null, allMedia=[];

function setMsg(el,text='',type=''){if(!el)return;el.textContent=text;el.className='msg'+(type?' '+type:'');}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function humanBytes(bytes){if(!bytes)return'—';if(bytes<1024*1024)return Math.max(1,Math.round(bytes/1024))+' KB';return(bytes/1024/1024).toFixed(1)+' MB';}
function isVideoType(type){return /^video\//i.test(type||'');}
function fileIssue(f){
  const image=/^image\/(jpeg|png|webp|avif)$/i.test(f.type);
  const video=/^video\/(mp4|webm)$/i.test(f.type);
  if(!image&&!video)return'Formato não aceito';
  if(image&&f.size>MAX_IMAGE_BYTES)return'Foto acima de 25 MB';
  if(video&&f.size>MAX_VIDEO_BYTES)return'Vídeo acima de 100 MB';
  return'';
}
function validFile(f){return !fileIssue(f);}
async function getSession(){const r=await neon.auth.getSession();return r?.data||r||null;}
async function checkAdmin(){const {data,error}=await neon.from('site_admins').select('user_id,email').limit(1);return !error&&Array.isArray(data)&&data.length>0;}

async function boot(){
  try{
    const s=await getSession();
    if(!s?.user)return showAuth();
    currentUser=s.user;
    if(!(await checkAdmin())){
      await neon.auth.signOut();
      setMsg(authMsg,'Esta conta não tem acesso administrativo.','error');
      return showAuth();
    }
    await showPanel();
  }catch(e){
    console.error(e);
    setMsg(authMsg,'Não foi possível validar a sessão. Tente novamente.','error');
    showAuth();
  }
}
function showAuth(){authView.hidden=false;panelView.hidden=true;}
async function showPanel(){authView.hidden=true;panelView.hidden=false;$('welcome').textContent=currentUser?.email||'';await loadCategories();await loadMedia();}

googleBtn.addEventListener('click',async()=>{
  setMsg(authMsg,'Abrindo o Google…');
  try{await neon.auth.signIn.social({provider:'google',callbackURL:location.origin+'/painel'});}
  catch(e){console.error(e);setMsg(authMsg,'Não foi possível iniciar o login com Google.','error');}
});
loginForm.addEventListener('submit',async e=>{
  e.preventDefault();setMsg(authMsg,'Entrando…');
  try{
    const email=$('loginEmail').value.trim(),password=$('loginPassword').value;
    const r=await neon.auth.signIn.email({email,password});
    if(r?.error)throw new Error(r.error.message||'Credenciais inválidas.');
    const s=await getSession();currentUser=s?.user;
    if(!currentUser||!(await checkAdmin())){await neon.auth.signOut();throw new Error('Esta conta não tem acesso administrativo.');}
    setMsg(authMsg,'');await showPanel();
  }catch(err){setMsg(authMsg,err?.message||'Não foi possível entrar.','error');}
});
logoutBtn.addEventListener('click',async()=>{await neon.auth.signOut();currentUser=null;showAuth();});

async function loadCategories(){
  const {data,error}=await neon.from('site_categories').select('slug,label,area,sort_order').order('sort_order',{ascending:true});
  if(error)throw error;
  categories=data||[];
  uploadCategory.innerHTML=categories.map(c=>`<option value="${esc(c.slug)}">${esc(c.label)}</option>`).join('');
  filterCategory.innerHTML='<option value="">Todas</option>'+categories.map(c=>`<option value="${esc(c.slug)}">${esc(c.label)}</option>`).join('');
}
function categoryLabel(slug){return categories.find(c=>c.slug===slug)?.label||slug;}
function categoryRank(slug){const i=categories.findIndex(c=>c.slug===slug);return i<0?9999:i;}

fileInput.addEventListener('change',()=>setFiles([...fileInput.files]));
['dragenter','dragover'].forEach(t=>dropzone.addEventListener(t,e=>{e.preventDefault();dropzone.classList.add('drag');}));
['dragleave','drop'].forEach(t=>dropzone.addEventListener(t,e=>{e.preventDefault();dropzone.classList.remove('drag');}));
dropzone.addEventListener('drop',e=>setFiles([...e.dataTransfer.files]));

function setFiles(files){
  queueEntries=files.map(file=>({file,issue:fileIssue(file)}));
  renderQueue();
}
function renderQueue(){
  const valid=queueEntries.filter(e=>!e.issue);
  uploadBtn.disabled=!valid.length;
  uploadSummary.textContent=queueEntries.length
    ? `${valid.length} arquivo${valid.length===1?'':'s'} pronto${valid.length===1?'':'s'} para enviar${queueEntries.length!==valid.length?` · ${queueEntries.length-valid.length} ignorado${queueEntries.length-valid.length===1?'':'s'}`:''}.`
    : 'Nenhum arquivo selecionado.';
  uploadQueue.innerHTML=queueEntries.map((entry,index)=>`
    <div class="queue-item ${entry.issue?'invalid':''}" data-index="${index}">
      <span class="queue-name">${isVideoType(entry.file.type)?'Vídeo · ':''}${esc(entry.file.name)}${entry.issue?` · ${esc(entry.issue)}`:''}</span>
      <span class="queue-size">${humanBytes(entry.file.size)}</span>
      <button type="button" class="queue-remove" aria-label="Remover ${esc(entry.file.name)}">×</button>
    </div>`).join('');
  uploadQueue.querySelectorAll('.queue-remove').forEach(btn=>btn.addEventListener('click',()=>{
    const row=btn.closest('.queue-item');
    queueEntries.splice(Number(row.dataset.index),1);
    renderQueue();
  }));
}

async function optimizeImage(file){
  if(isVideoType(file.type)||file.type==='image/avif')return file;
  try{
    const bitmap=await createImageBitmap(file),maxSide=2400,scale=Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height));
    const width=Math.max(1,Math.round(bitmap.width*scale)),height=Math.max(1,Math.round(bitmap.height*scale));
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    canvas.getContext('2d',{alpha:true}).drawImage(bitmap,0,0,width,height);bitmap.close();
    const blob=await new Promise(r=>canvas.toBlob(r,'image/webp',.88));
    return blob?new File([blob],file.name.replace(/\.[^.]+$/,'')+'.webp',{type:'image/webp'}):file;
  }catch(err){console.warn('Otimização não disponível para este arquivo; enviando original.',err);return file;}
}
async function storageCall(payload){
  const token=await neon.auth.getJWTToken?.();
  if(!token)throw new Error('Sessão expirada. Entre novamente.');
  const res=await fetch(STORAGE_FN,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(payload)});
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(data.error||'Falha no armazenamento.');
  return data;
}
function nextSortOrder(category){
  const values=allMedia.filter(m=>m.category===category).map(m=>Number(m.sort_order||0)).filter(Number.isFinite);
  return values.length?Math.max(...values)+1:1;
}

uploadBtn.addEventListener('click',async()=>{
  const selectedFiles=queueEntries.filter(e=>!e.issue).map(e=>e.file);
  if(!selectedFiles.length)return;
  uploadBtn.disabled=true;
  const category=uploadCategory.value,alt=uploadAlt.value.trim();
  let done=0,nextOrder=nextSortOrder(category);
  setMsg(libraryMsg,'');
  try{
    for(const original of selectedFiles){
      const file=await optimizeImage(original);
      uploadBtn.textContent=`Enviando ${done+1} de ${selectedFiles.length}…`;
      const signed=await storageCall({action:'presign',category,fileName:file.name,contentType:file.type});
      const put=await fetch(signed.uploadUrl,{method:'PUT',headers:{'Content-Type':file.type},body:file});
      if(!put.ok)throw new Error(`Não foi possível enviar ${original.name}.`);
      const {error}=await neon.from('site_images').insert({storage_key:signed.storageKey,public_url:signed.publicUrl,category,alt_text:alt,sort_order:nextOrder++,is_visible:true,is_cover:false,mime_type:file.type,bytes:file.size,created_by:currentUser?.id||null});
      if(error){await storageCall({action:'delete',storageKey:signed.storageKey}).catch(()=>{});throw error;}
      done++;
    }
    setMsg(libraryMsg,`${done} arquivo${done===1?'':'s'} enviado${done===1?'':'s'} com sucesso.`,'success');
    queueEntries=[];fileInput.value='';uploadAlt.value='';renderQueue();
    await loadMedia();
    $('librarySection')?.scrollIntoView({behavior:'smooth',block:'start'});
  }catch(err){
    console.error(err);setMsg(libraryMsg,err?.message||'Não foi possível concluir o envio.','error');
  }finally{
    uploadBtn.textContent='Enviar selecionadas';
    uploadBtn.disabled=!queueEntries.some(e=>!e.issue);
  }
});

[filterSearch,filterCategory,filterType,filterVisibility,filterSort].forEach(el=>{
  el.addEventListener(el===filterSearch?'input':'change',applyFilters);
});
refreshBtn.addEventListener('click',loadMedia);

async function loadMedia(){
  imageGrid.innerHTML='<div class="empty">Carregando biblioteca…</div>';
  refreshBtn.disabled=true;refreshBtn.textContent='Atualizando…';
  const {data,error}=await neon.from('site_images').select('*').order('category',{ascending:true}).order('sort_order',{ascending:true});
  refreshBtn.disabled=false;refreshBtn.textContent='Atualizar biblioteca';
  if(error){
    console.error(error);imageGrid.innerHTML='<div class="empty">Não foi possível carregar a biblioteca.</div>';setMsg(libraryMsg,'Falha ao carregar as mídias.','error');return;
  }
  allMedia=data||[];
  updateSummary();
  applyFilters();
}
function updateSummary(){
  $('statTotal').textContent=allMedia.length;
  $('statVisible').textContent=allMedia.filter(m=>m.is_visible).length;
  $('statHidden').textContent=allMedia.filter(m=>!m.is_visible).length;
  $('statCovers').textContent=allMedia.filter(m=>m.is_cover).length;
}
function applyFilters(){
  const term=filterSearch.value.trim().toLowerCase();
  let items=allMedia.filter(m=>{
    if(filterCategory.value&&m.category!==filterCategory.value)return false;
    const video=isVideoType(m.mime_type);
    if(filterType.value==='image'&&video)return false;
    if(filterType.value==='video'&&!video)return false;
    if(filterVisibility.value==='visible'&&!m.is_visible)return false;
    if(filterVisibility.value==='hidden'&&m.is_visible)return false;
    if(filterVisibility.value==='cover'&&!m.is_cover)return false;
    if(term){
      const hay=[m.alt_text,categoryLabel(m.category),m.storage_key].filter(Boolean).join(' ').toLowerCase();
      if(!hay.includes(term))return false;
    }
    return true;
  });
  const byDate=(a,b)=>new Date(a.created_at||0)-new Date(b.created_at||0);
  if(filterSort.value==='newest')items.sort((a,b)=>-byDate(a,b));
  else if(filterSort.value==='oldest')items.sort(byDate);
  else if(filterSort.value==='category')items.sort((a,b)=>categoryLabel(a.category).localeCompare(categoryLabel(b.category),'pt-BR')||Number(a.sort_order||0)-Number(b.sort_order||0));
  else items.sort((a,b)=>categoryRank(a.category)-categoryRank(b.category)||Number(a.sort_order||0)-Number(b.sort_order||0));
  $('libraryCount').textContent=`Exibindo ${items.length} de ${allMedia.length} mídia${allMedia.length===1?'':'s'}.`;
  renderMedia(items);
}

function renderMedia(items){
  if(!items.length){imageGrid.innerHTML='<div class="empty">Nenhuma mídia encontrada com estes filtros.</div>';return;}
  imageGrid.innerHTML=items.map(m=>{
    const video=isVideoType(m.mime_type);
    const preview=video?`<video src="${esc(m.public_url)}" controls preload="metadata"></video>`:`<img src="${esc(m.public_url)}" alt="${esc(m.alt_text||categoryLabel(m.category))}" loading="lazy">`;
    const badges=[video?'<span class="photo-badge">Vídeo</span>':'',m.is_cover?'<span class="photo-badge cover">Capa</span>':'',!m.is_visible?'<span class="photo-badge hidden">Oculta</span>':''].join('');
    return `<article class="photo-card" data-id="${esc(m.id)}" data-key="${esc(m.storage_key)}">
      <figure>${preview}<div class="photo-badges">${badges}</div><a class="preview-link" href="${esc(m.public_url)}" target="_blank" rel="noopener">Abrir mídia</a></figure>
      <div class="photo-body">
        <div class="photo-meta"><span>${esc(categoryLabel(m.category))}</span><span>${humanBytes(Number(m.bytes||0))}</span></div>
        <div class="photo-row">
          <label class="field-label">Categoria<select class="card-category">${categories.map(c=>`<option value="${esc(c.slug)}" ${c.slug===m.category?'selected':''}>${esc(c.label)}</option>`).join('')}</select></label>
          <label class="field-label">Ordem<input class="card-order" type="number" value="${Number(m.sort_order||0)}"></label>
        </div>
        <label class="field-label">Descrição<input class="card-alt" type="text" maxlength="180" value="${esc(m.alt_text||'')}" placeholder="Descrição da mídia"></label>
        <div class="toggles">
          <label><input class="card-visible" type="checkbox" ${m.is_visible?'checked':''}> Publicada</label>
          <label><input class="card-cover" type="checkbox" ${m.is_cover?'checked':''} ${video?'disabled title="Vídeos não podem ser capa"':''}> Capa da categoria</label>
        </div>
        <div class="card-state"></div>
        <div class="card-actions"><button type="button" class="btn save-btn" disabled>Salvar</button><button type="button" class="btn btn-danger delete-btn">Excluir</button></div>
      </div>
    </article>`;
  }).join('');

  imageGrid.querySelectorAll('.photo-card').forEach(card=>{
    card.querySelector('.save-btn').addEventListener('click',()=>saveCard(card));
    card.querySelector('.delete-btn').addEventListener('click',()=>deleteCard(card));
    card.querySelectorAll('.card-category,.card-order,.card-alt,.card-visible,.card-cover').forEach(control=>{
      control.addEventListener(control.matches('input[type=text],input[type=number]')?'input':'change',()=>markDirty(card));
    });
  });
}
function markDirty(card){
  card.classList.add('dirty');
  card.querySelector('.save-btn').disabled=false;
  card.querySelector('.card-state').textContent='Alterações ainda não salvas';
}

async function saveCard(card){
  const id=card.dataset.id,category=card.querySelector('.card-category').value;
  const isCover=card.querySelector('.card-cover').checked;
  const payload={
    category,
    sort_order:Number(card.querySelector('.card-order').value||0),
    alt_text:card.querySelector('.card-alt').value.trim(),
    is_visible:card.querySelector('.card-visible').checked,
    is_cover:isCover
  };
  const btn=card.querySelector('.save-btn');btn.disabled=true;btn.textContent='Salvando…';
  try{
    if(isCover){
      const {error:e}=await neon.from('site_images').update({is_cover:false}).eq('category',category).neq('id',id);
      if(e)throw e;
    }
    const {error}=await neon.from('site_images').update(payload).eq('id',id);
    if(error)throw error;
    setMsg(libraryMsg,'Alterações salvas.','success');
    await loadMedia();
  }catch(e){
    console.error(e);setMsg(libraryMsg,'Não foi possível salvar esta mídia.','error');btn.disabled=false;btn.textContent='Salvar';
  }
}

async function deleteCard(card){
  if(!confirm('Excluir esta mídia da biblioteca e do site? Esta ação não pode ser desfeita.'))return;
  const id=card.dataset.id,key=card.dataset.key,btn=card.querySelector('.delete-btn');
  btn.disabled=true;btn.textContent='Excluindo…';
  try{
    const {error}=await neon.from('site_images').delete().eq('id',id);
    if(error)throw error;

    let storageWarning=false;
    if(!key.startsWith('legacy:')){
      try{await storageCall({action:'delete',storageKey:key});}
      catch(storageErr){storageWarning=true;console.warn('Registro removido, mas o arquivo não pôde ser limpo do storage.',storageErr);}
    }

    allMedia=allMedia.filter(m=>String(m.id)!==String(id));
    updateSummary();applyFilters();
    setMsg(libraryMsg,storageWarning?'Mídia removida do site. O arquivo físico não pôde ser limpo do armazenamento.':'Mídia excluída com sucesso.',storageWarning?'warn':'success');
  }catch(e){
    console.error(e);setMsg(libraryMsg,'Não foi possível excluir esta mídia.','error');btn.disabled=false;btn.textContent='Excluir';
  }
}

renderQueue();
import('./recent-works-admin.js').catch(err=>console.error('Falha ao carregar trabalhos recentes no painel.',err));
boot();
