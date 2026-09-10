from pathlib import Path
import re

p=Path('recent-works-admin.js')
s=p.read_text(encoding='utf-8')

# Keep the selected work category available to the storage uploader.
if 'let mediaWorkCategory = null;' not in s:
    s=s.replace('let mediaWorkId = null;\nlet recentWorkCount = 0;', 'let mediaWorkId = null;\nlet mediaWorkCategory = null;\nlet recentWorkCount = 0;', 1)

# Remove the top refresh button.
s=s.replace('''      <button type="button" class="btn btn-ghost" id="recentRefresh">Atualizar</button>\n''','',1)

# Move the save action out of the form and into a footer at the end of the card.
s=s.replace('''      <div class="recent-form-actions">\n        <button type="submit" class="btn btn-primary" id="recentSave">Adicionar trabalho</button>\n        <button type="button" class="btn btn-ghost" id="recentCancel" hidden>Cancelar edição</button>\n      </div>''','''      <div class="recent-form-actions">\n        <button type="button" class="btn btn-ghost" id="recentCancel" hidden>Cancelar edição</button>\n      </div>''',1)
s=s.replace('''    <div id="recentList" class="recent-list"></div>\n  `;''','''    <div id="recentList" class="recent-list"></div>\n    <div class="recent-card-footer">\n      <button type="submit" form="recentForm" class="btn btn-primary recent-footer-save" id="recentSave">Salvar</button>\n    </div>\n  `;''',1)

# X close button in the upper-right corner of the media card.
s=s.replace('''        <button type="button" class="btn btn-ghost recent-media-close" id="recentMediaClose">Fechar</button>''','''        <button type="button" class="recent-media-close" id="recentMediaClose" aria-label="Fechar" title="Fechar">×</button>''',1)

# Make the save label consistent.
s=s.replace("save.textContent=atLimit?'Limite de 3 trabalhos atingido':(editingId?'Salvar alterações':'Adicionar trabalho');", "save.textContent=atLimit?'Limite de 3 trabalhos atingido':'Salvar';", 1)
s=s.replace("if (save) save.textContent = 'Adicionar trabalho';", "if (save) save.textContent = 'Salvar';", 1)
s=s.replace("document.getElementById('recentSave').textContent = 'Salvar alterações';", "document.getElementById('recentSave').textContent = 'Salvar';", 1)
s=s.replace("save.textContent = editingId ? 'Salvando…' : 'Adicionando…';", "save.textContent = 'Salvando…';", 1)
s=s.replace("if (!editingId) save.textContent = 'Adicionar trabalho';", "if (!editingId) save.textContent = 'Salvar';", 1)

# The old refresh control no longer exists; remove/neutralize its listener.
s=re.sub(r"\s*document\.getElementById\(['\"]recentRefresh['\"]\)\.addEventListener\([^;]+;", '', s, count=1)
s=s.replace("document.getElementById('recentRefresh')?.addEventListener", "document.getElementById('recentRefresh')?.addEventListener")

# Persist physical storage under the actual portfolio category of the selected work.
# The DB row remains classified as recent-work-media.
patterns=[
    r"(storageCall\(\{\s*action\s*:\s*['\"]presign['\"]\s*,\s*category\s*:\s*)RECENT_MEDIA_CATEGORY",
    r"(storageCall\(\{\s*action\s*:\s*['\"]presign['\"]\s*,\s*category\s*:\s*)['\"]recent-work-media['\"]",
]
changed=0
for pat in patterns:
    s,n=re.subn(pat, r"\1(mediaWorkCategory || categories[0]?.slug || 'portfolio-casamentos')", s, count=1, flags=re.S)
    changed+=n
if changed==0:
    # Broader but still scoped: only change category inside a presign object.
    s,n=re.subn(r"(action\s*:\s*['\"]presign['\"][^}]{0,260}?category\s*:\s*)RECENT_MEDIA_CATEGORY", r"\1(mediaWorkCategory || categories[0]?.slug || 'portfolio-casamentos')", s, count=1, flags=re.S)
    changed+=n
if changed==0:
    raise SystemExit('Could not locate recent media presign category; refusing blind change')

# Track the selected work's real category whenever the media manager opens.
if 'mediaWorkCategory = item?.gallery_category || null;' not in s:
    s,n=re.subn(r"((?:async\s+)?function\s+openMediaManager\s*\(item\)\s*\{)", r"\1\n  mediaWorkCategory = item?.gallery_category || null;", s, count=1)
    if n==0:
        raise SystemExit('openMediaManager not found')

# Clear category when manager closes.
if 'mediaWorkCategory = null;' in s:
    # Already declared; inject explicit clear only if absent in close function body.
    close_match=re.search(r"((?:async\s+)?function\s+closeMediaManager\s*\(\)\s*\{)(.*?)(\n\})", s, re.S)
    if close_match and 'mediaWorkCategory = null;' not in close_match.group(2):
        replacement=close_match.group(1)+'\n  mediaWorkCategory = null;'+close_match.group(2)+close_match.group(3)
        s=s[:close_match.start()]+replacement+s[close_match.end():]

# Refine CSS for X and footer.
s=s.replace('.recent-media-manager{margin:22px 0 26px;padding:22px;', '.recent-media-manager{position:relative;margin:22px 0 26px;padding:22px;', 1)
s=s.replace('.recent-media-topbar{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:18px}.recent-step-media{margin:0}.recent-media-close{flex:0 0 auto;padding:8px 12px;font-size:.76rem}',
'''.recent-media-topbar{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:18px;padding-right:34px}.recent-step-media{margin:0}.recent-media-close{position:absolute;top:14px;right:14px;width:32px;height:32px;display:grid;place-items:center;border:1px solid rgba(201,162,75,.18);border-radius:50%;background:transparent;color:#a89d86;font-size:1.35rem;line-height:1;cursor:pointer;transition:.2s}.recent-media-close:hover{color:#f3ecdc;border-color:rgba(230,200,120,.45);background:rgba(201,162,75,.06)}''',1)

insert_css='''.recent-card-footer{display:flex;justify-content:flex-end;gap:10px;margin-top:22px;padding-top:18px;border-top:1px solid rgba(201,162,75,.12)}.recent-footer-save{min-width:150px}.recent-footer-save:disabled{cursor:not-allowed}\n'''
marker='    @media(max-width:980px)'
if insert_css.strip() not in s:
    s=s.replace(marker, '    '+insert_css+marker, 1)

p.write_text(s,encoding='utf-8')
print('patched recent-works-admin.js; presign replacements:', changed)
