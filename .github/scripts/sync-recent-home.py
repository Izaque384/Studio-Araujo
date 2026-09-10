from pathlib import Path

p = Path('recent-works.js')
s = p.read_text(encoding='utf-8')

old = "    if (error || !Array.isArray(trabalhos) || !trabalhos.length) return;"
new = "    if (error || !Array.isArray(trabalhos)) return;\n    if (!trabalhos.length) { if (existente) existente.hidden = true; return; }"
if old not in s:
    raise SystemExit('recent works empty-state marker not found')
s = s.replace(old, new, 1)

old = "      const { data: rels } = await neon.from('recent_work_media').select('recent_work_id,media_id,sort_order,is_cover').in('recent_work_id', ids).order('sort_order', { ascending: true });\n      links = Array.isArray(rels) ? rels : [];"
new = "      const { data: rels, error: relsError } = await neon.from('recent_work_media').select('recent_work_id,media_id,sort_order,is_cover').in('recent_work_id', ids).order('sort_order', { ascending: true });\n      if (relsError) { if (existente) existente.hidden = true; throw relsError; }\n      links = Array.isArray(rels) ? rels : [];"
if old not in s:
    raise SystemExit('recent media relation query marker not found')
s = s.replace(old, new, 1)

old = "        const { data: medias } = await neon.from('site_images').select('id,public_url,alt_text,mime_type').in('id', mediaIds).eq('is_visible', true);\n        linkedMedia = new Map((medias || []).map(m => [m.id, m]));"
new = "        const { data: medias, error: mediasError } = await neon.from('site_images').select('id,public_url,alt_text,mime_type').in('id', mediaIds).eq('is_visible', true);\n        if (mediasError) { if (existente) existente.hidden = true; throw mediasError; }\n        linkedMedia = new Map((medias || []).map(m => [m.id, m]));"
if old not in s:
    raise SystemExit('linked media query marker not found')
s = s.replace(old, new, 1)

old = "    const validos = preparados.filter(Boolean);\n    if (!validos.length) return;\n    let section = existente;"
new = "    const validos = preparados.filter(Boolean);\n    if (!validos.length) { if (existente) existente.hidden = true; return; }\n    let section = existente;"
if old not in s:
    raise SystemExit('valid recent works marker not found')
s = s.replace(old, new, 1)

old = "    const cards = validos.map((t, i) => {"
new = "    section.hidden = false;\n\n    const cards = validos.map((t, i) => {"
if old not in s:
    raise SystemExit('recent section reveal marker not found')
s = s.replace(old, new, 1)

s = s.replace("// Mantém o bloco estático atual como fallback caso o banco não responda.", "// O painel é a fonte de verdade. O conteúdo estático só permanece quando o banco inteiro não responde.", 1)
s = s.replace("console.warn('Trabalhos recentes: usando fallback estático.', err);", "console.warn('Trabalhos recentes: falha ao sincronizar com o painel.', err);", 1)

p.write_text(s, encoding='utf-8')
