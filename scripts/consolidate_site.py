from pathlib import Path
import re

ROOT = Path('.')

def read(path):
    return Path(path).read_text(encoding='utf-8')

def write(path, text):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(text, encoding='utf-8')

def pop_marker_blocks(text, prefixes):
    blocks = []
    while True:
        starts = []
        for prefix in prefixes:
            i = text.find(prefix)
            if i >= 0:
                starts.append(i)
        if not starts:
            break
        start = min(starts)
        end = text.find('\n/* ---------- ', start + 5)
        if end < 0:
            end = len(text)
        block = text[start:end].strip()
        blocks.append(block)
        text = text[:start].rstrip() + '\n\n' + text[end:].lstrip('\n')
    return text, blocks

# ------------------------------------------------------------------
# 1/5. CSS por página: reduz acoplamento do stylesheet global.
# ------------------------------------------------------------------
styles = read('styles.css')
styles, service_blocks = pop_marker_blocks(styles, ['/* ---------- SERVIÇOS ---------- */', '/* ---------- MODAL DE PACOTES ---------- */'])
styles, contact_blocks = pop_marker_blocks(styles, ['/* ---------- CONTATO ---------- */'])
styles, booking_blocks = pop_marker_blocks(styles, ['/* ---------- AGENDAMENTO', '/* ---------- ASSISTENTE DE AGENDAMENTO'])
write('styles.css', styles.rstrip() + '\n')

# Extrai o CSS premium do modal que ainda era injetado por JS.
services_js = read('servicos.js')
m = re.search(r"function injectProposalStyles\(\)\s*\{.*?style\.textContent\s*=\s*`(?P<css>.*?)`;\s*document\.head\.appendChild\(style\);\s*\}", services_js, re.S)
if not m:
    raise SystemExit('Não foi possível localizar injectProposalStyles em servicos.js')
proposal_css = m.group('css').strip()
services_js = services_js[:m.start()] + services_js[m.end():]
services_js = services_js.replace('\ninjectProposalStyles();\n', '\n')

service_css = '/* Estilos exclusivos da página de Serviços. */\n\n' + '\n\n'.join(service_blocks + [proposal_css]) + '\n'
contact_css = '/* Estilos exclusivos da página de Contato. */\n\n' + '\n\n'.join(contact_blocks) + '\n'
booking_css = '/* Estilos exclusivos da página de Agendamento. */\n\n' + '\n\n'.join(booking_blocks) + '\n'
write('servicos.css', service_css)
write('contato.css', contact_css)
write('agendamento.css', booking_css)

for html_path, css_name in [('servicos.html','servicos.css'), ('contato.html','contato.css'), ('agendamento.html','agendamento.css')]:
    html = read(html_path)
    link = f'<link rel="stylesheet" href="{css_name}">'
    if link not in html:
        html = html.replace('<link rel="stylesheet" href="styles.css">', '<link rel="stylesheet" href="styles.css">\n' + link, 1)
    write(html_path, html)

# ------------------------------------------------------------------
# 4. Uma consulta pública de mídia por página, agrupada em memória.
# ------------------------------------------------------------------
script = read('script.js')
old_media = re.search(r"async function midiasDoPainel\(categoria\) \{[^\n]*\}", script)
if not old_media:
    raise SystemExit('midiasDoPainel atual não encontrado em script.js')
new_media = '''let midiasPublicasPromise = null;
async function carregarMidiasPublicas(){
  if(!midiasPublicasPromise){
    midiasPublicasPromise = (async()=>{
      const neon = await neonPublicClient();
      const {data,error} = await neon.from('site_images')
        .select('category,public_url,alt_text,is_cover,sort_order,mime_type')
        .eq('is_visible',true)
        .order('category',{ascending:true})
        .order('sort_order',{ascending:true});
      if(error || !Array.isArray(data)) throw error || new Error('Mídias públicas indisponíveis');
      const grouped = new Map();
      data.forEach(item=>{
        const list = grouped.get(item.category) || [];
        list.push(normalizeMedia(item));
        grouped.set(item.category,list);
      });
      return grouped;
    })().catch(err=>{midiasPublicasPromise=null;throw err;});
  }
  return midiasPublicasPromise;
}
async function midiasDoPainel(categoria){
  try{
    const grouped = await carregarMidiasPublicas();
    return {ok:true,items:[...(grouped.get(categoria)||[])]};
  }catch(_){return {ok:false,items:[]};}
}
function invalidarCacheMidiasPublicas(){midiasPublicasPromise=null;}
window.midiasDoPainel = midiasDoPainel;
window.invalidarCacheMidiasPublicas = invalidarCacheMidiasPublicas;'''
script = script[:old_media.start()] + new_media + script[old_media.end():]

# ------------------------------------------------------------------
# 6. Focus trap do lightbox.
# ------------------------------------------------------------------
trap_helper = '''function prenderFoco(root,e){
  if(e.key!=='Tab'||!root)return false;
  const itens=[...root.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),video[controls],[tabindex]:not([tabindex="-1"])')]
    .filter(el=>!el.hidden&&el.getClientRects().length);
  if(!itens.length){e.preventDefault();root.focus?.();return true;}
  const primeiro=itens[0],ultimo=itens[itens.length-1];
  if(e.shiftKey&&document.activeElement===primeiro){e.preventDefault();ultimo.focus();return true;}
  if(!e.shiftKey&&document.activeElement===ultimo){e.preventDefault();primeiro.focus();return true;}
  if(!root.contains(document.activeElement)){e.preventDefault();(e.shiftKey?ultimo:primeiro).focus();return true;}
  return false;
}
'''
anchor = "let lbMedia = [], lbIndex = 0, lbLabel = '', lbOpener = null, lbVideo = null;\n"
if 'function prenderFoco(root,e)' not in script:
    if anchor not in script: raise SystemExit('Âncora do lightbox não encontrada')
    script = script.replace(anchor, anchor + trap_helper, 1)
script = script.replace("lightbox.hidden = false; document.body.style.overflow = 'hidden';", "lightbox.hidden = false; lightbox.setAttribute('aria-hidden','false'); document.body.style.overflow = 'hidden';")
script = script.replace("lightbox.classList.remove('open'); lightbox.style.display = ''; document.body.style.overflow = '';", "lightbox.classList.remove('open'); lightbox.setAttribute('aria-hidden','true'); lightbox.style.display = ''; document.body.style.overflow = '';")
old_key = "document.addEventListener('keydown', (e) => { if (lightbox.hidden) return; if (e.key === 'Escape') lbHide(); else if (e.key === 'ArrowRight') lbGo(1); else if (e.key === 'ArrowLeft') lbGo(-1); });"
new_key = "document.addEventListener('keydown', (e) => { if (lightbox.hidden) return; if (e.key === 'Tab') prenderFoco(lightbox,e); else if (e.key === 'Escape') lbHide(); else if (e.key === 'ArrowRight') lbGo(1); else if (e.key === 'ArrowLeft') lbGo(-1); });"
if old_key not in script: raise SystemExit('Listener do lightbox não encontrado')
script = script.replace(old_key,new_key,1)
write('script.js',script)

# Focus trap do modal de Serviços + nome acessível.
services_js = services_js.replace('<h3 class="proposal-title">Pacotes em breve</h3>', '<h3 class="proposal-title" id="serviceModalTitle">Pacotes em breve</h3>')
services_js = services_js.replace('<h3 class="proposal-title">${data.title}</h3>', '<h3 class="proposal-title" id="serviceModalTitle">${data.title}</h3>')
services_js = services_js.replace("modalOverlay?.setAttribute('aria-hidden', 'true');", "modalOverlay?.setAttribute('aria-hidden', 'true');\nmodalOverlay?.setAttribute('aria-labelledby', 'serviceModalTitle');", 1)
old_listener = '''document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalOverlay?.classList.contains('open')) closeModal();
});'''
new_listener = '''document.addEventListener("keydown", (e) => {
  if (!modalOverlay?.classList.contains('open')) return;
  if (e.key === "Escape") { closeModal(); return; }
  if (e.key !== "Tab") return;
  const focusables = [...modalBox.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
    .filter(el => !el.hidden && el.getClientRects().length);
  if (!focusables.length) { e.preventDefault(); modalBox.focus(); return; }
  const first = focusables[0], last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  else if (!modalBox.contains(document.activeElement)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
});'''
if old_listener not in services_js: raise SystemExit('Listener do modal de Serviços não encontrado')
services_js = services_js.replace(old_listener,new_listener,1)
write('servicos.js',services_js)

# ------------------------------------------------------------------
# 3. Depoimentos: fila de moderação + proteção básica contra spam.
# ------------------------------------------------------------------
index = read('index.html')
index = index.replace('casamentos, ensaios de casal, gestantes, formaturas, aniversários e retratos', 'casamentos, gestantes, formaturas, aniversários e retratos')
index = index.replace('casamentos, ensaios de casal, gestantes, formaturas, aniversários e retratos.', 'casamentos, gestantes, formaturas, aniversários e retratos.')
write('index.html',index)

deps = read('depoimentos.js')
if 'const TESTIMONIAL_COOLDOWN_KEY' not in deps:
    deps = deps.replace('const DELETE_TOKENS_KEY = "studioaraujo:testimonial-delete-tokens";', 'const DELETE_TOKENS_KEY = "studioaraujo:testimonial-delete-tokens";\nconst TESTIMONIAL_COOLDOWN_KEY = "studioaraujo:testimonial-last-submit";\nconst TESTIMONIAL_MIN_INTERVAL = 2 * 60 * 1000;\nconst testimonialFormOpenedAt = Date.now();', 1)

honeypot_anchor = '  formDepoimento.hidden = true;\n'
if 'depWebsiteTrap' not in deps:
    honeypot = '''  const spamTrap = document.createElement("input");
  spamTrap.type = "text";
  spamTrap.id = "depWebsiteTrap";
  spamTrap.name = "website";
  spamTrap.tabIndex = -1;
  spamTrap.autocomplete = "off";
  spamTrap.setAttribute("aria-hidden", "true");
  spamTrap.style.cssText = "position:absolute;left:-10000px;width:1px;height:1px;opacity:0;pointer-events:none";
  formDepoimento.appendChild(spamTrap);
'''
    if honeypot_anchor not in deps: raise SystemExit('Âncora do formulário de depoimentos não encontrada')
    deps = deps.replace(honeypot_anchor, honeypot_anchor + honeypot, 1)

submit_anchor = '''    const nome = document.getElementById("depNome").value.trim();
    const instagram = document.getElementById("depInstagram").value.trim().replace(/^@/, "");
    const comentario = campoComentario.value.trim();'''
submit_new = '''    const nome = document.getElementById("depNome").value.trim();
    const instagram = document.getElementById("depInstagram").value.trim().replace(/^@/, "");
    const comentario = campoComentario.value.trim();
    const spamTrap = document.getElementById("depWebsiteTrap");
    if (spamTrap?.value) return;
    if (Date.now() - testimonialFormOpenedAt < 2500) return mostrarMsg("Aguarde um instante antes de enviar.", "erro");
    const ultimoEnvio = Number(localStorage.getItem(TESTIMONIAL_COOLDOWN_KEY) || 0);
    if (ultimoEnvio && Date.now() - ultimoEnvio < TESTIMONIAL_MIN_INTERVAL) return mostrarMsg("Seu depoimento anterior já foi recebido. Aguarde alguns minutos para enviar outro.", "erro");'''
if submit_anchor not in deps: raise SystemExit('Validação de depoimentos não encontrada')
deps = deps.replace(submit_anchor,submit_new,1)

old_insert = '''      const { data, error } = await neon.from("site_testimonials").insert({
        name: nome,
        instagram,
        comment: comentario,
        avatar_url: avatarData,
        is_visible: true,
        delete_token: deleteToken
      }).select("id").single();
      if (error || !data?.id) throw error || new Error("ID não retornado");'''
new_insert = '''      const row = { name:nome, instagram, comment:comentario, avatar_url:avatarData, is_visible:false, delete_token:deleteToken };
      let result = await neon.from("site_testimonials").insert(row).select("id").single();
      // Compatibilidade temporária até a política de moderação ser aplicada no Neon.
      if (result?.error && /policy|row-level security/i.test(String(result.error.message || result.error))) {
        result = await neon.from("site_testimonials").insert({...row,is_visible:true}).select("id").single();
      }
      const { data, error } = result || {};
      if (error || !data?.id) throw error || new Error("ID não retornado");'''
if old_insert not in deps: raise SystemExit('Insert público de depoimentos não encontrado')
deps = deps.replace(old_insert,new_insert,1)
deps = deps.replace('mostrarMsg("Obrigado pelo carinho! Seu depoimento já está no ar. ✨", "sucesso");', 'localStorage.setItem(TESTIMONIAL_COOLDOWN_KEY, String(Date.now()));\n      mostrarMsg("Recebemos seu depoimento. Obrigado pelo carinho! Ele pode passar por uma rápida revisão antes de aparecer no site.", "sucesso");', 1)
write('depoimentos.js',deps)

admin_html = read('admin.html')
hub_anchor = '      </section>\n\n      <section id="mediaOverview"'
if 'id="openTestimonialsBtn"' not in admin_html:
    card = '''        <button type="button" class="hub-card" id="openTestimonialsBtn">
          <span class="hub-icon" aria-hidden="true">05</span>
          <strong>Depoimentos</strong>
          <small>Revise, publique ou oculte depoimentos enviados pelo site.</small>
          <span class="hub-link">Gerenciar depoimentos →</span>
        </button>
'''
    pos = admin_html.find(hub_anchor)
    if pos < 0: raise SystemExit('Fim do admin-hub não encontrado')
    admin_html = admin_html[:pos] + card + admin_html[pos:]

if 'id="testimonialsAdmin"' not in admin_html:
    section = '''      <section id="testimonialsAdmin" class="testimonials-admin admin-section" hidden>
        <div class="section-heading">
          <div>
            <p class="eyebrow">Moderação</p>
            <h2>Depoimentos</h2>
            <p class="section-copy">Novos depoimentos ficam pendentes até serem aprovados.</p>
          </div>
          <div class="library-head-actions">
            <button type="button" id="refreshTestimonialsBtn" class="btn btn-ghost">Atualizar</button>
            <button type="button" id="closeTestimonialsBtn" class="btn btn-ghost">Fechar</button>
          </div>
        </div>
        <p id="testimonialAdminMsg" class="msg" role="status" aria-live="polite"></p>
        <div id="testimonialAdminGrid" class="testimonial-admin-grid"></div>
      </section>

'''
    admin_html = admin_html.replace('      <section id="mediaOverview"', section + '      <section id="mediaOverview"', 1)
write('admin.html',admin_html)

admin_js = read('admin.js')
refs_anchor = "const mediaOverview=$('mediaOverview'), mediaOverviewTitle=$('mediaOverviewTitle'), mediaOverviewCopy=$('mediaOverviewCopy'), mediaOverviewCount=$('mediaOverviewCount'), mediaOverviewGrid=$('mediaOverviewGrid');\n"
if 'testimonialAdminGrid' not in admin_js:
    refs = "const testimonialsAdmin=$('testimonialsAdmin'), testimonialAdminGrid=$('testimonialAdminGrid'), testimonialAdminMsg=$('testimonialAdminMsg'), openTestimonialsBtn=$('openTestimonialsBtn'), closeTestimonialsBtn=$('closeTestimonialsBtn'), refreshTestimonialsBtn=$('refreshTestimonialsBtn');\n"
    if refs_anchor not in admin_js: raise SystemExit('Âncora de refs do admin não encontrada')
    admin_js = admin_js.replace(refs_anchor,refs_anchor+refs,1)

if 'async function loadTestimonialsAdmin' not in admin_js:
    insert_after = "document.querySelectorAll('[data-overview-area]').forEach(btn=>btn.addEventListener('click',()=>{\n  currentOverviewArea=btn.dataset.overviewArea;\n  renderOverview();\n  mediaOverview?.scrollIntoView({behavior:'smooth',block:'nearest'});\n}));\n"
    moderation = r'''

function testimonialDate(value){
  try{return new Intl.DateTimeFormat('pt-BR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}catch(_){return '';}
}
async function loadTestimonialsAdmin({silent=false}={}){
  if(!testimonialAdminGrid)return;
  if(!silent)testimonialAdminGrid.innerHTML='<div class="overview-empty">Carregando depoimentos…</div>';
  const {data,error}=await neon.from('site_testimonials').select('id,name,instagram,comment,avatar_url,is_visible,created_at').order('created_at',{ascending:false});
  if(error){console.error(error);if(!silent)setMsg(testimonialAdminMsg,'Não foi possível carregar os depoimentos.','error');return;}
  const items=Array.isArray(data)?data:[];
  openTestimonialsBtn?.classList.toggle('has-pending',items.some(x=>!x.is_visible));
  openTestimonialsBtn?.setAttribute('data-pending',String(items.filter(x=>!x.is_visible).length));
  if(!items.length){testimonialAdminGrid.innerHTML='<div class="overview-empty">Nenhum depoimento recebido ainda.</div>';return;}
  testimonialAdminGrid.innerHTML=items.map(item=>{
    const avatar=item.avatar_url?`<img src="${esc(item.avatar_url)}" alt="">`:`<span>${esc(String(item.name||'?').trim().charAt(0).toUpperCase())}</span>`;
    const status=item.is_visible?'Publicado':'Pendente';
    return `<article class="testimonial-admin-card ${item.is_visible?'is-visible':'is-pending'}" data-testimonial-id="${esc(item.id)}">
      <div class="testimonial-admin-head"><div class="testimonial-admin-avatar">${avatar}</div><div><strong>${esc(item.name)}</strong><small>${item.instagram?'@'+esc(String(item.instagram).replace(/^@/,'')):testimonialDate(item.created_at)}</small></div><span class="testimonial-admin-status">${status}</span></div>
      <p>${esc(item.comment)}</p>
      <div class="testimonial-admin-actions">
        <button type="button" class="btn btn-small testimonial-toggle">${item.is_visible?'Ocultar':'Aprovar'}</button>
        <button type="button" class="btn btn-ghost btn-small testimonial-delete">Excluir</button>
      </div>
    </article>`;
  }).join('');
  testimonialAdminGrid.querySelectorAll('.testimonial-toggle').forEach(btn=>btn.addEventListener('click',async()=>{
    const card=btn.closest('[data-testimonial-id]');const id=card.dataset.testimonialId;const visible=card.classList.contains('is-visible');
    btn.disabled=true;
    const {error}=await neon.from('site_testimonials').update({is_visible:!visible}).eq('id',id);
    if(error){setMsg(testimonialAdminMsg,'Não foi possível atualizar o depoimento.','error');btn.disabled=false;return;}
    setMsg(testimonialAdminMsg,!visible?'Depoimento publicado.':'Depoimento ocultado.','success');
    await loadTestimonialsAdmin({silent:true});
  }));
  testimonialAdminGrid.querySelectorAll('.testimonial-delete').forEach(btn=>btn.addEventListener('click',async()=>{
    const card=btn.closest('[data-testimonial-id]');const id=card.dataset.testimonialId;
    if(!confirm('Excluir este depoimento? Esta ação não pode ser desfeita.'))return;
    btn.disabled=true;
    const {error}=await neon.from('site_testimonials').delete().eq('id',id);
    if(error){setMsg(testimonialAdminMsg,'Não foi possível excluir o depoimento.','error');btn.disabled=false;return;}
    setMsg(testimonialAdminMsg,'Depoimento excluído.','success');
    await loadTestimonialsAdmin({silent:true});
  }));
}
function openTestimonialsAdmin(){
  if(!testimonialsAdmin)return;
  testimonialsAdmin.hidden=false;
  loadTestimonialsAdmin();
  testimonialsAdmin.scrollIntoView({behavior:'smooth',block:'start'});
}
function closeTestimonialsAdmin(){
  if(!testimonialsAdmin)return;
  testimonialsAdmin.hidden=true;
  document.querySelector('.admin-hub')?.scrollIntoView({behavior:'smooth',block:'start'});
}
openTestimonialsBtn?.addEventListener('click',openTestimonialsAdmin);
closeTestimonialsBtn?.addEventListener('click',closeTestimonialsAdmin);
refreshTestimonialsBtn?.addEventListener('click',()=>loadTestimonialsAdmin());
'''
    if insert_after not in admin_js: raise SystemExit('Âncora do hub admin não encontrada')
    admin_js = admin_js.replace(insert_after,insert_after+moderation,1)

showpanel_old = '''    await loadCategories();
    await loadMedia();'''
showpanel_new = '''    await loadCategories();
    await loadMedia();
    await loadTestimonialsAdmin({silent:true});'''
if showpanel_old not in admin_js: raise SystemExit('showPanel não encontrado')
admin_js = admin_js.replace(showpanel_old,showpanel_new,1)
write('admin.js',admin_js)

admin_css = read('admin.css')
if '/* TESTIMONIAL MODERATION */' not in admin_css:
    admin_css += r'''

/* TESTIMONIAL MODERATION */
.testimonials-admin{margin-top:28px;padding:28px;border:1px solid rgba(201,162,75,.16);border-radius:18px;background:linear-gradient(180deg,rgba(255,255,255,.018),rgba(201,162,75,.018))}
.testimonial-admin-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:20px}
.testimonial-admin-card{padding:18px;border:1px solid rgba(201,162,75,.14);border-radius:14px;background:rgba(255,255,255,.015)}
.testimonial-admin-card.is-pending{border-color:rgba(230,200,120,.34);background:rgba(201,162,75,.035)}
.testimonial-admin-head{display:grid;grid-template-columns:42px minmax(0,1fr) auto;gap:12px;align-items:center}
.testimonial-admin-avatar{width:42px;height:42px;display:grid;place-items:center;overflow:hidden;border-radius:50%;border:1px solid rgba(201,162,75,.25);color:var(--gold-light);font-family:'Cormorant Garamond',serif;font-size:1.1rem}
.testimonial-admin-avatar img{width:100%;height:100%;object-fit:cover}
.testimonial-admin-head strong{display:block;color:var(--cream);font-weight:500}.testimonial-admin-head small{display:block;color:var(--muted);font-size:.72rem}
.testimonial-admin-status{padding:5px 8px;border:1px solid rgba(201,162,75,.2);border-radius:999px;color:var(--gold-light);font-size:.62rem;letter-spacing:.08em;text-transform:uppercase}
.testimonial-admin-card>p{margin:16px 0;color:#bdb19c;font-size:.86rem;line-height:1.6}
.testimonial-admin-actions{display:flex;gap:8px;flex-wrap:wrap}.testimonial-admin-actions .btn{min-height:38px}
#openTestimonialsBtn.has-pending{border-color:rgba(230,200,120,.42)}
#openTestimonialsBtn.has-pending::after{content:attr(data-pending);position:absolute;top:12px;right:12px;min-width:22px;height:22px;padding:0 6px;display:grid;place-items:center;border-radius:999px;background:var(--gold);color:#111;font-size:.68rem;font-weight:600}
@media(max-width:760px){.testimonial-admin-grid{grid-template-columns:1fr}.testimonials-admin{padding:20px}.testimonial-admin-head{grid-template-columns:38px minmax(0,1fr);}.testimonial-admin-status{grid-column:2;width:max-content}.testimonial-admin-avatar{width:38px;height:38px}}
'''
write('admin.css',admin_css)

# ------------------------------------------------------------------
# 1. Validador permanente + CI.
# ------------------------------------------------------------------
validator = r'''from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse
import re, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
PUBLIC_PAGES=['index.html','sobre.html','servicos.html','contato.html','agendamento.html','privacidade.html']
FORBIDDEN=['painel/index.html','_redirects','.github/workflows/fix-cta-hq.yml','.github/workflows/fix-cta-hq-v2.yml','.github/workflows/fix-cta-hq-v3.yml']
errors=[]

for rel in FORBIDDEN:
    if (ROOT/rel).exists(): errors.append(f'arquivo legado presente: {rel}')

class RefParser(HTMLParser):
    def __init__(self): super().__init__(); self.refs=[]
    def handle_starttag(self,tag,attrs):
        for k,v in attrs:
            if k in ('src','href') and v: self.refs.append(v)

def check_ref(page,ref):
    if ref.startswith(('#','http://','https://','mailto:','tel:','data:','javascript:')): return
    clean=ref.split('#',1)[0].split('?',1)[0]
    if not clean or clean in ('/','/painel'): return
    target=(ROOT/clean.lstrip('/')) if clean.startswith('/') else (ROOT/page).parent/clean
    if not target.exists(): errors.append(f'{page}: referência local inexistente: {ref}')

for page in PUBLIC_PAGES+['admin.html']:
    p=ROOT/page
    if not p.exists(): errors.append(f'página ausente: {page}'); continue
    text=p.read_text(encoding='utf-8')
    if '<meta name="viewport"' not in text: errors.append(f'{page}: viewport ausente')
    parser=RefParser(); parser.feed(text)
    for ref in parser.refs: check_ref(page,ref)

required_css={'servicos.html':'servicos.css','contato.html':'contato.css','agendamento.html':'agendamento.css'}
for page,css in required_css.items():
    if css not in (ROOT/page).read_text(encoding='utf-8'): errors.append(f'{page}: {css} não carregado')

index=(ROOT/'index.html').read_text(encoding='utf-8')
if 'recent-works.js' not in index: errors.append('Home: recent-works.js não está carregado diretamente')
if 'ensaios de casal' in index.lower(): errors.append('Home: referência SEO legada a ensaio de casal')

services=(ROOT/'servicos.html').read_text(encoding='utf-8')
data=(ROOT/'dados-servicos.js').read_text(encoding='utf-8')
service_keys=set(re.findall(r'data-service="([^"]+)"',services))
package_match=re.search(r'const servicePackages\s*=\s*\{(.*?)\n\};',data,re.S)
if package_match:
    package_keys=set(re.findall(r'^\s*["\']?([a-z0-9-]+)["\']?\s*:',package_match.group(1),re.M))
    missing=sorted(service_keys-package_keys)
    if missing: errors.append('Serviços sem pacote em dados-servicos.js: '+', '.join(missing))

for js in ['script.js','servicos.js','dados-servicos.js','agenda.js','depoimentos.js','recent-works.js','admin.js','recent-works-admin.js']:
    r=subprocess.run(['node','--check',str(ROOT/js)],capture_output=True,text=True)
    if r.returncode: errors.append(f'{js}: falha de sintaxe: {r.stderr.strip()}')

if errors:
    print('\n'.join('ERRO: '+e for e in errors)); sys.exit(1)
print('Validação estrutural concluída com sucesso.')
'''
write('scripts/validate_site.py',validator)

workflow = '''name: Validate site\n\non:\n  push:\n    branches: [main]\n  pull_request:\n    branches: [main]\n\npermissions:\n  contents: read\n\njobs:\n  validate:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: '22'\n      - uses: actions/setup-python@v5\n        with:\n          python-version: '3.12'\n      - name: Validate JavaScript, HTML references and site invariants\n        run: python scripts/validate_site.py\n'''
write('.github/workflows/validate-site.yml',workflow)

# ------------------------------------------------------------------
# 2 + limpeza técnica.
# ------------------------------------------------------------------
for rel in ['painel/index.html','_redirects','.github/workflows/fix-cta-hq.yml','.github/workflows/fix-cta-hq-v2.yml','.github/workflows/fix-cta-hq-v3.yml']:
    p=Path(rel)
    if p.exists(): p.unlink()

# Remove os artefatos desta própria execução; permanecem apenas CI/validator permanentes.
for rel in ['scripts/consolidate_site.py','.github/workflows/consolidate-site.yml','.consolidate-site-run']:
    p=Path(rel)
    if p.exists(): p.unlink()

print('Consolidação concluída.')
