from pathlib import Path

# ---------- admin.html ----------
p=Path('admin.html')
s=p.read_text(encoding='utf-8')

# Convert static overview cards back to buttons, but with overview-only behavior.
s=s.replace('<article class="hub-card hub-card-static">','<button type="button" class="hub-card" data-overview-area="portfolio">',1)
s=s.replace('<article class="hub-card hub-card-static">','<button type="button" class="hub-card" data-overview-area="recent">',1)
s=s.replace('<article class="hub-card hub-card-static">','<button type="button" class="hub-card" data-overview-area="servico">',1)
s=s.replace('<article class="hub-card hub-card-static">','<button type="button" class="hub-card" data-overview-area="all">',1)
s=s.replace('<span class="hub-link hub-status">Visão geral</span>\n        </article>','<span class="hub-link">Ver visão geral →</span>\n        </button>',4)

# Add independent overview panel between cards and Update site.
anchor='''      </section>\n\n      <section id="uploadSection" class="upload-card admin-section">'''
overview='''      </section>\n\n      <section id="mediaOverview" class="media-overview" aria-live="polite">\n        <div class="media-overview-head">\n          <div>\n            <p class="eyebrow">Visão geral</p>\n            <h2 id="mediaOverviewTitle">Portfólio</h2>\n            <p id="mediaOverviewCopy" class="section-copy">Uma visão rápida das mídias publicadas nesta área.</p>\n          </div>\n          <span id="mediaOverviewCount" class="overview-count">—</span>\n        </div>\n        <div id="mediaOverviewGrid" class="overview-grid"></div>\n      </section>\n\n      <section id="uploadSection" class="upload-card admin-section">'''
if anchor not in s: raise SystemExit('overview insertion anchor not found')
s=s.replace(anchor,overview,1)
p.write_text(s,encoding='utf-8')

# ---------- admin.js ----------
p=Path('admin.js')
s=p.read_text(encoding='utf-8')

# Add overview refs/state.
s=s.replace("const libraryFolders=$('libraryFolders'), categoryFolders=$('categoryFolders'), librarySection=$('librarySection'), closeLibraryBtn=$('closeLibraryBtn'), openLibraryBtn=$('openLibraryBtn');",
            "const libraryFolders=$('libraryFolders'), categoryFolders=$('categoryFolders'), librarySection=$('librarySection'), closeLibraryBtn=$('closeLibraryBtn'), openLibraryBtn=$('openLibraryBtn');\nconst mediaOverview=$('mediaOverview'), mediaOverviewTitle=$('mediaOverviewTitle'), mediaOverviewCopy=$('mediaOverviewCopy'), mediaOverviewCount=$('mediaOverviewCount'), mediaOverviewGrid=$('mediaOverviewGrid');",1)
s=s.replace("let categories=[], queueEntries=[], currentUser=null, allMedia=[], currentUploadArea='portfolio', currentLibraryArea='all';",
            "let categories=[], queueEntries=[], currentUser=null, allMedia=[], currentUploadArea='portfolio', currentLibraryArea='all', currentOverviewArea='portfolio';",1)

# Add independent overview functions before file input listeners.
anchor="fileInput.addEventListener('change',()=>setFiles([...fileInput.files]));"
code=r'''function overviewMeta(area){
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

'''
if anchor not in s: raise SystemExit('overview js anchor not found')
s=s.replace(anchor,code+anchor,1)

# Ensure overview refreshes with media.
s=s.replace("  updateSummary();\n  applyFilters();","  updateSummary();\n  renderOverview();\n  applyFilters();",1)
p.write_text(s,encoding='utf-8')

# ---------- recent-works-admin.js ----------
p=Path('recent-works-admin.js')
s=p.read_text(encoding='utf-8')

# Rename visible field only; retain DB column gallery_category.
s=s.replace('<label>Galeria\n        <select id="recentGallery" required></select>','<label>Categoria\n        <select id="recentGallery" required></select>',1)
s=s.replace('Cada trabalho pode ter suas próprias fotos e vídeos.', 'Cada trabalho pode ter suas próprias fotos e vídeos.',1)
s=s.replace('A Home mostra os 3 primeiros itens ativos, de acordo com a ordem.','É possível cadastrar no máximo 3 trabalhos, que são exibidos na Home de acordo com a ordem.',1)

# Track loaded total.
s=s.replace('let mediaWorkId = null;','let mediaWorkId = null;\nlet recentWorkCount = 0;',1)

# After items loaded, store count and update form state.
anchor='''  const items = data || [];\n  if (!items.length) {'''
replacement='''  const items = data || [];\n  recentWorkCount = items.length;\n  updateRecentLimitState();\n  if (!items.length) {'''
if anchor not in s: raise SystemExit('recent count anchor not found')
s=s.replace(anchor,replacement,1)

# Add limit helper before resetForm.
anchor='''function resetForm() {'''
helper=r'''function updateRecentLimitState(){
  const save=document.getElementById('recentSave');
  if(!save)return;
  const atLimit=recentWorkCount>=3 && !editingId;
  save.disabled=atLimit;
  save.textContent=atLimit?'Limite de 3 trabalhos atingido':(editingId?'Salvar alterações':'Adicionar trabalho');
  const form=document.getElementById('recentForm');
  if(form)form.classList.toggle('recent-limit-reached',atLimit);
  if(atLimit)setStatus('Você já cadastrou o máximo de 3 trabalhos recentes. Exclua um trabalho para adicionar outro.','');
}

'''
if anchor not in s: raise SystemExit('limit helper anchor not found')
s=s.replace(anchor,helper+anchor,1)

# reset should respect limit.
s=s.replace("  const save = document.getElementById('recentSave'); if (save) save.textContent = 'Adicionar trabalho';",
            "  const save = document.getElementById('recentSave'); if (save) save.textContent = 'Adicionar trabalho';\n  updateRecentLimitState();",1)

# edit state should enable save even when 3 already exist.
s=s.replace("  document.getElementById('recentSave').textContent = 'Salvar alterações';",
            "  document.getElementById('recentSave').disabled = false;\n  document.getElementById('recentSave').textContent = 'Salvar alterações';",1)

# Guard create at max before payload submission.
anchor='''async function saveItem(e) {\n  e.preventDefault();\n  const save = document.getElementById('recentSave');'''
replacement='''async function saveItem(e) {\n  e.preventDefault();\n  const save = document.getElementById('recentSave');\n  if(!editingId && recentWorkCount>=3){\n    setStatus('Limite de 3 trabalhos recentes atingido. Exclua um trabalho antes de cadastrar outro.','err');\n    updateRecentLimitState();\n    return;\n  }'''
if anchor not in s: raise SystemExit('save guard anchor not found')
s=s.replace(anchor,replacement,1)

# Prevent finally from re-enabling add button incorrectly.
s=s.replace("    save.disabled = false;\n    if (!editingId) save.textContent = 'Adicionar trabalho';",
            "    save.disabled = false;\n    if (!editingId) save.textContent = 'Adicionar trabalho';\n    updateRecentLimitState();",1)
p.write_text(s,encoding='utf-8')

# ---------- admin.css ----------
p=Path('admin.css')
s=p.read_text(encoding='utf-8')
s += r'''

/* Visão geral independente dos cards 01–04. */
.hub-card.active{border-color:rgba(230,200,120,.48);background:rgba(201,162,75,.075)}
.media-overview{margin-top:16px;padding:18px 20px;border:1px solid rgba(201,162,75,.12);border-radius:14px;background:rgba(255,255,255,.012)}
.media-overview-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:14px}
.media-overview-head h2{font-size:1.35rem}
.overview-count{color:var(--muted);font-size:.76rem;white-space:nowrap}
.overview-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px}
.overview-media{min-width:0}
.overview-media figure{position:relative;margin:0;aspect-ratio:4/3;border-radius:10px;overflow:hidden;background:#090806;border:1px solid rgba(201,162,75,.10)}
.overview-media img,.overview-media video{width:100%;height:100%;object-fit:cover;display:block}
.overview-media figure span{position:absolute;left:7px;bottom:7px;padding:3px 6px;border-radius:999px;background:rgba(8,7,6,.78);font-size:.58rem;color:#d9cfbc}
.overview-media small{display:block;margin-top:5px;color:#817765;font-size:.66rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.overview-empty,.overview-more{display:grid;place-items:center;min-height:94px;border:1px dashed rgba(201,162,75,.12);border-radius:10px;color:#817765;font-size:.75rem;text-align:center;padding:12px}
.recent-limit-reached{opacity:.88}
@media(max-width:980px){.overview-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media(max-width:640px){.overview-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.media-overview-head{align-items:flex-start;flex-direction:column}}
'''
p.write_text(s,encoding='utf-8')
