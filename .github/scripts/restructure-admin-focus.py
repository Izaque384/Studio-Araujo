from pathlib import Path

# ---------- admin.html ----------
p=Path('admin.html')
s=p.read_text(encoding='utf-8')

# Remove top navigation completely.
start=s.find('      <nav class="admin-nav"')
if start!=-1:
    end=s.find('      </nav>', start)
    if end==-1: raise SystemExit('admin nav closing tag not found')
    s=s[:start]+s[end+len('      </nav>\n'):]

# Move metrics before header and make them complementary.
metrics='''      <section id="panelHome" class="media-summary" aria-label="Resumo da biblioteca">\n        <article><span id="statTotal">—</span><small>Total</small></article>\n        <article><span id="statVisible">—</span><small>Publicadas</small></article>\n        <article><span id="statHidden">—</span><small>Ocultas</small></article>\n        <article><span id="statCovers">—</span><small>Capas</small></article>\n      </section>\n\n'''
if metrics not in s: raise SystemExit('metrics block not found')
s=s.replace(metrics,'',1)
marker='''    <section id="panelView" class="panel" hidden>\n'''
metrics_new='''    <section id="panelView" class="panel" hidden>\n      <section id="panelHome" class="media-summary media-summary-compact" aria-label="Resumo da biblioteca">\n        <article><small>Total</small><span id="statTotal">—</span></article>\n        <article><small>Publicadas</small><span id="statVisible">—</span></article>\n        <article><small>Ocultas</small><span id="statHidden">—</span></article>\n        <article><small>Capas</small><span id="statCovers">—</span></article>\n      </section>\n'''
if marker not in s: raise SystemExit('panel marker not found')
s=s.replace(marker,metrics_new,1)

# Turn overview cards into display-only articles. Library is opened from Update site instead.
s=s.replace('<button type="button" class="hub-card" data-hub-area="portfolio">','<article class="hub-card hub-card-static">',1)
s=s.replace('<button type="button" class="hub-card" data-hub-area="recent">','<article class="hub-card hub-card-static">',1)
s=s.replace('<button type="button" class="hub-card" data-hub-area="servico">','<article class="hub-card hub-card-static">',1)
s=s.replace('<button type="button" class="hub-card" data-hub-area="library">','<article class="hub-card hub-card-static">',1)
s=s.replace('<span class="hub-link">Gerenciar →</span>\n        </button>','<span class="hub-link hub-status">Visão geral</span>\n        </article>',3)
s=s.replace('<span class="hub-link">Abrir biblioteca →</span>\n        </button>','<span class="hub-link hub-status">Visão geral</span>\n        </article>',1)

# Add a small library action to the Update site card instead of the overview card.
old='''          <span class="upload-note">Fotos até 25 MB · Vídeos até 100 MB</span>'''
new='''          <div class="upload-head-actions">\n            <span class="upload-note">Fotos até 25 MB · Vídeos até 100 MB</span>\n            <button type="button" id="openLibraryBtn" class="btn btn-ghost btn-small">Abrir biblioteca</button>\n          </div>'''
if old not in s: raise SystemExit('upload note not found')
s=s.replace(old,new,1)

# Replace recent notice with a mount point. recent-works-admin.js will build inside it.
old_notice='''        <div id="recentUploadNotice" class="recent-upload-notice" hidden>\n          <div>\n            <strong>Trabalhos recentes são gerenciados como trabalhos completos.</strong>\n            <span>Abra a seção de trabalhos recentes para escolher a galeria, título, data, descrição e publicação.</span>\n          </div>\n          <button type="button" class="btn btn-primary" id="goRecentAdmin">Gerenciar trabalhos recentes</button>\n        </div>'''
new_notice='''        <div id="recentUploadNotice" class="recent-upload-notice recent-work-mount" hidden>\n          <div id="recentAdminMount"></div>\n        </div>'''
if old_notice not in s: raise SystemExit('recent notice not found')
s=s.replace(old_notice,new_notice,1)

p.write_text(s,encoding='utf-8')

# ---------- admin.js ----------
p=Path('admin.js')
s=p.read_text(encoding='utf-8')
s=s.replace("const libraryFolders=$('libraryFolders'), categoryFolders=$('categoryFolders'), librarySection=$('librarySection'), closeLibraryBtn=$('closeLibraryBtn');","const libraryFolders=$('libraryFolders'), categoryFolders=$('categoryFolders'), librarySection=$('librarySection'), closeLibraryBtn=$('closeLibraryBtn'), openLibraryBtn=$('openLibraryBtn');",1)

# Remove obsolete recent jump and all hub-card interactions.
s=s.replace("$('goRecentAdmin')?.addEventListener('click',()=>document.getElementById('recentAdmin')?.scrollIntoView({behavior:'smooth',block:'start'}));\n",'',1)
s=s.replace("document.querySelectorAll('[data-jump-area]').forEach(link=>link.addEventListener('click',()=>setUploadArea(link.dataset.jumpArea)));\n",'',1)
old="""closeLibraryBtn?.addEventListener('click',closeLibrary);\ndocument.querySelectorAll('[data-hub-area]').forEach(btn=>btn.addEventListener('click',()=>{\n  const area=btn.dataset.hubArea;\n  if(area==='recent')return document.getElementById('recentAdmin')?.scrollIntoView({behavior:'smooth',block:'start'});\n  if(area==='library')return openLibrary();\n  setUploadArea(area);document.getElementById('uploadSection')?.scrollIntoView({behavior:'smooth',block:'start'});\n}));"""
new="""closeLibraryBtn?.addEventListener('click',closeLibrary);\nopenLibraryBtn?.addEventListener('click',openLibrary);"""
if old not in s: raise SystemExit('hub interaction block not found')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')

# ---------- recent-works-admin.js ----------
p=Path('recent-works-admin.js')
s=p.read_text(encoding='utf-8')

# Make section visually embedded rather than a standalone panel block.
s=s.replace("    .recent-admin{margin-top:36px;padding:28px;border:1px solid rgba(201,162,75,.18);border-radius:20px;background:rgba(201,162,75,.035)}","    .recent-admin{margin-top:0;padding:20px 0 4px;border:0;border-radius:0;background:transparent}",1)
s=s.replace("    .recent-admin-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:22px}","    .recent-admin-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:18px;padding-top:4px}",1)

# Mount inside the Trabalhos recentes tab instead of injecting before the library.
old="""function buildSection(panel) {\n  if (document.getElementById('recentAdmin')) return;\n  const section = document.createElement('section');"""
new="""function buildSection(panel) {\n  if (document.getElementById('recentAdmin')) return;\n  const mount = document.getElementById('recentAdminMount');\n  if (!mount) return;\n  const section = document.createElement('section');"""
if old not in s: raise SystemExit('buildSection start not found')
s=s.replace(old,new,1)
old_tail="""  const library = panel.querySelector('.library');\n  if (library) panel.insertBefore(section, library);\n  else panel.appendChild(section);\n}"""
new_tail="""  mount.appendChild(section);\n}"""
if old_tail not in s: raise SystemExit('buildSection tail not found')
s=s.replace(old_tail,new_tail,1)

p.write_text(s,encoding='utf-8')

# ---------- admin.css ----------
p=Path('admin.css')
s=p.read_text(encoding='utf-8')
s += '''\n\n/* Painel focado: métricas complementares, cards de visão geral e edição centralizada. */\n.admin-nav{display:none!important}\n.media-summary-compact{margin:0 0 14px;display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap}\n.media-summary-compact article{min-width:92px;padding:7px 10px;border-color:rgba(201,162,75,.10);border-radius:10px;background:rgba(255,255,255,.012);display:flex;align-items:center;justify-content:space-between;gap:9px}\n.media-summary-compact span{font-family:Jost,sans-serif;font-size:.92rem;font-weight:500;color:var(--cream)}\n.media-summary-compact small{font-size:.62rem;letter-spacing:.06em;color:#756d5d;text-transform:uppercase}\n.hub-card-static{cursor:default;pointer-events:none}\n.hub-card-static:hover{transform:none;border-color:var(--line);background:linear-gradient(145deg,rgba(201,162,75,.045),rgba(255,255,255,.012))}\n.hub-status{color:#756d5d}\n.upload-head-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}\n.btn-small{padding:8px 11px;font-size:.76rem}\n.recent-work-mount{display:block;padding:0!important;border:0!important;background:transparent!important}\n.recent-work-mount[hidden]{display:none!important}\n#recentAdmin.recent-admin{scroll-margin-top:24px!important;background:transparent!important;border:0!important}\n@media(max-width:820px){.media-summary-compact{justify-content:flex-start}.upload-head-actions{justify-content:flex-start}.media-summary-compact article{min-width:calc(50% - 4px)}}\n'''
p.write_text(s,encoding='utf-8')
