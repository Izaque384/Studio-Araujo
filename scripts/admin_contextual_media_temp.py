from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'Padrão não encontrado: {label}')
    return text.replace(old, new, 1)

def sub_once(text, pattern, repl, label, flags=0):
    out, n = re.subn(pattern, repl, text, count=1, flags=flags)
    if n != 1:
        raise SystemExit(f'Substituição inválida ({n}): {label}')
    return out

# ------------------------------------------------------------------
# admin.html
# ------------------------------------------------------------------
p = ROOT / 'admin.html'
s = p.read_text(encoding='utf-8')
s = s.replace('admin.css?v=20260914-panel-polish', 'admin.css?v=20260915-context-manager')
s = s.replace('admin.js?v=20260911-editor-v2', 'admin.js?v=20260915-context-manager')

s = replace_once(s,
'''        <div class="header-actions">\n          <a class="btn btn-ghost" href="/" target="_blank" rel="noopener">Ver site</a>\n          <button type="button" id="logoutBtn" class="btn btn-ghost">Sair</button>\n        </div>''',
'''        <div class="header-actions">\n          <div class="header-media-stat" aria-label="Total de mídias cadastradas">\n            <small>Mídias</small><strong id="statTotal">—</strong>\n          </div>\n          <a class="btn btn-ghost" href="/" target="_blank" rel="noopener">Ver site</a>\n          <button type="button" id="logoutBtn" class="btn btn-ghost">Sair</button>\n        </div>''', 'métrica no cabeçalho')

s = sub_once(s, r'\n\s*<section id="panelHome" class="media-summary media-summary-compact".*?</section>\n', '\n', 'resumo de métricas', re.S)

s = s.replace('aria-controls="mediaOverview"', 'aria-controls="uploadSection"')
s = s.replace('<span class="hub-link">Ver visão geral →</span>', '<span class="hub-link">Gerenciar conteúdo →</span>')
s = sub_once(s, r'\n\s*<section id="mediaOverview" class="media-overview".*?</section>\n\n', '\n', 'visão geral antiga', re.S)

s = replace_once(s,
'''      <section id="uploadSection" class="upload-card admin-section">\n        <div class="section-heading upload-head">\n          <div>\n            <p class="eyebrow">Atualizar o site</p>\n            <h2>Enviar fotos ou vídeos</h2>\n            <p id="uploadContextHelp" class="section-copy">Escolha uma área abaixo. O painel mostra apenas as pastas compatíveis com esse destino.</p>\n          </div>\n          <div class="upload-head-actions">\n            <span class="upload-note">Fotos até 25 MB · Vídeos até 100 MB</span>\n            <button type="button" id="openLibraryBtn" class="btn btn-ghost btn-small">Abrir biblioteca</button>\n          </div>\n        </div>\n\n        <div class="upload-area-tabs" role="tablist" aria-label="Destino da nova mídia">\n          <button type="button" class="upload-area-tab active" data-upload-area="portfolio" role="tab" aria-selected="true">Portfólio</button>\n          <button type="button" class="upload-area-tab" data-upload-area="recent" role="tab" aria-selected="false">Trabalhos recentes</button>\n          <button type="button" class="upload-area-tab" data-upload-area="servico" role="tab" aria-selected="false">Galeria de serviços</button>\n        </div>''',
'''      <section id="uploadSection" class="upload-card admin-section contextual-manager" hidden>\n        <div class="section-heading upload-head">\n          <div>\n            <p class="eyebrow" id="contextManagerEyebrow">Gerenciar conteúdo</p>\n            <h2 id="contextManagerTitle">Portfólio</h2>\n            <p id="uploadContextHelp" class="section-copy">Envie, edite e organize as mídias desta área.</p>\n          </div>\n          <div class="upload-head-actions">\n            <span class="upload-note">Fotos até 25 MB · Vídeos até 100 MB</span>\n            <button type="button" id="closeContextBtn" class="btn btn-ghost btn-small">Fechar</button>\n          </div>\n        </div>\n        <p id="contextManagerMsg" class="msg context-manager-msg" role="status" aria-live="polite"></p>\n\n        <section id="contextEditPanel" class="context-edit-panel" hidden>\n          <div class="context-edit-head">\n            <div>\n              <p class="eyebrow">Editar mídia</p>\n              <h3>Alterar mídia selecionada</h3>\n              <p id="contextEditScope" class="section-copy"></p>\n            </div>\n            <button type="button" id="contextEditCancel" class="btn btn-ghost btn-small">Cancelar edição</button>\n          </div>\n          <div class="context-edit-layout">\n            <figure id="contextEditPreview" class="context-edit-preview"></figure>\n            <div class="context-edit-fields">\n              <label id="contextEditCategoryField">Pasta / categoria\n                <select id="contextEditCategory"></select>\n              </label>\n              <label>Posição\n                <select id="contextEditOrder"></select>\n              </label>\n              <label class="context-edit-wide">Descrição\n                <input id="contextEditAlt" type="text" maxlength="180" placeholder="Descrição da mídia">\n              </label>\n              <div class="context-edit-toggles context-edit-wide">\n                <label><input id="contextEditVisible" type="checkbox"> Publicada</label>\n                <label><input id="contextEditCover" type="checkbox"> Capa da galeria</label>\n              </div>\n              <div class="context-edit-actions context-edit-wide">\n                <button type="button" id="contextEditSave" class="btn btn-primary">Salvar alterações</button>\n              </div>\n            </div>\n          </div>\n        </section>''', 'gerenciador contextual')

context_media = '''\n      <section id="contextMediaSection" class="admin-section context-media-section" hidden>\n        <div class="section-heading context-media-head">\n          <div>\n            <p class="eyebrow">Mídias cadastradas</p>\n            <h2 id="contextMediaTitle">Portfólio</h2>\n            <p class="section-copy">Conteúdo compacto, separado por pasta ou serviço. Use Editar para ajustar uma mídia ou Excluir para removê-la definitivamente.</p>\n          </div>\n          <span id="contextMediaCount" class="context-media-count">—</span>\n        </div>\n        <div id="contextMediaGroups" class="context-media-groups" aria-live="polite"></div>\n      </section>\n'''
s = replace_once(s, '\n      <section id="librarySection" class="library admin-section" hidden>', context_media + '\n      <section id="librarySection" class="library admin-section" hidden>', 'galeria compacta contextual')

s = sub_once(s, r'\n\s*<script>\n\s*document\.querySelectorAll\(\'\[data-overview-area\]\'\).*?</script>\n', '\n', 'script inline antigo', re.S)
p.write_text(s, encoding='utf-8')

# ------------------------------------------------------------------
# admin.js
# ------------------------------------------------------------------
p = ROOT / 'admin.js'
s = p.read_text(encoding='utf-8')

s = replace_once(s,
"const libraryFolders=$('libraryFolders'), categoryFolders=$('categoryFolders'), librarySection=$('librarySection'), closeLibraryBtn=$('closeLibraryBtn'), openLibraryBtn=$('openLibraryBtn');\nconst mediaOverview=$('mediaOverview'), mediaOverviewTitle=$('mediaOverviewTitle'), mediaOverviewCopy=$('mediaOverviewCopy'), mediaOverviewCount=$('mediaOverviewCount'), mediaOverviewGrid=$('mediaOverviewGrid');\nconst testimonialsAdmin=$('testimonialsAdmin'), testimonialAdminGrid=$('testimonialAdminGrid'), testimonialAdminMsg=$('testimonialAdminMsg'), openTestimonialsBtn=$('openTestimonialsBtn'), closeTestimonialsBtn=$('closeTestimonialsBtn'), refreshTestimonialsBtn=$('refreshTestimonialsBtn');\nlet categories=[], queueEntries=[], currentUser=null, cachedAuthToken='', allMedia=[], currentUploadArea='portfolio', currentLibraryArea='all', currentOverviewArea='portfolio';",
"const libraryFolders=$('libraryFolders'), categoryFolders=$('categoryFolders'), librarySection=$('librarySection'), closeLibraryBtn=$('closeLibraryBtn'), openLibraryBtn=$('openLibraryBtn');\nconst uploadSection=$('uploadSection'), closeContextBtn=$('closeContextBtn'), contextManagerTitle=$('contextManagerTitle'), contextManagerEyebrow=$('contextManagerEyebrow'), contextManagerMsg=$('contextManagerMsg');\nconst contextMediaSection=$('contextMediaSection'), contextMediaGroups=$('contextMediaGroups'), contextMediaCount=$('contextMediaCount'), contextMediaTitle=$('contextMediaTitle');\nconst contextEditPanel=$('contextEditPanel'), contextEditPreview=$('contextEditPreview'), contextEditScope=$('contextEditScope'), contextEditCategory=$('contextEditCategory'), contextEditCategoryField=$('contextEditCategoryField'), contextEditOrder=$('contextEditOrder'), contextEditAlt=$('contextEditAlt'), contextEditVisible=$('contextEditVisible'), contextEditCover=$('contextEditCover'), contextEditSave=$('contextEditSave'), contextEditCancel=$('contextEditCancel');\nconst testimonialsAdmin=$('testimonialsAdmin'), testimonialAdminGrid=$('testimonialAdminGrid'), testimonialAdminMsg=$('testimonialAdminMsg'), openTestimonialsBtn=$('openTestimonialsBtn'), closeTestimonialsBtn=$('closeTestimonialsBtn'), refreshTestimonialsBtn=$('refreshTestimonialsBtn');\nlet categories=[], queueEntries=[], currentUser=null, cachedAuthToken='', allMedia=[], currentUploadArea='portfolio', currentLibraryArea='all', contextEditingId=null, recentWorkMeta=new Map();",
'declarações contextuais')

s = replace_once(s,
"function setMsg(el,text='',type=''){if(!el)return;el.textContent=text;el.className='msg'+(type?' '+type:'');}",
"function setMsg(el,text='',type=''){if(!el)return;el.textContent=text;el.className='msg'+(type?' '+type:'');}\nfunction setManagerMsg(text='',type=''){setMsg(contextManagerMsg,text,type);setMsg(libraryMsg,text,type);}",
'mensagem do gerenciador')

s = replace_once(s,
"    await loadCategories();\n    await loadMedia();\n    await loadTestimonialsAdmin({silent:true});",
"    await loadCategories();\n    await loadRecentWorkMeta();\n    await loadMedia();\n    await loadTestimonialsAdmin({silent:true});",
'carga inicial')

s = replace_once(s,
"function categoriesForArea(area){return categories.filter(c=>categoryArea(c.slug)===area);}\nfunction syncUploadCategories(){",
"function categoriesForArea(area){return categories.filter(c=>categoryArea(c.slug)===area);}\nasync function loadRecentWorkMeta(){\n  const {data,error}=await neon.from('recent_works').select('id,title,sort_order').order('sort_order',{ascending:true});\n  if(error){console.warn('Não foi possível carregar os nomes dos trabalhos recentes.',error);return;}\n  recentWorkMeta=new Map((data||[]).map(item=>[String(item.id),{title:item.title||'Trabalho recente',sort_order:Number(item.sort_order||0)}]));\n}\nfunction syncUploadCategories(){",
'metadados de trabalhos recentes')

old_set = '''function setUploadArea(area){\n  currentUploadArea=area;\n  uploadAreaTabs.forEach(btn=>{const on=btn.dataset.uploadArea===area;btn.classList.toggle('active',on);btn.setAttribute('aria-selected',String(on));});\n  const recent=area==='recent';\n  if(standardUploadFields)standardUploadFields.hidden=recent;\n  if(recentUploadNotice)recentUploadNotice.hidden=!recent;\n  if(uploadContextHelp)uploadContextHelp.textContent=recent\n    ? 'Trabalhos recentes têm título, data, descrição, ordem e publicação próprios.'\n    : area==='portfolio'\n      ? 'Envie fotos e vídeos diretamente para uma pasta do Portfólio.'\n      : 'Envie fotos e vídeos para a galeria de um serviço. A capa pode ser definida depois na Biblioteca.';\n  if(!recent)syncUploadCategories();\n}\nuploadAreaTabs.forEach(btn=>btn.addEventListener('click',()=>setUploadArea(btn.dataset.uploadArea)));'''
new_set = '''function areaMeta(area){\n  if(area==='recent')return {title:'Trabalhos recentes',eyebrow:'Gerenciar trabalhos',help:'Cadastre trabalhos, altere informações e gerencie as fotos e vídeos vinculados a cada um.'};\n  if(area==='servico')return {title:'Galerias de serviços',eyebrow:'Gerenciar galerias',help:'Envie, edite e organize as mídias exibidas nas galerias dos serviços.'};\n  return {title:'Portfólio',eyebrow:'Gerenciar portfólio',help:'Envie, edite e organize as fotos e vídeos do portfólio principal.'};\n}\nfunction setUploadArea(area){\n  currentUploadArea=area;\n  uploadAreaTabs.forEach(btn=>{const on=btn.dataset.uploadArea===area;btn.classList.toggle('active',on);btn.setAttribute('aria-selected',String(on));});\n  const recent=area==='recent',meta=areaMeta(area);\n  if(contextManagerTitle)contextManagerTitle.textContent=meta.title;\n  if(contextManagerEyebrow)contextManagerEyebrow.textContent=meta.eyebrow;\n  if(contextMediaTitle)contextMediaTitle.textContent=meta.title;\n  if(standardUploadFields)standardUploadFields.hidden=recent;\n  if(recentUploadNotice)recentUploadNotice.hidden=!recent;\n  if(uploadContextHelp)uploadContextHelp.textContent=meta.help;\n  if(!recent)syncUploadCategories();\n  closeContextEditor();\n  renderContextMedia();\n}\nuploadAreaTabs.forEach(btn=>btn.addEventListener('click',()=>setUploadArea(btn.dataset.uploadArea)));'''
s = replace_once(s, old_set, new_set, 'setUploadArea')

# Remove obsolete overview functions/listeners.
s = sub_once(s, r'\nfunction overviewMeta\(area\)\{.*?document\.querySelectorAll\(\'\[data-overview-area\]\'\)\.forEach\(btn=>btn\.addEventListener\(\'click\',\(\)=>\{.*?\}\)\);\n', '\n', 'overview antigo no JS', re.S)

anchor = "closeLibraryBtn?.addEventListener('click',closeLibrary);\nopenLibraryBtn?.addEventListener('click',openLibrary);\n"
context_logic = r'''closeLibraryBtn?.addEventListener('click',closeLibrary);
openLibraryBtn?.addEventListener('click',openLibrary);

function closeContextEditor(){
  contextEditingId=null;
  if(contextEditPanel)contextEditPanel.hidden=true;
  if(contextEditPreview)contextEditPreview.innerHTML='';
}
function closeContextArea(shouldScroll=true){
  if(uploadSection)uploadSection.hidden=true;
  if(contextMediaSection)contextMediaSection.hidden=true;
  closeContextEditor();
  document.querySelectorAll('[data-overview-area]').forEach(btn=>btn.classList.remove('active'));
  if(shouldScroll)document.querySelector('.admin-hub')?.scrollIntoView({behavior:'smooth',block:'start'});
}
async function openContextArea(area){
  if(testimonialsAdmin)testimonialsAdmin.hidden=true;
  if(area==='recent')await loadRecentWorkMeta();
  setUploadArea(area);
  if(uploadSection)uploadSection.hidden=false;
  if(contextMediaSection)contextMediaSection.hidden=false;
  document.querySelectorAll('[data-overview-area]').forEach(btn=>btn.classList.toggle('active',btn.dataset.overviewArea===area));
  renderContextMedia();
  uploadSection?.scrollIntoView({behavior:'smooth',block:'start'});
}
document.querySelectorAll('[data-overview-area]').forEach(btn=>btn.addEventListener('click',()=>openContextArea(btn.dataset.overviewArea)));
closeContextBtn?.addEventListener('click',()=>closeContextArea(true));
openTestimonialsBtn?.addEventListener('click',()=>closeContextArea(false));
window.addEventListener('studio:recent-works-changed',async()=>{
  try{await loadRecentWorkMeta();await loadMedia();}catch(err){console.warn('Não foi possível sincronizar as mídias recentes no resumo do painel.',err);}
});
'''
s = replace_once(s, anchor, context_logic, 'abertura contextual')

# Keep upload feedback inside the visible contextual manager.
s = s.replace("setMsg(libraryMsg,'');", "setManagerMsg('');")
s = s.replace("setMsg(libraryMsg,`${done} arquivo${done===1?'':'s'} enviado${done===1?'':'s'} com sucesso.`,'success');", "setManagerMsg(`${done} arquivo${done===1?'':'s'} enviado${done===1?'':'s'} com sucesso.`,'success');")
s = s.replace("setMsg(libraryMsg,`${done} arquivo${done===1?'':'s'} enviado${done===1?'':'s'} com sucesso. Abra a Biblioteca pelo card 04 quando quiser organizar as mídias.`,'success');", "setManagerMsg(`${done} arquivo${done===1?'':'s'} enviado${done===1?'':'s'} com sucesso. As mídias já aparecem organizadas abaixo.`,'success');")
s = s.replace("console.error(err);setMsg(libraryMsg,err?.message||'Não foi possível concluir o envio.','error');", "console.error(err);setManagerMsg(err?.message||'Não foi possível concluir o envio.','error');")

old_load = '''async function loadMedia(){\n  imageGrid.innerHTML='<div class="empty">Carregando biblioteca…</div>';\n  refreshBtn.disabled=true;refreshBtn.textContent='Atualizando…';\n  const {data,error}=await neon.from('site_images').select('*').order('category',{ascending:true}).order('sort_order',{ascending:true});\n  refreshBtn.disabled=false;refreshBtn.textContent='Atualizar biblioteca';\n  if(error){\n    console.error(error);imageGrid.innerHTML='<div class="empty">Não foi possível carregar a biblioteca.</div>';setMsg(libraryMsg,'Falha ao carregar as mídias.','error');return;\n  }\n  allMedia=(data||[]).filter(m=>!RETIRED_PRODUCT_SERVICES.has(m.category));\n  updateSummary();\n  renderOverview();\n  applyFilters();\n}\nfunction updateSummary(){\n  $('statTotal').textContent=allMedia.length;\n  $('statVisible').textContent=allMedia.filter(m=>m.is_visible).length;\n  $('statHidden').textContent=allMedia.filter(m=>!m.is_visible).length;\n  $('statCovers').textContent=allMedia.filter(m=>m.is_cover).length;'''
new_load = '''async function loadMedia(){\n  if(imageGrid&&!librarySection?.hidden)imageGrid.innerHTML='<div class="empty">Carregando biblioteca…</div>';\n  if(refreshBtn){refreshBtn.disabled=true;refreshBtn.textContent='Atualizando…';}\n  const {data,error}=await neon.from('site_images').select('*').order('category',{ascending:true}).order('sort_order',{ascending:true});\n  if(refreshBtn){refreshBtn.disabled=false;refreshBtn.textContent='Atualizar biblioteca';}\n  if(error){\n    console.error(error);\n    if(imageGrid&&!librarySection?.hidden)imageGrid.innerHTML='<div class="empty">Não foi possível carregar a biblioteca.</div>';\n    setManagerMsg('Falha ao carregar as mídias.','error');return;\n  }\n  allMedia=(data||[]).filter(m=>!RETIRED_PRODUCT_SERVICES.has(m.category));\n  updateSummary();\n  renderContextMedia();\n  if(librarySection&&!librarySection.hidden)applyFilters();\n}\nfunction updateSummary(){\n  if($('statTotal'))$('statTotal').textContent=allMedia.length;'''
s = replace_once(s, old_load, new_load, 'loadMedia/updateSummary')

context_functions = r'''
function contextGroupInfo(media){
  if(media.recent_work_id){
    const meta=recentWorkMeta.get(String(media.recent_work_id));
    return {key:'recent:'+media.recent_work_id,label:meta?.title||'Trabalho recente',rank:meta?.sort_order??9999};
  }
  return {key:'category:'+media.category,label:categoryLabel(media.category).replace(/^Portfólio\s*[—-]\s*/i,''),rank:categoryRank(media.category)};
}
function renderContextMedia(){
  if(!contextMediaGroups)return;
  const items=allMedia.filter(m=>categoryArea(m.category)===currentUploadArea);
  if(contextMediaCount)contextMediaCount.textContent=`${items.length} mídia${items.length===1?'':'s'}`;
  if(!items.length){contextMediaGroups.innerHTML='<div class="context-media-empty">Nenhuma mídia cadastrada nesta área.</div>';return;}
  const groups=new Map();
  items.forEach(media=>{
    const info=contextGroupInfo(media);
    if(!groups.has(info.key))groups.set(info.key,{...info,items:[]});
    groups.get(info.key).items.push(media);
  });
  const ordered=[...groups.values()].sort((a,b)=>a.rank-b.rank||a.label.localeCompare(b.label,'pt-BR'));
  contextMediaGroups.innerHTML=ordered.map(group=>{
    const cards=group.items.slice().sort(compareMediaOrder).map(media=>{
      const video=isVideoType(media.mime_type);
      const preview=video?`<video src="${esc(media.public_url)}" muted preload="metadata"></video>`:`<img src="${esc(media.public_url)}" alt="${esc(media.alt_text||group.label)}" loading="lazy">`;
      const badges=[media.is_cover?'<span class="context-media-badge">Capa</span>':'',!media.is_visible?'<span class="context-media-badge muted-badge">Oculta</span>':''].join('');
      return `<article class="context-media-card" data-id="${esc(media.id)}" data-key="${esc(media.storage_key)}"><figure>${preview}<div class="context-media-badges">${badges}</div></figure><div class="context-media-card-body"><p>${esc(media.alt_text|| (video?'Vídeo':'Foto'))}</p><div class="context-media-actions"><button type="button" class="btn btn-ghost context-edit-btn">Editar</button><button type="button" class="btn btn-danger delete-btn">Excluir</button></div></div></article>`;
    }).join('');
    return `<section class="context-media-group"><div class="context-media-group-head"><h3>${esc(group.label)}</h3><span>${group.items.length} mídia${group.items.length===1?'':'s'}</span></div><div class="context-media-grid">${cards}</div></section>`;
  }).join('');
  contextMediaGroups.querySelectorAll('.context-media-card').forEach(card=>{
    card.querySelector('.context-edit-btn')?.addEventListener('click',()=>{const media=cardOriginalMedia(card);if(media)openContextEditor(media);});
    card.querySelector('.delete-btn')?.addEventListener('click',()=>deleteCard(card));
  });
}
function syncContextEditOrder(preferred=null){
  const original=allMedia.find(item=>String(item.id)===String(contextEditingId));
  if(!original||!contextEditOrder)return;
  const category=original.recent_work_id?original.category:contextEditCategory.value;
  const target={...original,category};
  const peers=allMedia.filter(item=>String(item.id)!==String(original.id)&&orderScopeKey(item)===orderScopeKey(target)).slice().sort(compareMediaOrder);
  let position=preferred;
  if(position==null){
    const sameScope=orderScopeKey(original)===orderScopeKey(target);
    const current=sameScope?orderedScopeItems(original).findIndex(item=>String(item.id)===String(original.id))+1:peers.length+1;
    position=current||1;
  }
  contextEditOrder.innerHTML=orderOptions(peers.length+1,position);
}
function openContextEditor(media){
  contextEditingId=media.id;
  if(!contextEditPanel)return;
  const video=isVideoType(media.mime_type);
  contextEditPreview.innerHTML=video?`<video src="${esc(media.public_url)}" controls preload="metadata"></video>`:`<img src="${esc(media.public_url)}" alt="${esc(media.alt_text||'')}" loading="lazy">`;
  const group=contextGroupInfo(media);
  contextEditScope.textContent=group.label;
  if(media.recent_work_id){
    contextEditCategoryField.hidden=true;
    contextEditCategory.innerHTML=`<option value="${esc(media.category)}">${esc(group.label)}</option>`;
  }else{
    contextEditCategoryField.hidden=false;
    const options=categoriesForArea(currentUploadArea);
    contextEditCategory.innerHTML=options.map(c=>`<option value="${esc(c.slug)}" ${c.slug===media.category?'selected':''}>${esc(c.label.replace(/^Portfólio\s*[—-]\s*/i,''))}</option>`).join('');
  }
  contextEditAlt.value=media.alt_text||'';
  contextEditVisible.checked=!!media.is_visible;
  contextEditCover.checked=!!media.is_cover;
  contextEditCover.disabled=video;
  syncContextEditOrder();
  contextEditPanel.hidden=false;
  contextEditPanel.scrollIntoView({behavior:'smooth',block:'nearest'});
}
async function saveContextEditor(){
  const original=allMedia.find(item=>String(item.id)===String(contextEditingId));
  if(!original)return;
  const category=original.recent_work_id?original.category:contextEditCategory.value;
  const video=isVideoType(original.mime_type);
  const isCover=!video&&contextEditCover.checked;
  const target={...original,category};
  const oldScope=orderScopeKey(original),newScope=orderScopeKey(target);
  const peers=allMedia.filter(item=>String(item.id)!==String(original.id)&&orderScopeKey(item)===newScope).slice().sort(compareMediaOrder);
  const desired=Math.min(peers.length+1,Math.max(1,Math.trunc(Number(contextEditOrder.value)||1)));
  const payload={category,sort_order:desired,alt_text:contextEditAlt.value.trim(),is_visible:contextEditVisible.checked,is_cover:isCover};
  contextEditSave.disabled=true;contextEditSave.textContent='Salvando…';setManagerMsg('Salvando alterações…');
  try{
    if(isCover){
      let q=neon.from('site_images').update({is_cover:false});
      q=original.recent_work_id?q.eq('recent_work_id',original.recent_work_id):q.eq('category',category);
      const {error}=await q.neq('id',original.id);if(error)throw error;
    }
    const {error}=await neon.from('site_images').update(payload).eq('id',original.id);if(error)throw error;
    const sequence=peers.slice();sequence.splice(desired-1,0,{...original,...payload});await persistMediaSequence(sequence);
    if(oldScope!==newScope){const oldSequence=allMedia.filter(item=>String(item.id)!==String(original.id)&&orderScopeKey(item)===oldScope).slice().sort(compareMediaOrder);await persistMediaSequence(oldSequence);}
    await loadMedia();closeContextEditor();setManagerMsg('Mídia atualizada com sucesso.','success');
  }catch(err){console.error(err);setManagerMsg('Não foi possível salvar esta mídia.','error');}
  finally{contextEditSave.disabled=false;contextEditSave.textContent='Salvar alterações';}
}
contextEditSave?.addEventListener('click',saveContextEditor);
contextEditCancel?.addEventListener('click',closeContextEditor);
contextEditCategory?.addEventListener('change',()=>syncContextEditOrder());

'''
s = replace_once(s, '\nfunction cardOriginalMedia(card){', '\n'+context_functions+'function cardOriginalMedia(card){', 'funções da galeria compacta')

# Cover changes in the hidden legacy editor must also respect recent-work scope.
s = replace_once(s,
"    if(isCover){\n      const {error:e}=await neon.from('site_images').update({is_cover:false}).eq('category',category).neq('id',id);\n      if(e)throw e;\n    }",
"    if(isCover){\n      let coverQuery=neon.from('site_images').update({is_cover:false});\n      coverQuery=original.recent_work_id?coverQuery.eq('recent_work_id',original.recent_work_id):coverQuery.eq('category',category);\n      const {error:e}=await coverQuery.neq('id',id);\n      if(e)throw e;\n    }",
'escopo de capa')

s = s.replace("if(!confirm('Excluir esta mídia da biblioteca e do site? Esta ação não pode ser desfeita.'))return;", "if(!confirm('Excluir esta mídia desta galeria e do site? Esta ação não pode ser desfeita.'))return;")
s = s.replace("setMsg(libraryMsg,warning?'Mídia removida. Parte da limpeza automática não pôde ser concluída; atualize a biblioteca e tente novamente se necessário.':'Mídia excluída e ordem da galeria reorganizada.',warning?'warn':'success');", "setManagerMsg(warning?'Mídia removida. Parte da limpeza automática não pôde ser concluída; atualize e tente novamente se necessário.':'Mídia excluída e ordem da galeria reorganizada.',warning?'warn':'success');")
s = s.replace("console.error(e);setMsg(libraryMsg,'Não foi possível excluir esta mídia.','error');btn.disabled=false;btn.textContent='Excluir';", "console.error(e);setManagerMsg('Não foi possível excluir esta mídia.','error');btn.disabled=false;btn.textContent='Excluir';")

p.write_text(s, encoding='utf-8')

# ------------------------------------------------------------------
# recent-works-admin.js — notify the main contextual gallery immediately.
# ------------------------------------------------------------------
p = ROOT / 'recent-works-admin.js'
s = p.read_text(encoding='utf-8')
s = replace_once(s,
"function notifyRecentWorksChanged() {\n  try { localStorage.setItem('studio-recent-works-updated', String(Date.now())); } catch (_) {}\n}",
"function notifyRecentWorksChanged() {\n  try { localStorage.setItem('studio-recent-works-updated', String(Date.now())); } catch (_) {}\n  try { window.dispatchEvent(new CustomEvent('studio:recent-works-changed')); } catch (_) {}\n}",
'evento de trabalhos recentes')
p.write_text(s, encoding='utf-8')

# ------------------------------------------------------------------
# admin.css — contextual manager layout.
# ------------------------------------------------------------------
p = ROOT / 'admin.css'
s = p.read_text(encoding='utf-8')
marker='/* ---------- PAINEL CONTEXTUAL 2026-09 ---------- */'
if marker not in s:
    s += r'''

/* ---------- PAINEL CONTEXTUAL 2026-09 ---------- */
.header-actions{align-items:center}
.header-media-stat{min-width:84px;display:flex;align-items:baseline;justify-content:center;gap:8px;padding:9px 13px;border:1px solid var(--line);border-radius:10px;background:rgba(255,255,255,.018)}
.header-media-stat small{color:var(--muted);font-size:.7rem;letter-spacing:.06em;text-transform:uppercase}
.header-media-stat strong{font-family:'Cormorant Garamond',serif;font-size:1.55rem;font-weight:500;color:var(--gold2);line-height:1}
.contextual-manager{scroll-margin-top:20px}
.context-manager-msg{margin:14px 0 0}
.context-edit-panel{margin-top:22px;padding:18px;border:1px solid var(--line);border-radius:14px;background:var(--card-2)}
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
.context-media-section{scroll-margin-top:20px}
.context-media-count{display:inline-flex;align-items:center;justify-content:center;min-width:84px;padding:8px 12px;border:1px solid var(--line);border-radius:999px;color:var(--gold2);font-size:.78rem}
.context-media-groups{display:grid;gap:24px;margin-top:22px}
.context-media-group{display:grid;gap:11px;padding-top:20px;border-top:1px solid var(--line)}
.context-media-group:first-child{padding-top:0;border-top:0}
.context-media-group-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
.context-media-group-head h3{font-size:1.25rem}
.context-media-group-head span{color:var(--muted);font-size:.72rem}
.context-media-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.context-media-card{min-width:0;overflow:hidden;border:1px solid var(--line);border-radius:12px;background:var(--card-2)}
.context-media-card figure{position:relative;margin:0;aspect-ratio:4/3;overflow:hidden;background:#090908}
.context-media-card img,.context-media-card video{width:100%;height:100%;display:block;object-fit:cover}
.context-media-badges{position:absolute;left:7px;top:7px;display:flex;gap:5px;flex-wrap:wrap}
.context-media-badge{padding:4px 6px;border:1px solid rgba(241,238,232,.16);border-radius:999px;background:rgba(8,8,7,.82);font-size:.58rem;color:var(--cream)}
.context-media-badge.muted-badge{color:var(--danger)}
.context-media-card-body{display:grid;gap:8px;padding:9px}
.context-media-card-body p{margin:0;min-height:30px;color:var(--muted);font-size:.7rem;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.context-media-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.context-media-actions .btn{padding:7px 6px;font-size:.68rem}
.context-media-empty{padding:34px 18px;border:1px dashed var(--line);border-radius:12px;color:var(--muted);text-align:center}
@media(max-width:820px){.context-edit-layout{grid-template-columns:1fr}.context-edit-preview{max-height:320px}.context-media-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:560px){.header-actions{display:grid;grid-template-columns:1fr 1fr}.header-media-stat{grid-column:1/-1;justify-content:flex-start}.context-edit-head{flex-direction:column}.context-edit-fields{grid-template-columns:1fr}.context-edit-wide{grid-column:auto}.context-edit-actions .btn{width:100%}.context-media-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.context-media-card-body p{min-height:0}.context-media-actions{grid-template-columns:1fr}.context-media-actions .btn{width:100%}}
'''
p.write_text(s, encoding='utf-8')

# ------------------------------------------------------------------
# Permanent validation guards.
# ------------------------------------------------------------------
p = ROOT / 'scripts/validate_site.py'
s = p.read_text(encoding='utf-8')
anchor = "if not (ROOT/'admin-testimonials.js').exists(): errors.append('Painel: módulo de moderação de depoimentos ausente')\n"
addition = """if not (ROOT/'admin-testimonials.js').exists(): errors.append('Painel: módulo de moderação de depoimentos ausente')\nadmin_html=(ROOT/'admin.html').read_text(encoding='utf-8')\nadmin_js=(ROOT/'admin.js').read_text(encoding='utf-8')\nfor legacy_metric in ('statVisible','statHidden','statCovers'):\n    if legacy_metric in admin_html: errors.append(f'Painel: métrica legada ainda presente: {legacy_metric}')\nfor required_panel_id in ('statTotal','uploadSection','contextEditPanel','contextMediaSection','contextMediaGroups'):\n    if f'id=\"{required_panel_id}\"' not in admin_html: errors.append(f'Painel: estrutura contextual ausente: {required_panel_id}')\nif 'renderContextMedia' not in admin_js or 'saveContextEditor' not in admin_js: errors.append('Painel: gerenciador contextual de mídias incompleto')\n"""
s = replace_once(s, anchor, addition, 'validação permanente do painel')
p.write_text(s, encoding='utf-8')

# Basic local guards before CI.
admin_html=(ROOT/'admin.html').read_text(encoding='utf-8')
admin_js=(ROOT/'admin.js').read_text(encoding='utf-8')
if any(x in admin_html for x in ('id="statVisible"','id="statHidden"','id="statCovers"')):
    raise SystemExit('Métricas antigas ainda estão no HTML')
if 'contextMediaSection' not in admin_html or 'renderContextMedia' not in admin_js:
    raise SystemExit('Gerenciador contextual não foi instalado corretamente')
print('Painel contextual aplicado.')
