from pathlib import Path
p=Path('scripts/admin_workspace_v3_temp.py')
s=p.read_text(encoding='utf-8')

# Latest main already moved the Mídias metric to the header and removed the old summary cards.
start=s.index("old='''        <div class=\"header-actions\">")
end=s.index("s=s.replace(old,new,1)",start)+len("s=s.replace(old,new,1)")
s=s[:start]+"# Cabeçalho já está no formato novo na main atual.\n"+s[end:]

start=s.index("start=s.find('      <section id=\"panelHome\"")
end=s.index("s=s[:start]+s[end+len('      </section>\\n'):]",start)+len("s=s[:start]+s[end+len('      </section>\\n'):]")
s=s[:start]+"# O resumo antigo já foi removido na main atual.\n"+s[end:]

s=s.replace("s=s.replace('<section id=\"uploadSection\" class=\"upload-card admin-section\">','<section id=\"mediaEditorSection\" class=\"workspace-editor admin-section\" hidden></section>\\n\\n      <section id=\"uploadSection\" class=\"upload-card admin-section\" hidden>')", "s=s.replace('<section id=\"uploadSection\" class=\"upload-card admin-section\" hidden>','<section id=\"mediaEditorSection\" class=\"workspace-editor admin-section\" hidden></section>\\n\\n      <section id=\"uploadSection\" class=\"upload-card admin-section\" hidden>',1)")

old_script_block="""old_inline='''  <script>\\n    document.querySelectorAll('[data-overview-area]').forEach(button => {\\n      button.addEventListener('click', () => {\\n        const overview = document.getElementById('mediaOverview');\\n        if (overview) overview.hidden = false;\\n      });\\n    });\\n    document.getElementById('openTestimonialsBtn')?.addEventListener('click', () => {\\n      const overview = document.getElementById('mediaOverview');\\n      if (overview) overview.hidden = true;\\n    });\\n  </script>\\n  <script type=\"module\" src=\"admin.js?v=20260911-editor-v2\"></script>'''\nnew_inline='''  <script type=\"module\" src=\"admin.js?v=20260915-workspace-v3\"></script>\\n  <script type=\"module\" src=\"admin-workspace.js?v=20260915-workspace-v3\"></script>'''\nif old_inline not in s: raise SystemExit('scripts finais antigos não encontrados')\ns=s.replace(old_inline,new_inline,1)"""
new_script_block="""current_script='  <script type=\"module\" src=\"admin.js?v=20260915-context-manager\"></script>'\nnew_scripts='  <script type=\"module\" src=\"admin.js?v=20260915-workspace-v3\"></script>\\n  <script type=\"module\" src=\"admin-workspace.js?v=20260915-workspace-v3\"></script>'\nif current_script not in s: raise SystemExit('script atual do painel não encontrado')\ns=s.replace(current_script,new_scripts,1)"""
if old_script_block not in s: raise SystemExit('bloco de scripts antigo do migrador não encontrado')
s=s.replace(old_script_block,new_script_block,1)

# Patch updateSummary in the generated migration so removed metrics are never dereferenced.
needle="""if old not in s: raise SystemExit('fim de loadMedia não encontrado')\ns=s.replace(old,new,1)\np.write_text(s,encoding='utf-8')"""
replacement="""if old not in s: raise SystemExit('fim de loadMedia não encontrado')\ns=s.replace(old,new,1)\nold_summary=\"\"\"function updateSummary(){\\n  $('statTotal').textContent=allMedia.length;\\n  $('statVisible').textContent=allMedia.filter(m=>m.is_visible).length;\\n  $('statHidden').textContent=allMedia.filter(m=>!m.is_visible).length;\\n  $('statCovers').textContent=allMedia.filter(m=>m.is_cover).length;\"\"\"\nnew_summary=\"\"\"function updateSummary(){\\n  if($('statTotal'))$('statTotal').textContent=allMedia.length;\\n  if($('headerMediaStatValue'))$('headerMediaStatValue').textContent=allMedia.length;\"\"\"\nif old_summary not in s: raise SystemExit('updateSummary atual não encontrado')\ns=s.replace(old_summary,new_summary,1)\np.write_text(s,encoding='utf-8')"""
if needle not in s: raise SystemExit('ponto de patch do admin.js não encontrado')
s=s.replace(needle,replacement,1)

p.write_text(s,encoding='utf-8')
print('Migrador adaptado ao painel atual.')
