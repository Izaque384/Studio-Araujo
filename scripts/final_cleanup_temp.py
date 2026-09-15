from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

p = ROOT / 'depoimentos.js'
s = p.read_text(encoding='utf-8')

fixed_start = s.find('const DEPOIMENTOS_FIXOS = [')
if fixed_start >= 0:
    fixed_end = s.find('];', fixed_start)
    if fixed_end < 0: raise SystemExit('Fim de DEPOIMENTOS_FIXOS não encontrado')
    s = s[:fixed_start] + s[fixed_end + 2:].lstrip('\n')

avatar_start = s.find('  const avataresFixos = {')
if avatar_start >= 0:
    avatar_end_marker = '  } catch (_) {}\n'
    avatar_end = s.find(avatar_end_marker, avatar_start)
    if avatar_end < 0: raise SystemExit('Fim do mutador de avatares antigos não encontrado')
    s = s[:avatar_start] + s[avatar_end + len(avatar_end_marker):]

old_submit = '''      const row = { name:nome, instagram, comment:comentario, avatar_url:avatarData, delete_token:deleteToken };\n      let data=null,error=null;\n      const rpc = await neon.rpc("submit_testimonial", {\n        p_name:nome,\n        p_instagram:instagram,\n        p_comment:comentario,\n        p_avatar_url:avatarData,\n        p_delete_token:deleteToken\n      });\n      if (!rpc?.error && rpc?.data) {\n        data = {id:rpc.data};\n      } else {\n        // Compatibilidade somente enquanto a migração de moderação ainda não foi aplicada.\n        const legacy = await neon.from("site_testimonials").insert({...row,is_visible:true}).select("id").single();\n        data = legacy?.data || null;\n        error = legacy?.error || rpc?.error || null;\n      }\n      if (error || !data?.id) throw error || new Error("Depoimento não aceito");\n\n      salvarTokenExclusao(data.id, deleteToken);'''
new_submit = '''      const { data:id, error } = await neon.rpc("submit_testimonial", {\n        p_name:nome,\n        p_instagram:instagram,\n        p_comment:comentario,\n        p_avatar_url:avatarData,\n        p_delete_token:deleteToken\n      });\n      if (error || !id) throw error || new Error("Depoimento não aceito");\n\n      salvarTokenExclusao(id, deleteToken);'''
if old_submit not in s: raise SystemExit('Bloco legado de submissão não encontrado')
s = s.replace(old_submit, new_submit, 1)
s = s.replace('  montarCarrossel(DEPOIMENTOS_FIXOS);\n', '')
s = s.replace(
    '  montarCarrossel([...DEPOIMENTOS_FIXOS, ...neonDeps, ...planilha]);',
    '''  const unique = new Map();\n  [...neonDeps, ...planilha].forEach(dep => {\n    const key = [String(dep.nome || '').trim().toLowerCase(), String(dep.comentario || '').trim()].join('::');\n    if (key !== '::' && !unique.has(key)) unique.set(key, dep);\n  });\n  montarCarrossel([...unique.values()]);''', 1)
if 'DEPOIMENTOS_FIXOS' in s: raise SystemExit('DEPOIMENTOS_FIXOS ainda aparece após a limpeza')
if '.insert({...row,is_visible:true})' in s: raise SystemExit('Fallback direto de INSERT ainda aparece')
p.write_text(s, encoding='utf-8')

p = ROOT / 'dados-servicos.js'
s = p.read_text(encoding='utf-8')
s = s.replace('  batizado: "Batizados",\n', '')
s = s.replace('  batizado: { nome: "Batizado", grupo: "evento", horaLivre: true, local: true },\n', '')
if re.search(r'^\s*batizado\s*:', s, re.M): raise SystemExit('Batizado ainda aparece sem pacote comercial')
p.write_text(s, encoding='utf-8')

module = '''export function initTestimonialsAdmin({ neon, setMsg, esc, elements }) {\n  const { testimonialsAdmin, testimonialAdminGrid, testimonialAdminMsg, openTestimonialsBtn, closeTestimonialsBtn, refreshTestimonialsBtn } = elements;\n  function testimonialDate(value){\n    try{return new Intl.DateTimeFormat('pt-BR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}catch(_){return '';}\n  }\n  async function loadTestimonialsAdmin({silent=false}={}){\n    if(!testimonialAdminGrid)return;\n    if(!silent)testimonialAdminGrid.innerHTML='<div class="overview-empty">Carregando depoimentos…</div>';\n    const {data,error}=await neon.from('site_testimonials').select('id,name,instagram,comment,avatar_url,is_visible,created_at').order('created_at',{ascending:false});\n    if(error){console.error(error);if(!silent)setMsg(testimonialAdminMsg,'Não foi possível carregar os depoimentos.','error');return;}\n    const items=Array.isArray(data)?data:[];\n    openTestimonialsBtn?.classList.toggle('has-pending',items.some(x=>!x.is_visible));\n    openTestimonialsBtn?.setAttribute('data-pending',String(items.filter(x=>!x.is_visible).length));\n    if(!items.length){testimonialAdminGrid.innerHTML='<div class="overview-empty">Nenhum depoimento recebido ainda.</div>';return;}\n    testimonialAdminGrid.innerHTML=items.map(item=>{\n      const avatar=item.avatar_url?`<img src="${esc(item.avatar_url)}" alt="">`:`<span>${esc(String(item.name||'?').trim().charAt(0).toUpperCase())}</span>`;\n      const status=item.is_visible?'Publicado':'Pendente';\n      return `<article class="testimonial-admin-card ${item.is_visible?'is-visible':'is-pending'}" data-testimonial-id="${esc(item.id)}">\n        <div class="testimonial-admin-head"><div class="testimonial-admin-avatar">${avatar}</div><div><strong>${esc(item.name)}</strong><small>${item.instagram?'@'+esc(String(item.instagram).replace(/^@/,'')):testimonialDate(item.created_at)}</small></div><span class="testimonial-admin-status">${status}</span></div>\n        <p>${esc(item.comment)}</p>\n        <div class="testimonial-admin-actions">\n          <button type="button" class="btn btn-small testimonial-toggle">${item.is_visible?'Ocultar':'Aprovar'}</button>\n          <button type="button" class="btn btn-ghost btn-small testimonial-delete">Excluir</button>\n        </div>\n      </article>`;\n    }).join('');\n    testimonialAdminGrid.querySelectorAll('.testimonial-toggle').forEach(btn=>btn.addEventListener('click',async()=>{\n      const card=btn.closest('[data-testimonial-id]');const id=card.dataset.testimonialId;const visible=card.classList.contains('is-visible');btn.disabled=true;\n      const {error}=await neon.from('site_testimonials').update({is_visible:!visible}).eq('id',id);\n      if(error){setMsg(testimonialAdminMsg,'Não foi possível atualizar o depoimento.','error');btn.disabled=false;return;}\n      setMsg(testimonialAdminMsg,!visible?'Depoimento publicado.':'Depoimento ocultado.','success');await loadTestimonialsAdmin({silent:true});\n    }));\n    testimonialAdminGrid.querySelectorAll('.testimonial-delete').forEach(btn=>btn.addEventListener('click',async()=>{\n      const card=btn.closest('[data-testimonial-id]');const id=card.dataset.testimonialId;if(!confirm('Excluir este depoimento? Esta ação não pode ser desfeita.'))return;btn.disabled=true;\n      const {error}=await neon.from('site_testimonials').delete().eq('id',id);\n      if(error){setMsg(testimonialAdminMsg,'Não foi possível excluir o depoimento.','error');btn.disabled=false;return;}\n      setMsg(testimonialAdminMsg,'Depoimento excluído.','success');await loadTestimonialsAdmin({silent:true});\n    }));\n  }\n  function openTestimonialsAdmin(){if(!testimonialsAdmin)return;testimonialsAdmin.hidden=false;loadTestimonialsAdmin();testimonialsAdmin.scrollIntoView({behavior:'smooth',block:'start'});}\n  function closeTestimonialsAdmin(){if(!testimonialsAdmin)return;testimonialsAdmin.hidden=true;document.querySelector('.admin-hub')?.scrollIntoView({behavior:'smooth',block:'start'});}\n  openTestimonialsBtn?.addEventListener('click',openTestimonialsAdmin);\n  closeTestimonialsBtn?.addEventListener('click',closeTestimonialsAdmin);\n  refreshTestimonialsBtn?.addEventListener('click',()=>loadTestimonialsAdmin());\n  return { loadTestimonialsAdmin };\n}\n'''
(ROOT / 'admin-testimonials.js').write_text(module, encoding='utf-8')

p = ROOT / 'admin.js'
s = p.read_text(encoding='utf-8')
base_import = "import { createClient, BetterAuthVanillaAdapter } from 'https://esm.sh/@neondatabase/neon-js@0.7.0-beta?bundle';\n"
module_import = "import { initTestimonialsAdmin } from './admin-testimonials.js';\n"
if module_import not in s:
    if base_import not in s: raise SystemExit('Import base do admin não encontrado')
    s = s.replace(base_import, base_import + module_import, 1)
start=s.find('\nfunction testimonialDate(value){'); end_marker="refreshTestimonialsBtn?.addEventListener('click',()=>loadTestimonialsAdmin());\n"; end=s.find(end_marker,start)
if start<0 or end<0: raise SystemExit('Bloco de moderação no admin não encontrado')
s=s[:start]+'\n'+s[end+len(end_marker):]
init_marker='function validFile(f){return !fileIssue(f);}\n'
init_code=init_marker+"const { loadTestimonialsAdmin } = initTestimonialsAdmin({\n  neon, setMsg, esc,\n  elements:{ testimonialsAdmin, testimonialAdminGrid, testimonialAdminMsg, openTestimonialsBtn, closeTestimonialsBtn, refreshTestimonialsBtn }\n});\n"
if init_marker not in s: raise SystemExit('Ponto de inicialização do módulo não encontrado')
s=s.replace(init_marker,init_code,1)
p.write_text(s,encoding='utf-8')

legacy=ROOT/'assets'/'cta-final.webp'
if legacy.exists():
    refs=[]
    for path in ROOT.rglob('*'):
        if path.is_file() and path.suffix.lower() in {'.html','.css','.js','.json'}:
            try:
                if 'cta-final.webp' in path.read_text(encoding='utf-8'): refs.append(str(path.relative_to(ROOT)))
            except UnicodeDecodeError: pass
    if refs: raise SystemExit('cta-final.webp ainda referenciado: '+', '.join(refs))
    legacy.unlink()

p=ROOT/'scripts'/'validate_site.py'; s=p.read_text(encoding='utf-8')
needle="if 'neon.rpc(\"submit_testimonial\"' not in (ROOT/'depoimentos.js').read_text(encoding='utf-8'): errors.append('Depoimentos: submissão moderada via RPC ausente')\n"
addition=needle+"depoimentos=(ROOT/'depoimentos.js').read_text(encoding='utf-8')\nif 'DEPOIMENTOS_FIXOS' in depoimentos: errors.append('Depoimentos: conteúdo fixo voltou ao JavaScript')\nif '.from(\"site_testimonials\").insert' in depoimentos or \".from('site_testimonials').insert\" in depoimentos: errors.append('Depoimentos: fallback de INSERT público direto reintroduzido')\nif not (ROOT/'admin-testimonials.js').exists(): errors.append('Painel: módulo de moderação de depoimentos ausente')\n"
if 'fallback de INSERT público direto reintroduzido' not in s:
    if needle not in s: raise SystemExit('Ponto do validador de depoimentos não encontrado')
    s=s.replace(needle,addition,1)
needle2="if 'id: \"produtos\"' in data or 'grupo: \"produtos\"' in data: errors.append('Agendamento: grupo de produtos reintroduzido')\n"
addition2=needle2+"if re.search(r'^\\s*batizado\\s*:',data,re.M): errors.append('Serviços: Batizado órfão reintroduzido sem pacote comercial')\n"
if 'Batizado órfão reintroduzido' not in s:
    if needle2 not in s: raise SystemExit('Ponto do validador de serviços não encontrado')
    s=s.replace(needle2,addition2,1)
s=s.replace("'admin.js','recent-works-admin.js']:","'admin.js','admin-testimonials.js','recent-works-admin.js']:")
p.write_text(s,encoding='utf-8')
print('Final cleanup applied successfully.')
