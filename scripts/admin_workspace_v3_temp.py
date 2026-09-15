from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
html=ROOT/'admin.html'
s=html.read_text(encoding='utf-8')

s=s.replace('  <link rel="stylesheet" href="admin-theme.css?v=20260914-neutral">','  <link rel="stylesheet" href="admin-theme.css?v=20260914-neutral">\n  <link rel="stylesheet" href="admin-workspace.css?v=20260915-v3">')

old='''        <div class="header-actions">\n          <a class="btn btn-ghost" href="/" target="_blank" rel="noopener">Ver site</a>\n          <button type="button" id="logoutBtn" class="btn btn-ghost">Sair</button>\n        </div>'''
new='''        <div class="header-actions">\n          <div class="header-media-stat" aria-label="Total de mídias cadastradas"><small>Mídias</small><span id="statTotal">—</span></div>\n          <a class="btn btn-ghost" href="/" target="_blank" rel="noopener">Ver site</a>\n          <button type="button" id="logoutBtn" class="btn btn-ghost">Sair</button>\n        </div>'''
if old not in s: raise SystemExit('header actions não encontrado')
s=s.replace(old,new,1)

start=s.find('      <section id="panelHome" class="media-summary media-summary-compact" aria-label="Resumo do conteúdo">')
if start<0: raise SystemExit('resumo de métricas não encontrado')
end=s.find('      </section>',start)
if end<0: raise SystemExit('fim resumo não encontrado')
s=s[:start]+s[end+len('      </section>\n'):]

s=s.replace('<section id="mediaOverview" class="media-overview" aria-live="polite" hidden>','<section id="mediaOverview" class="media-overview legacy-overview" aria-live="polite" hidden>')
s=s.replace('<section id="uploadSection" class="upload-card admin-section">','<section id="mediaEditorSection" class="workspace-editor admin-section" hidden></section>\n\n      <section id="uploadSection" class="upload-card admin-section" hidden>')
s=s.replace('<h2>Enviar fotos ou vídeos</h2>','<h2 id="workspaceUploadTitle">Enviar fotos ou vídeos</h2>',1)
s=s.replace('<button type="button" id="openLibraryBtn" class="btn btn-ghost btn-small">Abrir biblioteca</button>','<button type="button" id="openLibraryBtn" class="btn btn-ghost btn-small">Biblioteca completa</button>',1)
needle='''      </section>\n\n      <section id="librarySection" class="library admin-section" hidden>'''
insert='''      </section>\n\n      <section id="workspaceMediaSection" class="workspace-media admin-section" hidden>\n        <div class="section-heading workspace-media-head">\n          <div>\n            <p class="eyebrow">Mídias desta área</p>\n            <h2 id="workspaceMediaTitle">Mídias</h2>\n            <p id="workspaceMediaCopy" class="section-copy">As mídias aparecem agrupadas por galeria ou serviço.</p>\n          </div>\n          <div class="library-head-actions">\n            <span id="workspaceMediaCount" class="overview-count">—</span>\n            <button type="button" id="workspaceRefreshBtn" class="btn btn-ghost btn-small">Atualizar</button>\n          </div>\n        </div>\n        <p id="workspaceMsg" class="msg" role="status" aria-live="polite"></p>\n        <div id="workspaceMediaGroups" class="workspace-groups"></div>\n      </section>\n\n      <section id="librarySection" class="library admin-section" hidden>'''
if needle not in s: raise SystemExit('ponto de inserção da mídia compacta não encontrado')
s=s.replace(needle,insert,1)

old_inline='''  <script>\n    document.querySelectorAll('[data-overview-area]').forEach(button => {\n      button.addEventListener('click', () => {\n        const overview = document.getElementById('mediaOverview');\n        if (overview) overview.hidden = false;\n      });\n    });\n    document.getElementById('openTestimonialsBtn')?.addEventListener('click', () => {\n      const overview = document.getElementById('mediaOverview');\n      if (overview) overview.hidden = true;\n    });\n  </script>\n  <script type="module" src="admin.js?v=20260911-editor-v2"></script>'''
new_inline='''  <script type="module" src="admin.js?v=20260915-workspace-v3"></script>\n  <script type="module" src="admin-workspace.js?v=20260915-workspace-v3"></script>'''
if old_inline not in s: raise SystemExit('scripts finais antigos não encontrados')
s=s.replace(old_inline,new_inline,1)
html.write_text(s,encoding='utf-8')

# Admin core: notify the contextual workspace after every successful media refresh.
p=ROOT/'admin.js'
s=p.read_text(encoding='utf-8')
old='''  updateSummary();\n  renderOverview();\n  applyFilters();\n}'''
new='''  updateSummary();\n  renderOverview();\n  applyFilters();\n  window.dispatchEvent(new CustomEvent('studio:media-updated'));\n}'''
if old not in s: raise SystemExit('fim de loadMedia não encontrado')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')

# Permanent validation for the new panel module.
p=ROOT/'scripts/validate_site.py'
s=p.read_text(encoding='utf-8')
s=s.replace("if not (ROOT/'admin-testimonials.js').exists(): errors.append('Painel: módulo de moderação de depoimentos ausente')", "if not (ROOT/'admin-testimonials.js').exists(): errors.append('Painel: módulo de moderação de depoimentos ausente')\nif not (ROOT/'admin-workspace.js').exists(): errors.append('Painel: módulo contextual de mídias ausente')")
s=s.replace("'admin.js','admin-testimonials.js','recent-works-admin.js'", "'admin.js','admin-testimonials.js','admin-workspace.js','recent-works-admin.js'")
p.write_text(s,encoding='utf-8')

css=r'''/* Painel V3 — workspace contextual */
.header-actions{align-items:center}
.header-media-stat{display:flex;align-items:baseline;gap:8px;padding:9px 13px;border:1px solid var(--line);border-radius:10px;background:rgba(255,255,255,.02);white-space:nowrap}
.header-media-stat small{font-size:.68rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.header-media-stat span{font-family:'Cormorant Garamond',serif;font-size:1.45rem;line-height:1;color:var(--gold2)}
.legacy-overview{display:none!important}
.upload-area-tabs{display:none!important}
.upload-card[hidden],.workspace-media[hidden],.workspace-editor[hidden]{display:none!important}
.hub-card.workspace-active{border-color:rgba(216,210,199,.38);background:rgba(255,255,255,.055)}
.hub-card.workspace-active .hub-link{color:var(--cream)}
.workspace-editor{padding:22px 28px}
.workspace-editor-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;margin-bottom:18px}
.workspace-editor-grid{display:grid;grid-template-columns:1.15fr 1fr .62fr;gap:12px}
.workspace-editor-grid label{display:grid;gap:6px;color:var(--muted);font-size:.76rem}
.workspace-editor-grid input,.workspace-editor-grid select{width:100%;padding:10px 11px;border:1px solid var(--line);border-radius:9px;background:var(--card-2);color:var(--cream);outline:none}
.workspace-editor-toggles{display:flex;gap:18px;align-items:center;flex-wrap:wrap;margin-top:14px;color:var(--muted);font-size:.8rem}
.workspace-editor-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:16px}
.workspace-media{padding:24px 28px}
.workspace-media-head{margin-bottom:14px}
.workspace-groups{display:grid;gap:18px}
.workspace-group{border-top:1px solid var(--line);padding-top:16px}
.workspace-group:first-child{border-top:0;padding-top:4px}
.workspace-group-head{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:10px}
.workspace-group-head h3{margin:0;font:500 1.08rem 'Cormorant Garamond',serif;color:var(--cream)}
.workspace-group-head small{color:var(--muted);font-size:.7rem}
.workspace-compact-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}
.workspace-media-card{min-width:0;border:1px solid var(--line);border-radius:11px;background:var(--card-2);overflow:hidden}
.workspace-media-card figure{position:relative;margin:0;aspect-ratio:1/1;background:#080807;overflow:hidden}
.workspace-media-card img,.workspace-media-card video{width:100%;height:100%;object-fit:cover;display:block}
.workspace-media-card video{pointer-events:none}
.workspace-media-card .workspace-badges{position:absolute;left:6px;top:6px;display:flex;gap:4px;flex-wrap:wrap}
.workspace-media-card .workspace-badge{padding:3px 5px;border:1px solid rgba(241,238,232,.16);border-radius:999px;background:rgba(8,8,7,.8);font-size:.52rem;color:var(--cream)}
.workspace-media-card .workspace-badge.warn{color:#e3b5ad;border-color:rgba(228,138,128,.28)}
.workspace-media-body{padding:8px;display:grid;gap:7px}
.workspace-media-meta{min-width:0;color:var(--muted);font-size:.62rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.workspace-media-actions{display:grid;grid-template-columns:1fr 1fr;gap:5px}
.workspace-media-actions .btn{padding:6px 4px;border-radius:7px;font-size:.64rem}
.workspace-empty{padding:34px 18px;border:1px dashed var(--line);border-radius:12px;color:var(--muted);text-align:center}
@media(max-width:1100px){.workspace-compact-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media(max-width:820px){
  .header-media-stat{order:-1}
  .workspace-editor-grid{grid-template-columns:1fr 1fr}
  .workspace-editor-grid label:first-child{grid-column:1/-1}
  .workspace-compact-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
}
@media(max-width:560px){
  .header-actions{display:grid;grid-template-columns:auto 1fr 1fr}
  .header-media-stat{padding:8px 10px}
  .workspace-editor,.workspace-media{padding:18px 14px}
  .workspace-editor-grid{grid-template-columns:1fr}
  .workspace-editor-grid label:first-child{grid-column:auto}
  .workspace-compact-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  .workspace-media-actions{grid-template-columns:1fr}
}
'''
(ROOT/'admin-workspace.css').write_text(css,encoding='utf-8')

js=r'''import { createClient, BetterAuthVanillaAdapter } from 'https://esm.sh/@neondatabase/neon-js@0.7.0-beta?bundle';

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
'''
(ROOT/'admin-workspace.js').write_text(js,encoding='utf-8')

print('Painel V3 preparado.')
