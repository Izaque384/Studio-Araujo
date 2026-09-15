import { createClient, BetterAuthVanillaAdapter } from 'https://esm.sh/@neondatabase/neon-js@0.7.0-beta?bundle';

const AUTH_URL='https://ep-lucky-rice-axp36rxg.neonauth.c-4.us-east-2.aws.neon.tech/neondb/auth';
const DATA_API_URL='https://ep-lucky-rice-axp36rxg.apirest.c-4.us-east-2.aws.neon.tech/neondb/rest/v1';
const neon=createClient({auth:{adapter:BetterAuthVanillaAdapter(),url:AUTH_URL},dataApi:{url:DATA_API_URL}});
const retired=new Set(['albuns','luva','maleta','caixa']);
const $=id=>document.getElementById(id);
const uploadSection=$('uploadSection'), editorSection=$('mediaEditorSection'), mediaSection=$('workspaceMediaSection');
const mediaGroups=$('workspaceMediaGroups'), mediaCount=$('workspaceMediaCount'), mediaTitle=$('workspaceMediaTitle'), mediaCopy=$('workspaceMediaCopy'), msg=$('workspaceMsg');
const refreshBtn=$('workspaceRefreshBtn'), uploadTitle=$('workspaceUploadTitle');
let activeArea='', items=[], categories=[], works=[], editing=null, loading=false;
const meta={
  portfolio:{title:'Portfólio',copy:'Todas as mídias do portfólio, separadas por categoria.'},
  recent:{title:'Trabalhos recentes',copy:'Todas as mídias, separadas por trabalho recente.'},
  servico:{title:'Galerias de serviços',copy:'Todas as mídias das galerias, separadas por serviço.'}
};
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function isVideo(m){return /^video\//i.test(m?.mime_type||'');}
function labelFor(slug){return categories.find(c=>c.slug===slug)?.label||slug||'Sem categoria';}
function areaFor(m){if(m.recent_work_id||m.category==='recent-work-media')return'recent';return categories.find(c=>c.slug===m.category)?.area||'';}
function setMsg(text='',type=''){if(!msg)return;msg.textContent=text;msg.className='msg'+(type?' '+type:'');}
function groupKey(m){return activeArea==='recent'?(m.recent_work_id||'sem-vinculo'):m.category;}
function groupLabel(key){if(activeArea==='recent')return works.find(w=>String(w.id)===String(key))?.title||'Sem trabalho vinculado';return labelFor(key).replace(/^Portfólio\s*[—-]\s*/i,'');}
function sortItems(list){return list.slice().sort((a,b)=>Number(a.sort_order||9999)-Number(b.sort_order||9999)||new Date(a.created_at||0)-new Date(b.created_at||0));}

async function loadWorkspace(){
  if(!activeArea||loading)return;
  loading=true;refreshBtn.disabled=true;refreshBtn.textContent='Atualizando…';setMsg('Carregando mídias…');
  try{
    const [mediaRes,catRes,workRes]=await Promise.all([
      neon.from('site_images').select('*').order('sort_order',{ascending:true}),
      neon.from('site_categories').select('slug,label,area,sort_order').order('sort_order',{ascending:true}),
      neon.from('recent_works').select('id,title,sort_order,is_active').order('sort_order',{ascending:true})
    ]);
    if(mediaRes.error)throw mediaRes.error;if(catRes.error)throw catRes.error;if(workRes.error)throw workRes.error;
    categories=(catRes.data||[]).filter(c=>!retired.has(c.slug));works=workRes.data||[];
    items=(mediaRes.data||[]).filter(m=>!retired.has(m.category)&&areaFor(m)===activeArea);
    render();setMsg('');
  }catch(err){console.error(err);setMsg('Não foi possível carregar as mídias desta área.','error');mediaGroups.innerHTML='<div class="workspace-empty">Falha ao carregar as mídias.</div>';}
  finally{loading=false;refreshBtn.disabled=false;refreshBtn.textContent='Atualizar';}
}
function render(){
  const cfg=meta[activeArea];mediaTitle.textContent=cfg.title;mediaCopy.textContent=cfg.copy;mediaCount.textContent=`${items.length} mídia${items.length===1?'':'s'}`;
  if(!items.length){mediaGroups.innerHTML='<div class="workspace-empty">Nenhuma mídia cadastrada nesta área.</div>';return;}
  const groups=new Map();
  sortItems(items).forEach(m=>{const key=groupKey(m);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(m);});
  mediaGroups.innerHTML=[...groups.entries()].map(([key,list])=>`<section class="workspace-group"><div class="workspace-group-head"><h3>${esc(groupLabel(key))}</h3><small>${list.length} mídia${list.length===1?'':'s'}</small></div><div class="workspace-compact-grid">${list.map(cardHTML).join('')}</div></section>`).join('');
  mediaGroups.querySelectorAll('[data-edit-media]').forEach(btn=>btn.addEventListener('click',()=>openEditor(btn.dataset.editMedia)));
  mediaGroups.querySelectorAll('[data-delete-media]').forEach(btn=>btn.addEventListener('click',()=>deleteMedia(btn.dataset.deleteMedia,btn)));
}
function cardHTML(m){
  const preview=isVideo(m)?`<video src="${esc(m.public_url)}" muted preload="metadata"></video>`:`<img src="${esc(m.public_url)}" alt="${esc(m.alt_text||groupLabel(groupKey(m)))}" loading="lazy">`;
  const badges=[m.is_cover?'<span class="workspace-badge">Capa</span>':'',!m.is_visible?'<span class="workspace-badge warn">Oculta</span>':'',isVideo(m)?'<span class="workspace-badge">Vídeo</span>':''].join('');
  return `<article class="workspace-media-card"><figure>${preview}<div class="workspace-badges">${badges}</div></figure><div class="workspace-media-body"><div class="workspace-media-meta">Posição ${Number(m.sort_order||0)||'—'}${m.alt_text?' · '+esc(m.alt_text):''}</div><div class="workspace-media-actions"><button type="button" class="btn btn-ghost" data-edit-media="${esc(m.id)}">Editar</button><button type="button" class="btn btn-danger" data-delete-media="${esc(m.id)}">Excluir</button></div></div></article>`;
}
function editorCategories(m){
  if(activeArea==='recent')return `<option value="${esc(m.category)}">${esc(groupLabel(groupKey(m)))}</option>`;
  return categories.filter(c=>c.area===activeArea).map(c=>`<option value="${esc(c.slug)}" ${c.slug===m.category?'selected':''}>${esc(c.label.replace(/^Portfólio\s*[—-]\s*/i,''))}</option>`).join('');
}
function openEditor(id){
  const m=items.find(x=>String(x.id)===String(id));if(!m)return;editing=m;
  editorSection.innerHTML=`<div class="workspace-editor-head"><div><p class="eyebrow">Editar mídia</p><h2>${esc(groupLabel(groupKey(m)))}</h2></div><button type="button" id="workspaceEditorClose" class="btn btn-ghost btn-small">Fechar</button></div><div class="workspace-editor-grid"><label>Galeria / categoria<select id="workspaceEditCategory" ${activeArea==='recent'?'disabled':''}>${editorCategories(m)}</select></label><label>Descrição<input id="workspaceEditAlt" maxlength="180" value="${esc(m.alt_text||'')}"></label><label>Posição<input id="workspaceEditOrder" type="number" min="1" step="1" value="${Number(m.sort_order||1)}"></label></div><div class="workspace-editor-toggles"><label><input id="workspaceEditVisible" type="checkbox" ${m.is_visible?'checked':''}> Publicada</label><label><input id="workspaceEditCover" type="checkbox" ${m.is_cover?'checked':''} ${isVideo(m)?'disabled':''}> Capa da galeria</label></div><div class="workspace-editor-actions"><button type="button" id="workspaceEditorCancel" class="btn btn-ghost">Cancelar</button><button type="button" id="workspaceEditorSave" class="btn btn-primary">Salvar alterações</button></div>`;
  editorSection.hidden=false;editorSection.scrollIntoView({behavior:'smooth',block:'start'});
  $('workspaceEditorClose').onclick=closeEditor;$('workspaceEditorCancel').onclick=closeEditor;$('workspaceEditorSave').onclick=saveEditor;
}
function closeEditor(){editing=null;editorSection.hidden=true;editorSection.innerHTML='';}
async function saveEditor(){
  if(!editing)return;const btn=$('workspaceEditorSave');btn.disabled=true;btn.textContent='Salvando…';
  try{
    const category=activeArea==='recent'?editing.category:$('workspaceEditCategory').value;
    const payload={category,alt_text:$('workspaceEditAlt').value.trim(),sort_order:Math.max(1,Number($('workspaceEditOrder').value)||1),is_visible:$('workspaceEditVisible').checked,is_cover:$('workspaceEditCover').checked};
    if(payload.is_cover){
      let q=neon.from('site_images').update({is_cover:false});
      q=editing.recent_work_id?q.eq('recent_work_id',editing.recent_work_id):q.eq('category',category);
      const {error}=await q.neq('id',editing.id);if(error)throw error;
    }
    const {error}=await neon.from('site_images').update(payload).eq('id',editing.id);if(error)throw error;
    closeEditor();setMsg('Mídia atualizada com sucesso.','success');await loadWorkspace();window.dispatchEvent(new CustomEvent('studio:workspace-media-changed'));
  }catch(err){console.error(err);setMsg('Não foi possível salvar esta mídia.','error');btn.disabled=false;btn.textContent='Salvar alterações';}
}
async function deleteMedia(id,btn){
  const m=items.find(x=>String(x.id)===String(id));if(!m||!confirm('Excluir esta mídia da galeria e do site? Esta ação não pode ser desfeita.'))return;
  btn.disabled=true;btn.textContent='Excluindo…';
  try{
    const {error}=await neon.from('site_images').delete().eq('id',m.id);if(error)throw error;
    if(m.storage_key&&!String(m.storage_key).startsWith('legacy:')&&window.studioStorageCall){try{await window.studioStorageCall({action:'delete',storageKey:m.storage_key});}catch(err){console.warn('Registro removido, mas o arquivo do storage não pôde ser removido.',err);}}
    if(editing&&String(editing.id)===String(m.id))closeEditor();
    setMsg('Mídia excluída.','success');await loadWorkspace();window.dispatchEvent(new CustomEvent('studio:workspace-media-changed'));
  }catch(err){console.error(err);setMsg('Não foi possível excluir esta mídia.','error');btn.disabled=false;btn.textContent='Excluir';}
}
function activate(area){
  if(!meta[area])return;activeArea=area;
  document.querySelectorAll('[data-overview-area]').forEach(card=>card.classList.toggle('workspace-active',card.dataset.overviewArea===area));
  $('testimonialsAdmin')?.setAttribute('hidden','');$('mediaOverview')?.setAttribute('hidden','');$('librarySection')?.setAttribute('hidden','');
  document.querySelector(`[data-upload-area="${area}"]`)?.click();
  uploadTitle.textContent=area==='portfolio'?'Enviar ao Portfólio':area==='recent'?'Gerenciar Trabalhos recentes':'Enviar para Galerias de serviços';
  uploadSection.hidden=false;mediaSection.hidden=false;closeEditor();
  loadWorkspace();uploadSection.scrollIntoView({behavior:'smooth',block:'start'});
}
document.querySelectorAll('[data-overview-area]').forEach(card=>card.addEventListener('click',()=>activate(card.dataset.overviewArea)));
$('openTestimonialsBtn')?.addEventListener('click',()=>{activeArea='';uploadSection.hidden=true;mediaSection.hidden=true;closeEditor();document.querySelectorAll('[data-overview-area]').forEach(c=>c.classList.remove('workspace-active'));});
refreshBtn?.addEventListener('click',loadWorkspace);
window.addEventListener('studio:media-updated',()=>{if(activeArea)loadWorkspace();});
window.addEventListener('studio:workspace-media-changed',()=>{const fullRefresh=$('refreshBtn');if(fullRefresh)fullRefresh.click();});
