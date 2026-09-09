from pathlib import Path

# ---------- admin.html ----------
p = Path('admin.html')
s = p.read_text(encoding='utf-8')

s = s.replace('''      <nav class="admin-nav" aria-label="Atalhos do painel">\n        <a href="#uploadSection">Enviar mídia</a>\n        <a href="#librarySection">Biblioteca</a>\n        <a href="#recentAdmin">Trabalhos recentes</a>\n      </nav>''','''      <nav class="admin-nav" aria-label="Atalhos do painel">\n        <a href="#panelHome">Início</a>\n        <a href="#uploadSection" data-jump-area="portfolio">Portfólio</a>\n        <a href="#recentAdmin">Trabalhos recentes</a>\n        <a href="#uploadSection" data-jump-area="servico">Galerias de serviços</a>\n        <a href="#librarySection">Biblioteca</a>\n      </nav>''')

s = s.replace('''      <section class="media-summary" aria-label="Resumo da biblioteca">''','''      <section id="panelHome" class="media-summary" aria-label="Resumo da biblioteca">''')

summary_end = '''      </section>\n\n      <section id="uploadSection" class="upload-card admin-section">'''
hub = '''      </section>\n\n      <section class="admin-hub" aria-label="Áreas de gerenciamento">\n        <button type="button" class="hub-card" data-hub-area="portfolio">\n          <span class="hub-icon" aria-hidden="true">01</span>\n          <strong>Portfólio</strong>\n          <small>Fotos e vídeos que compõem o portfólio principal.</small>\n          <span class="hub-link">Gerenciar →</span>\n        </button>\n        <button type="button" class="hub-card" data-hub-area="recent">\n          <span class="hub-icon" aria-hidden="true">02</span>\n          <strong>Trabalhos recentes</strong>\n          <small>Cadastre e organize os trabalhos exibidos na Home.</small>\n          <span class="hub-link">Gerenciar →</span>\n        </button>\n        <button type="button" class="hub-card" data-hub-area="servico">\n          <span class="hub-icon" aria-hidden="true">03</span>\n          <strong>Galerias de serviços</strong>\n          <small>Mídias e capas abertas pelos cards de serviços.</small>\n          <span class="hub-link">Gerenciar →</span>\n        </button>\n        <button type="button" class="hub-card" data-hub-area="library">\n          <span class="hub-icon" aria-hidden="true">04</span>\n          <strong>Biblioteca</strong>\n          <small>Encontre arquivos por área e por pasta.</small>\n          <span class="hub-link">Abrir biblioteca →</span>\n        </button>\n      </section>\n\n      <section id="uploadSection" class="upload-card admin-section">'''
if summary_end not in s:
    raise SystemExit('admin.html summary anchor not found')
s = s.replace(summary_end, hub, 1)

s = s.replace('''            <p class="eyebrow">Nova mídia</p>\n            <h2>Enviar fotos ou vídeos</h2>\n            <p class="section-copy">Escolha onde a mídia deve aparecer, selecione os arquivos e confirme o envio.</p>''','''            <p class="eyebrow">Atualizar o site</p>\n            <h2>Enviar fotos ou vídeos</h2>\n            <p id="uploadContextHelp" class="section-copy">Escolha uma área abaixo. O painel mostra apenas as pastas compatíveis com esse destino.</p>''')

upload_grid = '''        <div class="upload-grid">\n          <label>Destino no site\n            <select id="uploadCategory"></select>\n          </label>'''
new_upload_grid = '''        <div class="upload-area-tabs" role="tablist" aria-label="Destino da nova mídia">\n          <button type="button" class="upload-area-tab active" data-upload-area="portfolio" role="tab" aria-selected="true">Portfólio</button>\n          <button type="button" class="upload-area-tab" data-upload-area="recent" role="tab" aria-selected="false">Trabalhos recentes</button>\n          <button type="button" class="upload-area-tab" data-upload-area="servico" role="tab" aria-selected="false">Galeria de serviços</button>\n        </div>\n        <div id="recentUploadNotice" class="recent-upload-notice" hidden>\n          <div>\n            <strong>Trabalhos recentes são gerenciados como trabalhos completos.</strong>\n            <span>Abra a seção de trabalhos recentes para escolher a galeria, título, data, descrição e publicação.</span>\n          </div>\n          <button type="button" class="btn btn-primary" id="goRecentAdmin">Gerenciar trabalhos recentes</button>\n        </div>\n\n        <div id="standardUploadFields">\n        <div class="upload-grid">\n          <label>Pasta / categoria\n            <select id="uploadCategory"></select>\n          </label>'''
if upload_grid not in s:
    raise SystemExit('admin.html upload grid anchor not found')
s = s.replace(upload_grid, new_upload_grid, 1)

s = s.replace('''        <div class="upload-footer">\n          <p id="uploadSummary" class="muted upload-summary">Nenhum arquivo selecionado.</p>\n          <button type="button" id="uploadBtn" class="btn btn-primary" disabled>Enviar selecionadas</button>\n        </div>\n      </section>''','''        <div class="upload-footer">\n          <p id="uploadSummary" class="muted upload-summary">Nenhum arquivo selecionado.</p>\n          <button type="button" id="uploadBtn" class="btn btn-primary" disabled>Enviar selecionadas</button>\n        </div>\n        </div>\n      </section>''',1)

library_head = '''        <div class="library-toolbar">'''
folders = '''        <div class="library-folders" id="libraryFolders">\n          <button type="button" class="folder-card active" data-folder-area="all">\n            <span class="folder-mark">⌂</span><span><strong>Todas as mídias</strong><small id="folderCountAll">—</small></span>\n          </button>\n          <button type="button" class="folder-card" data-folder-area="portfolio">\n            <span class="folder-mark">P</span><span><strong>Portfólio</strong><small id="folderCountPortfolio">—</small></span>\n          </button>\n          <button type="button" class="folder-card" data-folder-area="servico">\n            <span class="folder-mark">S</span><span><strong>Galerias de serviços</strong><small id="folderCountServico">—</small></span>\n          </button>\n        </div>\n        <div id="categoryFolders" class="category-folders" aria-live="polite"></div>\n\n        <div class="library-toolbar">'''
if library_head not in s:
    raise SystemExit('admin.html library toolbar anchor not found')
s = s.replace(library_head, folders, 1)

p.write_text(s, encoding='utf-8')

# ---------- admin.js ----------
p = Path('admin.js')
s = p.read_text(encoding='utf-8')

s = s.replace('''const filterSearch=$('filterSearch'), filterType=$('filterType'), filterVisibility=$('filterVisibility'), filterSort=$('filterSort');\nlet categories=[], queueEntries=[], currentUser=null, allMedia=[];''','''const filterSearch=$('filterSearch'), filterType=$('filterType'), filterVisibility=$('filterVisibility'), filterSort=$('filterSort');\nconst uploadAreaTabs=[...document.querySelectorAll('[data-upload-area]')], standardUploadFields=$('standardUploadFields'), recentUploadNotice=$('recentUploadNotice'), uploadContextHelp=$('uploadContextHelp');\nconst libraryFolders=$('libraryFolders'), categoryFolders=$('categoryFolders');\nlet categories=[], queueEntries=[], currentUser=null, allMedia=[], currentUploadArea='portfolio', currentLibraryArea='all';''')

old_load = '''async function loadCategories(){\n  const {data,error}=await neon.from('site_categories').select('slug,label,area,sort_order').order('sort_order',{ascending:true});\n  if(error)throw error;\n  categories=data||[];\n  uploadCategory.innerHTML=categories.map(c=>`<option value="${esc(c.slug)}">${esc(c.label)}</option>`).join('');\n  filterCategory.innerHTML='<option value="">Todas</option>'+categories.map(c=>`<option value="${esc(c.slug)}">${esc(c.label)}</option>`).join('');\n}\nfunction categoryLabel(slug){return categories.find(c=>c.slug===slug)?.label||slug;}\nfunction categoryRank(slug){const i=categories.findIndex(c=>c.slug===slug);return i<0?9999:i;}'''
new_load = '''async function loadCategories(){\n  const {data,error}=await neon.from('site_categories').select('slug,label,area,sort_order').order('sort_order',{ascending:true});\n  if(error)throw error;\n  categories=data||[];\n  syncUploadCategories();\n  filterCategory.innerHTML='<option value="">Todas as pastas</option>'+categories.map(c=>`<option value="${esc(c.slug)}">${esc(c.label)}</option>`).join('');\n  renderCategoryFolders();\n}\nfunction categoryLabel(slug){return categories.find(c=>c.slug===slug)?.label||slug;}\nfunction categoryArea(slug){return categories.find(c=>c.slug===slug)?.area||'';}\nfunction categoryRank(slug){const i=categories.findIndex(c=>c.slug===slug);return i<0?9999:i;}\nfunction categoriesForArea(area){return categories.filter(c=>c.area===area);}\nfunction syncUploadCategories(){\n  const area=currentUploadArea==='servico'?'servico':'portfolio';\n  const options=categoriesForArea(area);\n  uploadCategory.innerHTML=options.map(c=>`<option value="${esc(c.slug)}">${esc(c.label.replace(/^Portfólio\\s*[—-]\\s*/i,''))}</option>`).join('');\n}\nfunction setUploadArea(area){\n  currentUploadArea=area;\n  uploadAreaTabs.forEach(btn=>{const on=btn.dataset.uploadArea===area;btn.classList.toggle('active',on);btn.setAttribute('aria-selected',String(on));});\n  const recent=area==='recent';\n  if(standardUploadFields)standardUploadFields.hidden=recent;\n  if(recentUploadNotice)recentUploadNotice.hidden=!recent;\n  if(uploadContextHelp)uploadContextHelp.textContent=recent\n    ? 'Trabalhos recentes têm título, data, descrição, ordem e publicação próprios.'\n    : area==='portfolio'\n      ? 'Envie fotos e vídeos diretamente para uma pasta do Portfólio.'\n      : 'Envie fotos e vídeos para a galeria de um serviço. A capa pode ser definida depois na Biblioteca.';\n  if(!recent)syncUploadCategories();\n}\nuploadAreaTabs.forEach(btn=>btn.addEventListener('click',()=>setUploadArea(btn.dataset.uploadArea)));\n$('goRecentAdmin')?.addEventListener('click',()=>document.getElementById('recentAdmin')?.scrollIntoView({behavior:'smooth',block:'start'}));\ndocument.querySelectorAll('[data-jump-area]').forEach(link=>link.addEventListener('click',()=>setUploadArea(link.dataset.jumpArea)));\ndocument.querySelectorAll('[data-hub-area]').forEach(btn=>btn.addEventListener('click',()=>{\n  const area=btn.dataset.hubArea;\n  if(area==='recent')return document.getElementById('recentAdmin')?.scrollIntoView({behavior:'smooth',block:'start'});\n  if(area==='library')return document.getElementById('librarySection')?.scrollIntoView({behavior:'smooth',block:'start'});\n  setUploadArea(area);document.getElementById('uploadSection')?.scrollIntoView({behavior:'smooth',block:'start'});\n}));'''
if old_load not in s:
    raise SystemExit('admin.js loadCategories anchor not found')
s = s.replace(old_load, new_load, 1)

old_filters = '''function applyFilters(){\n  const term=filterSearch.value.trim().toLowerCase();\n  let items=allMedia.filter(m=>{\n    if(filterCategory.value&&m.category!==filterCategory.value)return false;'''
new_filters = '''function applyFilters(){\n  const term=filterSearch.value.trim().toLowerCase();\n  let items=allMedia.filter(m=>{\n    if(currentLibraryArea!=='all'&&categoryArea(m.category)!==currentLibraryArea)return false;\n    if(filterCategory.value&&m.category!==filterCategory.value)return false;'''
if old_filters not in s:
    raise SystemExit('admin.js applyFilters anchor not found')
s = s.replace(old_filters, new_filters, 1)

old_summary = '''function updateSummary(){\n  $('statTotal').textContent=allMedia.length;\n  $('statVisible').textContent=allMedia.filter(m=>m.is_visible).length;\n  $('statHidden').textContent=allMedia.filter(m=>!m.is_visible).length;\n  $('statCovers').textContent=allMedia.filter(m=>m.is_cover).length;\n}'''
new_summary = '''function updateSummary(){\n  $('statTotal').textContent=allMedia.length;\n  $('statVisible').textContent=allMedia.filter(m=>m.is_visible).length;\n  $('statHidden').textContent=allMedia.filter(m=>!m.is_visible).length;\n  $('statCovers').textContent=allMedia.filter(m=>m.is_cover).length;\n  const byArea=area=>allMedia.filter(m=>categoryArea(m.category)===area).length;\n  if($('folderCountAll'))$('folderCountAll').textContent=`${allMedia.length} mídias`;\n  if($('folderCountPortfolio'))$('folderCountPortfolio').textContent=`${byArea('portfolio')} mídias`;\n  if($('folderCountServico'))$('folderCountServico').textContent=`${byArea('servico')} mídias`;\n  renderCategoryFolders();\n}\nfunction setLibraryArea(area){\n  currentLibraryArea=area;\n  filterCategory.value='';\n  libraryFolders?.querySelectorAll('[data-folder-area]').forEach(btn=>btn.classList.toggle('active',btn.dataset.folderArea===area));\n  renderCategoryFolders();\n  applyFilters();\n}\nlibraryFolders?.querySelectorAll('[data-folder-area]').forEach(btn=>btn.addEventListener('click',()=>setLibraryArea(btn.dataset.folderArea)));\nfunction renderCategoryFolders(){\n  if(!categoryFolders||!categories.length)return;\n  const source=currentLibraryArea==='all'?categories:categoriesForArea(currentLibraryArea);\n  if(!source.length){categoryFolders.innerHTML='';return;}\n  categoryFolders.innerHTML=source.map(c=>{\n    const count=allMedia.filter(m=>m.category===c.slug).length;\n    const cover=allMedia.find(m=>m.category===c.slug&&m.is_cover&&!isVideoType(m.mime_type))||allMedia.find(m=>m.category===c.slug&&!isVideoType(m.mime_type));\n    const thumb=cover?`<img src="${esc(cover.public_url)}" alt="" loading="lazy">`:`<span class="category-folder-placeholder">${esc(c.label.charAt(0))}</span>`;\n    return `<button type="button" class="category-folder ${filterCategory.value===c.slug?'active':''}" data-category-folder="${esc(c.slug)}">${thumb}<span><strong>${esc(c.label.replace(/^Portfólio\\s*[—-]\\s*/i,''))}</strong><small>${count} mídia${count===1?'':'s'}</small></span></button>`;\n  }).join('');\n  categoryFolders.querySelectorAll('[data-category-folder]').forEach(btn=>btn.addEventListener('click',()=>{\n    filterCategory.value=btn.dataset.categoryFolder;\n    renderCategoryFolders();\n    applyFilters();\n    imageGrid.scrollIntoView({behavior:'smooth',block:'start'});\n  }));\n}'''
if old_summary not in s:
    raise SystemExit('admin.js updateSummary anchor not found')
s = s.replace(old_summary, new_summary, 1)

# ensure category select refreshes folder active state
s = s.replace("[filterSearch,filterCategory,filterType,filterVisibility,filterSort].forEach(el=>{\n  el.addEventListener(el===filterSearch?'input':'change',applyFilters);\n});", "[filterSearch,filterCategory,filterType,filterVisibility,filterSort].forEach(el=>{\n  el.addEventListener(el===filterSearch?'input':'change',()=>{if(el===filterCategory)renderCategoryFolders();applyFilters();});\n});")

p.write_text(s, encoding='utf-8')

# ---------- recent-works-admin.js ----------
p = Path('recent-works-admin.js')
s = p.read_text(encoding='utf-8')
s = s.replace("categories = data || [];\n  const sel = document.getElementById('recentGallery');\n  if (sel) sel.innerHTML = categories.map(c => `<option value=\"${esc(c.slug)}\">${esc(c.label)}</option>`).join('');", "categories = (data || []).filter(c => c.area === 'portfolio');\n  const sel = document.getElementById('recentGallery');\n  if (sel) sel.innerHTML = categories.map(c => `<option value=\"${esc(c.slug)}\">${esc(c.label.replace(/^Portfólio\\s*[—-]\\s*/i, ''))}</option>`).join('');")
s = s.replace('Cadastre os trabalhos que aparecem na página inicial. A home mostra os 3 primeiros itens ativos, de acordo com a ordem.','Cada trabalho usa uma pasta do Portfólio como galeria. A Home mostra os 3 primeiros itens ativos, de acordo com a ordem.')
p.write_text(s, encoding='utf-8')

# ---------- admin.css ----------
p = Path('admin.css')
s = p.read_text(encoding='utf-8')
append = r'''

/* ---------- PAINEL V2: áreas, upload contextual e biblioteca por pastas ---------- */
.admin-hub{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:18px}
.hub-card{appearance:none;text-align:left;display:grid;grid-template-rows:auto auto 1fr auto;gap:8px;min-height:170px;padding:20px;border:1px solid var(--line);border-radius:14px;background:linear-gradient(145deg,rgba(201,162,75,.045),rgba(255,255,255,.012));color:var(--cream);cursor:pointer;transition:border-color .2s ease,transform .2s ease,background .2s ease}
.hub-card:hover{transform:translateY(-2px);border-color:var(--line-strong);background:rgba(201,162,75,.055)}
.hub-icon{display:grid;place-items:center;width:30px;height:30px;border:1px solid rgba(201,162,75,.24);border-radius:50%;font-size:.66rem;color:var(--gold2)}
.hub-card strong{font-family:'Cormorant Garamond',serif;font-size:1.28rem;font-weight:500}
.hub-card small{color:var(--muted);line-height:1.5}
.hub-link{margin-top:6px;color:var(--gold2);font-size:.76rem}
.upload-area-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:24px 0 6px;padding:7px;border:1px solid rgba(201,162,75,.12);border-radius:13px;background:#11100d}
.upload-area-tab{flex:1;min-width:160px;border:0;border-radius:9px;background:transparent;color:var(--muted);padding:11px 14px;cursor:pointer;transition:.2s}
.upload-area-tab:hover{color:var(--cream);background:rgba(201,162,75,.045)}
.upload-area-tab.active{background:rgba(201,162,75,.13);color:var(--gold2);box-shadow:inset 0 0 0 1px rgba(201,162,75,.2)}
.recent-upload-notice{display:flex;justify-content:space-between;align-items:center;gap:22px;margin-top:16px;padding:20px;border:1px solid rgba(201,162,75,.18);border-radius:14px;background:#11100d}
.recent-upload-notice[hidden],#standardUploadFields[hidden]{display:none!important}
.recent-upload-notice div{display:grid;gap:5px}.recent-upload-notice span{color:var(--muted);font-size:.82rem}
.library-folders{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:12px}
.folder-card{display:flex;align-items:center;gap:12px;padding:14px;text-align:left;border:1px solid rgba(201,162,75,.12);border-radius:12px;background:#11100d;color:var(--cream);cursor:pointer;transition:.2s}
.folder-card:hover,.folder-card.active{border-color:rgba(201,162,75,.35);background:rgba(201,162,75,.055)}
.folder-mark{display:grid;place-items:center;width:38px;height:38px;flex:0 0 auto;border-radius:10px;background:rgba(201,162,75,.08);color:var(--gold2);font-family:'Cormorant Garamond',serif;font-size:1.1rem}
.folder-card>span:last-child{display:grid;gap:2px}.folder-card strong{font-size:.86rem;font-weight:500}.folder-card small{color:var(--muted);font-size:.7rem}
.category-folders{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:0 0 16px}
.category-folder{display:grid;grid-template-columns:52px minmax(0,1fr);align-items:center;gap:10px;padding:8px;text-align:left;border:1px solid rgba(201,162,75,.1);border-radius:11px;background:#0f0e0c;color:var(--cream);cursor:pointer;min-width:0;transition:.2s}
.category-folder:hover,.category-folder.active{border-color:rgba(201,162,75,.32);background:rgba(201,162,75,.045)}
.category-folder img,.category-folder-placeholder{width:52px;height:44px;border-radius:8px;object-fit:cover;background:#17140f;display:grid;place-items:center;color:var(--gold2);font-family:'Cormorant Garamond',serif;font-size:1.2rem}
.category-folder>span:last-child{display:grid;min-width:0;gap:2px}.category-folder strong{font-size:.75rem;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.category-folder small{font-size:.66rem;color:var(--muted)}
@media(max-width:1040px){.admin-hub{grid-template-columns:repeat(2,1fr)}.category-folders{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:720px){.library-folders{grid-template-columns:1fr}.category-folders{grid-template-columns:repeat(2,minmax(0,1fr))}.recent-upload-notice{align-items:flex-start;flex-direction:column}.recent-upload-notice .btn{width:100%}}
@media(max-width:560px){.admin-hub{grid-template-columns:1fr}.category-folders{grid-template-columns:1fr}.hub-card{min-height:145px}.upload-area-tab{min-width:100%}}
'''
if 'PAINEL V2: áreas' not in s:
    s += append
p.write_text(s, encoding='utf-8')
