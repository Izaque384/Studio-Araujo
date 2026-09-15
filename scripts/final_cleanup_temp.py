from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

# 1) Public testimonials: Neon is the canonical source. Keep the old Google feed only
# as a temporary read-only compatibility source until its contents can be inventoried.
p = ROOT / 'depoimentos.js'
s = p.read_text(encoding='utf-8')
s = re.sub(
    r'const DEPOIMENTOS_FIXOS = \[.*?\n\];\n\n',
    '',
    s,
    count=1,
    flags=re.S,
)
old_submit = '''      const row = { name:nome, instagram, comment:comentario, avatar_url:avatarData, delete_token:deleteToken };\n      let data=null,error=null;\n      const rpc = await neon.rpc("submit_testimonial", {\n        p_name:nome,\n        p_instagram:instagram,\n        p_comment:comentario,\n        p_avatar_url:avatarData,\n        p_delete_token:deleteToken\n      });\n      if (!rpc?.error && rpc?.data) {\n        data = {id:rpc.data};\n      } else {\n        // Compatibilidade somente enquanto a migração de moderação ainda não foi aplicada.\n        const legacy = await neon.from("site_testimonials").insert({...row,is_visible:true}).select("id").single();\n        data = legacy?.data || null;\n        error = legacy?.error || rpc?.error || null;\n      }\n      if (error || !data?.id) throw error || new Error("Depoimento não aceito");\n\n      salvarTokenExclusao(data.id, deleteToken);'''
new_submit = '''      const { data:id, error } = await neon.rpc("submit_testimonial", {\n        p_name:nome,\n        p_instagram:instagram,\n        p_comment:comentario,\n        p_avatar_url:avatarData,\n        p_delete_token:deleteToken\n      });\n      if (error || !id) throw error || new Error("Depoimento não aceito");\n\n      salvarTokenExclusao(id, deleteToken);'''
if old_submit not in s:
    raise SystemExit('Bloco legado de submissão de depoimentos não encontrado')
s = s.replace(old_submit, new_submit, 1)
old_loader = '''async function carregarDepoimentos() {\n  let planilha = [], neonDeps = [];\n  montarCarrossel(DEPOIMENTOS_FIXOS);\n  await Promise.all([\n    fetch(DEPOIMENTOS_API_URL)\n      .then(r => r.json())\n      .then(d => { if (Array.isArray(d.depoimentos)) planilha = d.depoimentos; })\n      .catch(() => {}),\n    neonPublicClient()\n      .then(n => n.from("site_testimonials").select("id,name,instagram,comment,avatar_url,created_at").eq("is_visible", true).order("created_at", { ascending: false }))\n      .then(({ data, error }) => {\n        if (!error && Array.isArray(data)) {\n          neonDeps = data.map(x => ({ id: x.id, nome: x.name, instagram: x.instagram, comentario: x.comment, avatar_url: x.avatar_url, data: "" }));\n        }\n      })\n      .catch(() => {})\n  ]);\n  montarCarrossel([...DEPOIMENTOS_FIXOS, ...neonDeps, ...planilha]);\n}'''
new_loader = '''async function carregarDepoimentos() {\n  let legacyDeps = [], neonDeps = [];\n  await Promise.all([\n    // Fonte legada somente de leitura. Neon é a fonte canônica; esta leitura pode ser\n    // removida quando o conteúdo histórico do Apps Script for integralmente auditado.\n    fetch(DEPOIMENTOS_API_URL)\n      .then(r => r.json())\n      .then(d => { if (Array.isArray(d.depoimentos)) legacyDeps = d.depoimentos; })\n      .catch(() => {}),\n    neonPublicClient()\n      .then(n => n.from("site_testimonials").select("id,name,instagram,comment,avatar_url,created_at").eq("is_visible", true).order("created_at", { ascending: false }))\n      .then(({ data, error }) => {\n        if (!error && Array.isArray(data)) {\n          neonDeps = data.map(x => ({ id: x.id, nome: x.name, instagram: x.instagram, comentario: x.comment, avatar_url: x.avatar_url, data: "" }));\n        }\n      })\n      .catch(() => {})\n  ]);\n  const unique = new Map();\n  [...neonDeps, ...legacyDeps].forEach(dep => {\n    const key = [String(dep.nome || '').trim().toLowerCase(), String(dep.comentario || '').trim()].join('::');\n    if (key !== '::' && !unique.has(key)) unique.set(key, dep);\n  });\n  montarCarrossel([...unique.values()]);\n}'''
if old_loader not in s:
    raise SystemExit('Carregador antigo de depoimentos não encontrado')
s = s.replace(old_loader, new_loader, 1)
if 'DEPOIMENTOS_FIXOS' in s or '.insert({...row,is_visible:true})' in s:
    raise SystemExit('Resíduo de depoimentos fixos/fallback direto permaneceu')
p.write_text(s, encoding='utf-8')

# 2) Remove Batizado orphan metadata until there is a real commercial package.
p = ROOT / 'dados-servicos.js'
s = p.read_text(encoding='utf-8')
s = s.replace('  batizado: "Batizados",\n', '')
s = s.replace('  batizado: { nome: "Batizado", grupo: "evento", horaLivre: true, local: true },\n', '')
if re.search(r'^\s*batizado\s*:', s, re.M):
    raise SystemExit('Batizado ainda aparece em metadados operacionais sem pacote comercial')
p.write_text(s, encoding='utf-8')

# 3) Extract testimonial moderation from monolithic admin.js into its own module.
module = '''export function initTestimonialsAdmin({ neon, setMsg, esc, elements }) {\n  const { testimonialsAdmin, testimonialAdminGrid, testimonialAdminMsg, openTestimonialsBtn, closeTestimonialsBtn, refreshTestimonialsBtn } = elements;\n\n  function testimonialDate(value){\n    try{return new Intl.DateTimeFormat('pt-BR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}catch(_){return '';}\n  }\n\n  async function loadTestimonialsAdmin({silent=false}={}){\n    if(!testimonialAdminGrid)return;\n    if(!silent)testimonialAdminGrid.innerHTML='<div class="overview-empty">Carregando depoimentos…</div>';\n    const {data,error}=await neon.from('site_testimonials').select('id,name,instagram,comment,avatar_url,is_visible,created_at').order('created_at',{ascending:false});\n    if(error){console.error(error);if(!silent)setMsg(testimonialAdminMsg,'Não foi possível carregar os depoimentos.','error');return;}\n    const items=Array.isArray(data)?data:[];\n    openTestimonialsBtn?.classList.toggle('has-pending',items.some(x=>!x.is_visible));\n    openTestimonialsBtn?.setAttribute('data-pending',String(items.filter(x=>!x.is_visible).length));\n    if(!items.length){testimonialAdminGrid.innerHTML='<div class="overview-empty">Nenhum depoimento recebido ainda.</div>';return;}\n    testimonialAdminGrid.innerHTML=items.map(item=>{\n      const avatar=item.avatar_url?`<img src="${esc(item.avatar_url)}" alt="">`:`<span>${esc(String(item.name||'?').trim().charAt(0).toUpperCase())}</span>`;\n      const status=item.is_visible?'Publicado':'Pendente';\n      return `<article class="testimonial-admin-card ${item.is_visible?'is-visible':'is-pending'}" data-testimonial-id="${esc(item.id)}">\n        <div class="testimonial-admin-head"><div class="testimonial-admin-avatar">${avatar}</div><div><strong>${esc(item.name)}</strong><small>${item.instagram?'@'+esc(String(item.instagram).replace(/^@/,'')):testimonialDate(item.created_at)}</small></div><span class="testimonial-admin-status">${status}</span></div>\n        <p>${esc(item.comment)}</p>\n        <div class="testimonial-admin-actions">\n          <button type="button" class="btn btn-small testimonial-toggle">${item.is_visible?'Ocultar':'Aprovar'}</button>\n          <button type="button" class="btn btn-ghost btn-small testimonial-delete">Excluir</button>\n        </div>\n      </article>`;\n    }).join('');\n    testimonialAdminGrid.querySelectorAll('.testimonial-toggle').forEach(btn=>btn.addEventListener('click',async()=>{\n      const card=btn.closest('[data-testimonial-id]');const id=card.dataset.testimonialId;const visible=card.classList.contains('is-visible');\n      btn.disabled=true;\n      const {error}=await neon.from('site_testimonials').update({is_visible:!visible}).eq('id',id);\n      if(error){setMsg(testimonialAdminMsg,'Não foi possível atualizar o depoimento.','error');btn.disabled=false;return;}\n      setMsg(testimonialAdminMsg,!visible?'Depoimento publicado.':'Depoimento ocultado.','success');\n      await loadTestimonialsAdmin({silent:true});\n    }));\n    testimonialAdminGrid.querySelectorAll('.testimonial-delete').forEach(btn=>btn.addEventListener('click',async()=>{\n      const card=btn.closest('[data-testimonial-id]');const id=card.dataset.testimonialId;\n      if(!confirm('Excluir este depoimento? Esta ação não pode ser desfeita.'))return;\n      btn.disabled=true;\n      const {error}=await neon.from('site_testimonials').delete().eq('id',id);\n      if(error){setMsg(testimonialAdminMsg,'Não foi possível excluir o depoimento.','error');btn.disabled=false;return;}\n      setMsg(testimonialAdminMsg,'Depoimento excluído.','success');\n      await loadTestimonialsAdmin({silent:true});\n    }));\n  }\n\n  function openTestimonialsAdmin(){\n    if(!testimonialsAdmin)return;\n    testimonialsAdmin.hidden=false;\n    loadTestimonialsAdmin();\n    testimonialsAdmin.scrollIntoView({behavior:'smooth',block:'start'});\n  }\n  function closeTestimonialsAdmin(){\n    if(!testimonialsAdmin)return;\n    testimonialsAdmin.hidden=true;\n    document.querySelector('.admin-hub')?.scrollIntoView({behavior:'smooth',block:'start'});\n  }\n\n  openTestimonialsBtn?.addEventListener('click',openTestimonialsAdmin);\n  closeTestimonialsBtn?.addEventListener('click',closeTestimonialsAdmin);\n  refreshTestimonialsBtn?.addEventListener('click',()=>loadTestimonialsAdmin());\n\n  return { loadTestimonialsAdmin };\n}\n'''
(ROOT / 'admin-testimonials.js').write_text(module, encoding='utf-8')

p = ROOT / 'admin.js'
s = p.read_text(encoding='utf-8')
import_line = "import { initTestimonialsAdmin } from './admin-testimonials.js';\n"
if import_line not in s:
    s = s.replace("import { createClient, BetterAuthVanillaAdapter } from 'https://esm.sh/@neondatabase/neon-js@0.7.0-beta?bundle';\n", "import { createClient, BetterAuthVanillaAdapter } from 'https://esm.sh/@neondatabase/neon-js@0.7.0-beta?bundle';\n" + import_line, 1)
start = s.find('\nfunction testimonialDate(value){')
end_marker = "refreshTestimonialsBtn?.addEventListener('click',()=>loadTestimonialsAdmin());\n"
end = s.find(end_marker, start)
if start < 0 or end < 0:
    raise SystemExit('Bloco de moderação no admin não encontrado')
end += len(end_marker)
s = s[:start] + '\n' + s[end:]
init_marker = 'function validFile(f){return !fileIssue(f);}\n'
init_code = init_marker + "const { loadTestimonialsAdmin } = initTestimonialsAdmin({\n  neon, setMsg, esc,\n  elements:{ testimonialsAdmin, testimonialAdminGrid, testimonialAdminMsg, openTestimonialsBtn, closeTestimonialsBtn, refreshTestimonialsBtn }\n});\n"
if init_marker not in s:
    raise SystemExit('Ponto de inicialização do módulo de depoimentos não encontrado')
s = s.replace(init_marker, init_code, 1)
if 'function testimonialDate(value)' in s or "function openTestimonialsAdmin()" in s:
    raise SystemExit('Bloco antigo de depoimentos permaneceu em admin.js')
p.write_text(s, encoding='utf-8')

# 4) Remove known unreferenced low-resolution CTA legacy file only if no public source references it.
legacy = ROOT / 'assets' / 'cta-final.webp'
if legacy.exists():
    referenced = []
    for path in ROOT.rglob('*'):
      if path.is_file() and path.suffix.lower() in {'.html','.css','.js','.json','.py','.yml','.yaml'} and path != Path(__file__):
        try:
          if 'cta-final.webp' in path.read_text(encoding='utf-8'):
            referenced.append(str(path.relative_to(ROOT)))
        except UnicodeDecodeError:
          pass
    if referenced:
      raise SystemExit('cta-final.webp ainda é referenciado: ' + ', '.join(referenced))
    legacy.unlink()

# 5) Strengthen permanent validation around the cleaned-up boundaries.
p = ROOT / 'scripts' / 'validate_site.py'
s = p.read_text(encoding='utf-8')
needle = "if 'neon.rpc(\"submit_testimonial\"' not in (ROOT/'depoimentos.js').read_text(encoding='utf-8'): errors.append('Depoimentos: submissão moderada via RPC ausente')\n"
addition = needle + "depoimentos=(ROOT/'depoimentos.js').read_text(encoding='utf-8')\nif 'DEPOIMENTOS_FIXOS' in depoimentos: errors.append('Depoimentos: conteúdo fixo voltou ao JavaScript')\nif '.from(\"site_testimonials\").insert' in depoimentos or \".from('site_testimonials').insert\" in depoimentos: errors.append('Depoimentos: fallback de INSERT público direto reintroduzido')\nif not (ROOT/'admin-testimonials.js').exists(): errors.append('Painel: módulo de moderação de depoimentos ausente')\n"
if 'fallback de INSERT público direto reintroduzido' not in s:
    if needle not in s: raise SystemExit('Ponto do validador de depoimentos não encontrado')
    s = s.replace(needle, addition, 1)
needle2 = "if 'id: \"produtos\"' in data or 'grupo: \"produtos\"' in data: errors.append('Agendamento: grupo de produtos reintroduzido')\n"
addition2 = needle2 + "if re.search(r'^\\s*batizado\\s*:',data,re.M): errors.append('Serviços: Batizado órfão reintroduzido sem pacote comercial')\n"
if 'Batizado órfão reintroduzido' not in s:
    if needle2 not in s: raise SystemExit('Ponto do validador de serviços não encontrado')
    s = s.replace(needle2, addition2, 1)
s = s.replace("'admin.js','recent-works-admin.js']:", "'admin.js','admin-testimonials.js','recent-works-admin.js']:")
p.write_text(s, encoding='utf-8')

print('Final cleanup applied successfully.')
