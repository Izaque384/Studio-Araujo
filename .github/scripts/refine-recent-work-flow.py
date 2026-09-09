from pathlib import Path

p=Path('recent-works-admin.js')
s=p.read_text(encoding='utf-8')

# Make the two-step workflow explicit in the UI.
s=s.replace("<h2>Trabalhos recentes</h2>\n        <p class=\"recent-admin-note\">Cada trabalho pode ter suas próprias fotos e vídeos. A Home mostra os 3 primeiros itens ativos, de acordo com a ordem.</p>","<h2>Trabalhos recentes</h2>\n        <p class=\"recent-admin-note\">Crie o trabalho primeiro e, em seguida, adicione suas fotos e vídeos. A Home mostra os 3 primeiros itens ativos, de acordo com a ordem.</p>")

s=s.replace("<form id=\"recentForm\" class=\"recent-form\">","<div class=\"recent-step-label\"><span>1</span><div><strong>Informações do trabalho</strong><small>Título, categoria, data e publicação</small></div></div>\n    <form id=\"recentForm\" class=\"recent-form\">")

s=s.replace("<section id=\"recentMediaManager\" class=\"recent-media-manager\" hidden>\n      <div class=\"recent-media-head\"><div><h3>Mídias deste trabalho</h3><p id=\"recentMediaTitle\">Selecione um trabalho para gerenciar suas fotos e vídeos.</p></div>","<section id=\"recentMediaManager\" class=\"recent-media-manager\" hidden>\n      <div class=\"recent-step-label recent-step-media\"><span>2</span><div><strong>Fotos e vídeos</strong><small>Adicione as mídias, escolha a capa e organize a ordem</small></div></div>\n      <div class=\"recent-media-head\"><div><h3>Mídias deste trabalho</h3><p id=\"recentMediaTitle\">Selecione um trabalho para gerenciar suas fotos e vídeos.</p></div>")

style_anchor="    .recent-status.ok{color:#8fcf92}.recent-status.err{color:#ef9a9a}\n"
style_add="    .recent-step-label{grid-column:1/-1;display:flex;align-items:center;gap:11px;margin:2px 0 14px;color:#f3ecdc}.recent-step-label>span{display:grid;place-items:center;width:29px;height:29px;flex:0 0 29px;border:1px solid rgba(201,162,75,.35);border-radius:50%;color:#e6c878;font-size:.74rem;font-weight:600;background:rgba(201,162,75,.05)}.recent-step-label div{display:grid;gap:1px}.recent-step-label strong{font-size:.85rem;font-weight:500}.recent-step-label small{color:#a89d86;font-size:.72rem}.recent-step-media{margin:0 0 16px}\n"
if style_anchor in s and 'recent-step-label{' not in s:
    s=s.replace(style_anchor,style_anchor+style_add,1)

old="""  try {
    const query = editingId
      ? neon.from('recent_works').update(payload).eq('id', editingId)
      : neon.from('recent_works').insert(payload);
    const { error } = await query;
    if (error) throw error;
    setStatus(editingId ? 'Trabalho atualizado.' : 'Trabalho adicionado.', 'ok');
    resetForm();
    await loadRecentWorks();
  } catch (err) {"""
new="""  try {
    const wasEditing = !!editingId;
    let savedItem = null;
    if (wasEditing) {
      const { error } = await neon.from('recent_works').update(payload).eq('id', editingId);
      if (error) throw error;
    } else {
      const { data, error } = await neon.from('recent_works').insert(payload).select('*').single();
      if (error) throw error;
      savedItem = data;
    }
    setStatus(wasEditing ? 'Trabalho atualizado.' : 'Trabalho criado. Agora adicione as fotos ou vídeos.', 'ok');
    resetForm();
    await loadRecentWorks();
    if (savedItem) {
      await openMediaManager(savedItem);
      setMediaStatus('Trabalho criado com sucesso. Adicione as mídias abaixo para concluir.', 'ok');
    }
  } catch (err) {"""
if old not in s:
    raise SystemExit('saveItem block not found')
s=s.replace(old,new,1)

# Keep button label correct after an async create/reset.
s=s.replace("    if (!editingId) save.textContent = 'Adicionar trabalho';","    if (!editingId) save.textContent = 'Adicionar trabalho';",1)

p.write_text(s,encoding='utf-8')
