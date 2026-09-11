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
const otpStartBtn=$('otpStartBtn'), otpForm=$('otpForm'), otpCode=$('otpCode'), otpConfirmBtn=$('otpConfirmBtn');
const uploadCategory=$('uploadCategory'), filterCategory=$('filterCategory'), uploadAlt=$('uploadAlt');
const fileInput=$('fileInput'), uploadBtn=$('uploadBtn'), uploadQueue=$('uploadQueue'), uploadSummary=$('uploadSummary');
const imageGrid=$('imageGrid'), dropzone=$('dropzone'), refreshBtn=$('refreshBtn');
const filterSearch=$('filterSearch'), filterType=$('filterType'), filterVisibility=$('filterVisibility'), filterSort=$('filterSort');
const uploadAreaTabs=[...document.querySelectorAll('[data-upload-area]')], standardUploadFields=$('standardUploadFields'), recentUploadNotice=$('recentUploadNotice'), uploadContextHelp=$('uploadContextHelp');
const libraryFolders=$('libraryFolders'), categoryFolders=$('categoryFolders'), librarySection=$('librarySection'), closeLibraryBtn=$('closeLibraryBtn'), openLibraryBtn=$('openLibraryBtn');
const mediaOverview=$('mediaOverview'), mediaOverviewTitle=$('mediaOverviewTitle'), mediaOverviewCopy=$('mediaOverviewCopy'), mediaOverviewCount=$('mediaOverviewCount'), mediaOverviewGrid=$('mediaOverviewGrid');
let categories=[], queueEntries=[], currentUser=null, cachedAuthToken='', allMedia=[], currentUploadArea='portfolio', currentLibraryArea='all', currentOverviewArea='portfolio';

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
async function getSession(){
  const r=await neon.auth.getSession();
  if(r?.error)throw new Error(r.error.message||'Não foi possível consultar a sessão.');
  return r?.data||r||null;
}
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
async function waitForSession(attempts=12,delay=450){
  let lastError=null;
  for(let i=0;i<attempts;i++){
    try{
      const s=await getSession();
      if(s?.user)return s;
    }catch(e){lastError=e;console.warn('Tentativa de recuperar sessão falhou.',e);}
    if(i<attempts-1)await sleep(delay);
  }
  if(lastError)console.warn('Sessão não recuperada após as tentativas.',lastError);
  return null;
}
function tokenFromSession(sessionLike){
  return sessionLike?.session?.token||sessionLike?.data?.session?.token||sessionLike?.token||sessionLike?.access_token||'';
}
function tokenExpiresSoon(token){
  try{
    const part=String(token).split('.')[1];
    if(!part)return false;
    const normalized=part.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(part.length/4)*4,'=');
    const payload=JSON.parse(atob(normalized));
    return Number(payload?.exp||0)>0 && Number(payload.exp)<=Math.floor(Date.now()/1000)+45;
  }catch(_){return false;}
}
async function getUploadAuthToken(){
  if(cachedAuthToken&&!tokenExpiresSoon(cachedAuthToken))return cachedAuthToken;
  try{
    const session=await getSession();
    const token=tokenFromSession(session);
    if(token&&!tokenExpiresSoon(token)){cachedAuthToken=token;return token;}
  }catch(err){console.warn('Não foi possível reaproveitar o token da sessão.',err);}
  try{
    const token=await neon.auth.getJWTToken?.();
    if(token){cachedAuthToken=token;return token;}
  }catch(err){
    console.error('Falha ao renovar JWT para upload.',err);
    throw new Error('Não foi possível renovar a autenticação do upload. Recarregue o painel e entre novamente.');
  }
  throw new Error('Sessão de upload indisponível. Recarregue o painel e entre novamente.');
}
async function checkAdmin(){
  const {data,error}=await neon.from('site_admins').select('user_id,email').limit(1);
  if(error){console.error('Falha ao verificar administrador.',error);return false;}
  return Array.isArray(data)&&data.length>0;
}
async function authorizeAndOpen(user,sessionData=null){
  if(!user)return false;
  currentUser=user;
  const sessionToken=tokenFromSession(sessionData);
  if(sessionToken)cachedAuthToken=sessionToken;
  if(!(await checkAdmin())){
    await neon.auth.signOut().catch(()=>{});
    currentUser=null;
    showAuth();
    setMsg(authMsg,'Esta conta não tem acesso administrativo.','error');
    return false;
  }
  setMsg(authMsg,'');
  await showPanel();
  return true;
}

async function boot(){
  const params=new URLSearchParams(location.search);
  const googleReturn=params.get('auth')==='google'||sessionStorage.getItem('studio-admin-oauth-pending')==='1';
  const googleError=params.get('authError')==='google';
  showAuth();
  try{
    if(googleError){
      sessionStorage.removeItem('studio-admin-oauth-pending');
      history.replaceState({},'', '/painel');
      setMsg(authMsg,'O Google não concluiu o acesso. Tente novamente ou use o código por e-mail.','error');
      return;
    }
    if(googleReturn)setMsg(authMsg,'Concluindo acesso com Google…');
    const s=googleReturn?await waitForSession(14,500):await waitForSession(2,250);
    if(!s?.user){
      if(googleReturn){
        sessionStorage.removeItem('studio-admin-oauth-pending');
        history.replaceState({},'', '/painel');
        setMsg(authMsg,'O Google autenticou sua conta, mas o navegador não recuperou a sessão. Use “Entrar com código por e-mail” abaixo.','warn');
      }
      return;
    }
    sessionStorage.removeItem('studio-admin-oauth-pending');
    if(params.has('auth')||params.has('authError'))history.replaceState({},'', '/painel');
    await authorizeAndOpen(s.user,s);
  }catch(e){
    console.error(e);
    showAuth();
    setMsg(authMsg,e?.message||'Não foi possível validar a sessão. Tente novamente.','error');
  }
}
function showAuth(){authView.hidden=false;panelView.hidden=true;}
async function showPanel(){
  authView.hidden=true;
  panelView.hidden=false;
  $('welcome').textContent=currentUser?.email||'';
  try{
    await loadCategories();
    await loadMedia();
  }catch(e){
    console.error('Falha ao carregar dados do painel.',e);
    setMsg(libraryMsg,'Você entrou, mas alguns dados do painel não puderam ser carregados. Clique em “Atualizar biblioteca”.','error');
  }
}

googleBtn.addEventListener('click',async()=>{
  setMsg(authMsg,'Abrindo o Google…');
  googleBtn.disabled=true;
  try{
    sessionStorage.setItem('studio-admin-oauth-pending','1');
    const r=await neon.auth.signIn.social({
      provider:'google',
      callbackURL:location.origin+'/painel?auth=google',
      errorCallbackURL:location.origin+'/painel?authError=google'
    });
    if(r?.error)throw new Error(r.error.message||'Não foi possível iniciar o login com Google.');
  }catch(e){
    sessionStorage.removeItem('studio-admin-oauth-pending');
    console.error(e);
    setMsg(authMsg,e?.message||'Não foi possível iniciar o login com Google.','error');
    googleBtn.disabled=false;
  }
});

loginForm.addEventListener('submit',async e=>{
  e.preventDefault();
  setMsg(authMsg,'Entrando…');
  const submit=loginForm.querySelector('button[type="submit"]');
  submit.disabled=true;
  try{
    const email=$('loginEmail').value.trim(),password=$('loginPassword').value;
    const r=await neon.auth.signIn.email({email,password});
    if(r?.error)throw new Error(r.error.message||'Credenciais inválidas.');
    const user=r?.data?.user||(await waitForSession(6,300))?.user;
    if(!user)throw new Error('A autenticação foi aceita, mas a sessão não pôde ser recuperada.');
    await authorizeAndOpen(user,r?.data||null);
  }catch(err){
    setMsg(authMsg,err?.message||'Não foi possível entrar.','error');
  }finally{submit.disabled=false;}
});

otpStartBtn.addEventListener('click',async()=>{
  const email=$('loginEmail').value.trim();
  if(!email){setMsg(authMsg,'Informe o e-mail para receber o código.','error');return;}
  otpStartBtn.disabled=true;
  setMsg(authMsg,'Enviando código de acesso…');
  try{
    const r=await neon.auth.emailOtp.sendVerificationOtp({email,type:'sign-in'});
    if(r?.error)throw new Error(r.error.message||'Não foi possível enviar o código.');
    otpForm.hidden=false;
    otpCode.value='';
    otpCode.focus();
    setMsg(authMsg,'Código enviado. Verifique sua caixa de entrada e o spam.','success');
  }catch(err){
    console.error(err);
    setMsg(authMsg,err?.message||'Não foi possível enviar o código.','error');
  }finally{otpStartBtn.disabled=false;}
});

otpForm.addEventListener('submit',async e=>{
  e.preventDefault();
  const email=$('loginEmail').value.trim(),otp=otpCode.value.trim();
  if(!otp)return;
  otpConfirmBtn.disabled=true;
  setMsg(authMsg,'Validando código…');
  try{
    const r=await neon.auth.signIn.emailOtp({email,otp});
    if(r?.error)throw new Error(r.error.message||'Código inválido ou expirado.');
    const user=r?.data?.user||(await waitForSession(6,300))?.user;
    if(!user)throw new Error('O código foi aceito, mas a sessão não pôde ser recuperada.');
    otpForm.hidden=true;
    await authorizeAndOpen(user,r?.data||null);
  }catch(err){
    console.error(err);
    setMsg(authMsg,err?.message||'Não foi possível validar o código.','error');
  }finally{otpConfirmBtn.disabled=false;}
});

logoutBtn.addEventListener('click',async()=>{
  await neon.auth.signOut();
  currentUser=null;
  cachedAuthToken='';
  showAuth();
});

async function loadCategories(){
  const {data,error}=await neon.from('site_categories').select('slug,label,area,sort_order').order('sort_order',{ascending:true});
  if(error)throw error;
  categories=data||[];
  syncUploadCategories();
  filterCategory.innerHTML='<option value="">Todas as pastas</option>'+categories.map(c=>`<option value="${esc(c.slug)}">${esc(c.label)}</option>`).join('');
  renderCategoryFolders();
}
function categoryLabel(slug){return categories.find(c=>c.slug===slug)?.label||slug;}
function categoryArea(slug){if(slug==='recent-work-media')return'recent';return categories.find(c=>c.slug===slug)?.area||'';}
function categoryRank(slug){const i=categories.findIndex(c=>c.slug===slug);return i<0?9999:i;}
function categoriesForArea(area){return categories.filter(c=>categoryArea(c.slug)===area);}
function syncUploadCategories(){
  const area=currentUploadArea==='servico'?'servico':'portfolio';
  const options=categoriesForArea(area);
  uploadCategory.innerHTML=options.map(c=>`<option value="${esc(c.slug)}">${esc(c.label.replace(/^Portfólio\s*[—-]\s*/i,''))}</option>`).join('');
}
function setUploadArea(area){
  currentUploadArea=area;
  uploadAreaTabs.forEach(btn=>{const on=btn.dataset.uploadArea===area;btn.classList.toggle('active',on);btn.setAttribute('aria-selected',String(on));});
  const recent=area==='recent';
  if(standardUploadFields)standardUploadFields.hidden=recent;
  if(recentUploadNotice)recentUploadNotice.hidden=!recent;
  if(uploadContextHelp)uploadContextHelp.textContent=recent
    ? 'Trabalhos recentes têm título, data, descrição, ordem e publicação próprios.'
    : area==='portfolio'
      ? 'Envie fotos e vídeos diretamente para uma pasta do Portfólio.'
      : 'Envie fotos e vídeos para a galeria de um serviço. A capa pode ser definida depois na Biblioteca.';
  if(!recent)syncUploadCategories();
}
uploadAreaTabs.forEach(btn=>btn.addEventListener('click',()=>setUploadArea(btn.dataset.uploadArea)));
function openLibrary(){
  if(!librarySection)return;
  librarySection.hidden=false;
  librarySection.scrollIntoView({behavior:'smooth',block:'start'});
}
function closeLibrary(){
  if(!librarySection)return;
  librarySection.hidden=true;
  document.querySelector('.admin-hub')?.scrollIntoView({behavior:'smooth',block:'start'});
}
closeLibraryBtn?.addEventListener('click',closeLibrary);
openLibraryBtn?.addEventListener('click',openLibrary);

function overviewMeta(area){
  if(area==='recent')return {title:'Trabalhos recentes',copy:'Fotos e vídeos vinculados aos trabalhos recentes da Home.'};
  if(area==='servico')return {title:'Galerias de serviços',copy:'Mídias usadas nas galerias abertas pelos cards de serviços.'};
  if(area==='all')return {title:'Biblioteca',copy:'Visão geral de todas as mídias cadastradas no site.'};
  return {title:'Portfólio',copy:'Fotos e vídeos que compõem o portfólio principal.'};
}
function renderOverview(){
  if(!mediaOverviewGrid)return;
  const area=currentOverviewArea;
  const items=area==='all'?allMedia:allMedia.filter(m=>categoryArea(m.category)===area);
  const meta=overviewMeta(area);
  mediaOverviewTitle.textContent=meta.title;
  mediaOverviewCopy.textContent=meta.copy;
  mediaOverviewCount.textContent=`${items.length} mídia${items.length===1?'':'s'}`;
  document.querySelectorAll('[data-overview-area]').forEach(btn=>btn.classList.toggle('active',btn.dataset.overviewArea===area));
  if(!items.length){mediaOverviewGrid.innerHTML='<div class="overview-empty">Nenhuma mídia cadastrada nesta área.</div>';return;}
  const sorted=[...items].sort((a,b)=>categoryRank(a.category)-categoryRank(b.category)||Number(a.sort_order||0)-Number(b.sort_order||0));
  mediaOverviewGrid.innerHTML=sorted.slice(0,12).map(m=>{
    const video=isVideoType(m.mime_type);
    const preview=video?`<video src="${esc(m.public_url)}" muted preload="metadata"></video>`:`<img src="${esc(m.public_url)}" alt="" loading="lazy">`;
    return `<article class="overview-media"><figure>${preview}<span>${video?'Vídeo':m.is_cover?'Capa':'Foto'}</span></figure><small>${esc(categoryLabel(m.category).replace(/^Portfólio\s*[—-]\s*/i,''))}</small></article>`;
  }).join('')+(items.length>12?`<div class="overview-more">+${items.length-12} mídias na Biblioteca</div>`:'');
}
document.querySelectorAll('[data-overview-area]').forEach(btn=>btn.addEventListener('click',()=>{
  currentOverviewArea=btn.dataset.overviewArea;
  renderOverview();
  mediaOverview?.scrollIntoView({behavior:'smooth',block:'nearest'});
}));

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
  const token=await getUploadAuthToken();
  let res;
  try{
    res=await fetch(STORAGE_FN,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(payload)});
  }catch(err){
    console.error('Falha de rede ao chamar o armazenamento.',err);
    throw new Error('Não foi possível acessar o serviço de armazenamento. Verifique a conexão e tente novamente.');
  }
  const raw=await res.text().catch(()=>'');
  let data={};
  try{data=raw?JSON.parse(raw):{};}catch(_){data={};}
  if(res.status===401)cachedAuthToken='';
  if(!res.ok){
    const detail=data?.error||raw||res.statusText||'falha sem detalhe';
    throw new Error(`Armazenamento HTTP ${res.status}: ${String(detail).slice(0,220)}`);
  }
  return data;
}
// Shared authenticated uploader used by the main panel and by Trabalhos recentes.
window.studioUploadMedia = async function({file: original, storageCategory, databaseCategory, altText = '', sortOrder = 1, recentWorkId = null}){
  if(!original)throw new Error('Arquivo não informado.');
  if(!storageCategory)throw new Error('Categoria de armazenamento não informada.');
  const file=await optimizeImage(original);
  let signed;
  try{
    signed=await storageCall({action:'presign',category:storageCategory,fileName:file.name,contentType:file.type});
  }catch(err){
    throw new Error(`Falha ao preparar o upload: ${err?.message||'erro desconhecido'}`);
  }
  if(!signed?.uploadUrl||!signed?.storageKey||!signed?.publicUrl)throw new Error('O serviço de armazenamento retornou uma resposta incompleta.');
  let put;
  try{
    put=await fetch(signed.uploadUrl,{method:'PUT',headers:{'Content-Type':file.type},body:file});
  }catch(err){
    console.error('Falha de rede no PUT do Storage.',err);
    throw new Error(`Falha de conexão ao enviar ${original.name} para o Storage.`);
  }
  if(!put.ok){
    const detail=await put.text().catch(()=>'');
    throw new Error(`Storage recusou ${original.name} (HTTP ${put.status})${detail?`: ${detail.slice(0,180)}`:''}`);
  }
  const row={
    storage_key:signed.storageKey,
    public_url:signed.publicUrl,
    category:databaseCategory||storageCategory,
    alt_text:altText,
    sort_order:sortOrder,
    is_visible:true,
    is_cover:false,
    mime_type:file.type,
    bytes:file.size,
    created_by:currentUser?.id||null,
    recent_work_id:recentWorkId
  };
  const {error}=await neon.from('site_images').insert(row);
  if(error){
    await storageCall({action:'delete',storageKey:signed.storageKey}).catch(()=>{});
    const detail=error?.message||error?.details||error?.hint||'erro desconhecido';
    throw new Error(`Falha ao registrar a mídia no banco: ${detail}`);
  }
  return row;
};
window.studioStorageCall = storageCall;

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
    setMsg(libraryMsg,`${done} arquivo${done===1?'':'s'} enviado${done===1?'':'s'} com sucesso. Abra a Biblioteca pelo card 04 quando quiser organizar as mídias.`,'success');
  }catch(err){
    console.error(err);setMsg(libraryMsg,err?.message||'Não foi possível concluir o envio.','error');
  }finally{
    uploadBtn.textContent='Enviar selecionadas';
    uploadBtn.disabled=!queueEntries.some(e=>!e.issue);
  }
});

[filterSearch,filterCategory,filterType,filterVisibility,filterSort].forEach(el=>{
  el.addEventListener(el===filterSearch?'input':'change',()=>{if(el===filterCategory)renderCategoryFolders();applyFilters();});
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
  renderOverview();
  applyFilters();
}
function updateSummary(){
  $('statTotal').textContent=allMedia.length;
  $('statVisible').textContent=allMedia.filter(m=>m.is_visible).length;
  $('statHidden').textContent=allMedia.filter(m=>!m.is_visible).length;
  $('statCovers').textContent=allMedia.filter(m=>m.is_cover).length;
  const byArea=area=>allMedia.filter(m=>categoryArea(m.category)===area).length;
  if($('folderCountAll'))$('folderCountAll').textContent=`${allMedia.length} mídias`;
  if($('folderCountPortfolio'))$('folderCountPortfolio').textContent=`${byArea('portfolio')} mídias`;
  if($('folderCountRecent'))$('folderCountRecent').textContent=`${byArea('recent')} mídias`;
  if($('folderCountServico'))$('folderCountServico').textContent=`${byArea('servico')} mídias`;
  renderCategoryFolders();
}
function setLibraryArea(area){
  currentLibraryArea=area;
  filterCategory.value='';
  libraryFolders?.querySelectorAll('[data-folder-area]').forEach(btn=>btn.classList.toggle('active',btn.dataset.folderArea===area));
  renderCategoryFolders();
  applyFilters();
}
libraryFolders?.querySelectorAll('[data-folder-area]').forEach(btn=>btn.addEventListener('click',()=>setLibraryArea(btn.dataset.folderArea)));
function renderCategoryFolders(){
  if(!categoryFolders||!categories.length)return;
  const source=currentLibraryArea==='all'?categories:categoriesForArea(currentLibraryArea);
  if(!source.length){categoryFolders.innerHTML='';return;}
  categoryFolders.innerHTML=source.map(c=>{
    const count=allMedia.filter(m=>m.category===c.slug).length;
    const cover=allMedia.find(m=>m.category===c.slug&&m.is_cover&&!isVideoType(m.mime_type))||allMedia.find(m=>m.category===c.slug&&!isVideoType(m.mime_type));
    const thumb=cover?`<img src="${esc(cover.public_url)}" alt="" loading="lazy">`:`<span class="category-folder-placeholder">${esc(c.label.charAt(0))}</span>`;
    return `<button type="button" class="category-folder ${filterCategory.value===c.slug?'active':''}" data-category-folder="${esc(c.slug)}">${thumb}<span><strong>${esc(c.label.replace(/^Portfólio\s*[—-]\s*/i,''))}</strong><small>${count} mídia${count===1?'':'s'}</small></span></button>`;
  }).join('');
  categoryFolders.querySelectorAll('[data-category-folder]').forEach(btn=>btn.addEventListener('click',()=>{
    filterCategory.value=btn.dataset.categoryFolder;
    renderCategoryFolders();
    applyFilters();
    imageGrid.scrollIntoView({behavior:'smooth',block:'start'});
  }));
}
function applyFilters(){
  const term=filterSearch.value.trim().toLowerCase();
  let items=allMedia.filter(m=>{
    if(currentLibraryArea!=='all'&&categoryArea(m.category)!==currentLibraryArea)return false;
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
import('./recent-works-admin.js?v=20260911-editor-v2').catch(err=>console.error('Falha ao carregar trabalhos recentes no painel.',err));
boot();
