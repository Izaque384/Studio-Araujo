from pathlib import Path

# admin.html
p=Path('admin.html')
s=p.read_text(encoding='utf-8')
s=s.replace('''        <a href="#uploadSection" data-jump-area="servico">Galerias de serviços</a>\n        <a href="#librarySection">Biblioteca</a>''','''        <a href="#uploadSection" data-jump-area="servico">Galerias de serviços</a>''',1)
s=s.replace('''      <section id="librarySection" class="library admin-section">''','''      <section id="librarySection" class="library admin-section" hidden>''',1)
s=s.replace('''          <button type="button" id="refreshBtn" class="btn btn-ghost">Atualizar biblioteca</button>''','''          <div class="library-head-actions">\n            <button type="button" id="refreshBtn" class="btn btn-ghost">Atualizar biblioteca</button>\n            <button type="button" id="closeLibraryBtn" class="btn btn-ghost">Fechar biblioteca</button>\n          </div>''',1)
p.write_text(s,encoding='utf-8')

# admin.js
p=Path('admin.js')
s=p.read_text(encoding='utf-8')
s=s.replace("const libraryFolders=$('libraryFolders'), categoryFolders=$('categoryFolders');","const libraryFolders=$('libraryFolders'), categoryFolders=$('categoryFolders'), librarySection=$('librarySection'), closeLibraryBtn=$('closeLibraryBtn');",1)
old="""document.querySelectorAll('[data-hub-area]').forEach(btn=>btn.addEventListener('click',()=>{\n  const area=btn.dataset.hubArea;\n  if(area==='recent')return document.getElementById('recentAdmin')?.scrollIntoView({behavior:'smooth',block:'start'});\n  if(area==='library')return document.getElementById('librarySection')?.scrollIntoView({behavior:'smooth',block:'start'});\n  setUploadArea(area);document.getElementById('uploadSection')?.scrollIntoView({behavior:'smooth',block:'start'});\n}));"""
new="""function openLibrary(){\n  if(!librarySection)return;\n  librarySection.hidden=false;\n  librarySection.scrollIntoView({behavior:'smooth',block:'start'});\n}\nfunction closeLibrary(){\n  if(!librarySection)return;\n  librarySection.hidden=true;\n  document.querySelector('.admin-hub')?.scrollIntoView({behavior:'smooth',block:'start'});\n}\ncloseLibraryBtn?.addEventListener('click',closeLibrary);\ndocument.querySelectorAll('[data-hub-area]').forEach(btn=>btn.addEventListener('click',()=>{\n  const area=btn.dataset.hubArea;\n  if(area==='recent')return document.getElementById('recentAdmin')?.scrollIntoView({behavior:'smooth',block:'start'});\n  if(area==='library')return openLibrary();\n  setUploadArea(area);document.getElementById('uploadSection')?.scrollIntoView({behavior:'smooth',block:'start'});\n}));"""
if old not in s: raise SystemExit('hub block not found')
s=s.replace(old,new,1)
s=s.replace("    $('librarySection')?.scrollIntoView({behavior:'smooth',block:'start'});","    setMsg(libraryMsg,`${done} arquivo${done===1?'':'s'} enviado${done===1?'':'s'} com sucesso. Abra a Biblioteca pelo card 04 quando quiser organizar as mídias.`,'success');",1)
p.write_text(s,encoding='utf-8')

# admin.css
p=Path('admin.css')
s=p.read_text(encoding='utf-8')
s += '''\n\n/* Biblioteca sob demanda: acessível somente pelo card 04. */\n.library[hidden]{display:none!important}\n.library-head-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}\n@media(max-width:820px){.library-head-actions{width:100%;justify-content:flex-start}}\n'''
p.write_text(s,encoding='utf-8')
