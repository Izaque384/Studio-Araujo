from pathlib import Path

# admin.js: treat dedicated recent media category as its own logical area
p=Path('admin.js'); s=p.read_text(encoding='utf-8')
s=s.replace("function categoryArea(slug){return categories.find(c=>c.slug===slug)?.area||'';}","function categoryArea(slug){if(slug==='recent-work-media')return'recent';return categories.find(c=>c.slug===slug)?.area||'';}")
s=s.replace("function categoriesForArea(area){return categories.filter(c=>c.area===area);}","function categoriesForArea(area){return categories.filter(c=>categoryArea(c.slug)===area);}")
p.write_text(s,encoding='utf-8')

# admin.html: add recent-work folder in library
p=Path('admin.html'); s=p.read_text(encoding='utf-8')
anchor='''          <button type="button" class="folder-card" data-folder-area="portfolio">\n            <span class="folder-mark">P</span><span><strong>Portfólio</strong><small id="folderCountPortfolio">—</small></span>\n          </button>'''
insert=anchor+'''\n          <button type="button" class="folder-card" data-folder-area="recent">\n            <span class="folder-mark">R</span><span><strong>Trabalhos recentes</strong><small id="folderCountRecent">—</small></span>\n          </button>'''
if anchor not in s: raise SystemExit('admin.html folder anchor not found')
s=s.replace(anchor,insert,1)
p.write_text(s,encoding='utf-8')

# admin.js: recent folder count
p=Path('admin.js'); s=p.read_text(encoding='utf-8')
anchor="if($('folderCountPortfolio'))$('folderCountPortfolio').textContent=`${byArea('portfolio')} mídias`;"
if anchor not in s: raise SystemExit('admin.js count anchor not found')
s=s.replace(anchor,anchor+"\n  if($('folderCountRecent'))$('folderCountRecent').textContent=`${byArea('recent')} mídias`;",1)
p.write_text(s,encoding='utf-8')

# recent-works-admin.js: modern client + own media manager
p=Path('recent-works-admin.js'); s=p.read_text(encoding='utf-8')
s=s.replace("import { createClient, BetterAuthVanillaAdapter } from 'https://esm.sh/@neondatabase/neon-js@0.7.0-beta?bundle';","import { createClient } from 'https://esm.sh/@neondatabase/neon-js@latest?bundle';")
s=s.replace("const neon = createClient({ auth: { adapter: BetterAuthVanillaAdapter(), url: AUTH_URL }, dataApi: { url: DATA_API_URL } });","const STORAGE_FN = 'https://br-gentle-water-axxtumld-siteimages.compute.c-4.us-east-2.aws.neon.tech/';\nconst RECENT_MEDIA_CATEGORY = 'recent-work-media';\nconst MAX_IMAGE_BYTES = 25 * 1024 * 1024;\nconst MAX_VIDEO_BYTES = 100 * 1024 * 1024;\nconst neon = createClient({ auth: { url: AUTH_URL }, dataApi: { url: DATA_API_URL } });")
s=s.replace("let editingId = null;","let editingId = null;\nlet mediaWorkId = null;")
s=s.replace("    .recent-status.ok{color:#8fcf92}.recent-status.err{color:#ef9a9a}","    .recent-status.ok{color:#8fcf92}.recent-status.err{color:#ef9a9a}\n    .recent-media-manager{margin:22px 0 26px;padding:18px;border:1px solid rgba(201,162,75,.18);border-radius:14px;background:#0f0e0c}\n    .recent-media-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:14px}.recent-media-head h3{margin:0 0 4px;font-size:1.2rem}.recent-media-head p{margin:0;color:#a89d86;font-size:.8rem}\n    .recent-media-upload{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px}.recent-media-upload input{display:none}.recent-media-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.recent-media-card{border:1px solid rgba(201,162,75,.14);border-radius:12px;overflow:hidden;background:#12100d}.recent-media-card figure{margin:0;aspect-ratio:4/3;background:#070706}.recent-media-card img,.recent-media-card video{width:100%;height:100%;object-fit:cover}.recent-media-card-body{padding:9px;display:grid;gap:8px}.recent-media-card-body input{width:100%;background:#0e0d0b;border:1px solid rgba(201,162,75,.18);color:#f3ecdc;border-radius:8px;padding:8px}.recent-media-actions{display:flex;gap:6px;flex-wrap:wrap}.recent-media-actions .btn{padding:7px 9px;font-size:.72rem}.recent-cover-on{color:#e6c878;border-color:rgba(230,200,120,.5)!important}\n    @media(max-width:980px){.recent-media-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}")
s=s.replace("<p class=\"recent-admin-note\">Cada trabalho usa uma pasta do Portfólio como galeria. A Home mostra os 3 primeiros itens ativos, de acordo com a ordem.</p>","<p class=\"recent-admin-note\">Cada trabalho pode ter suas próprias fotos e vídeos. A Home mostra os 3 primeiros itens ativos, de acordo com a ordem.</p>")
anchor='''    </form>\n    <p id="recentStatus" class="recent-status" aria-live="polite"></p>'''
manager='''    </form>\n    <section id="recentMediaManager" class="recent-media-manager" hidden>\n      <div class="recent-media-head"><div><h3>Mídias deste trabalho</h3><p id="recentMediaTitle">Selecione um trabalho para gerenciar suas fotos e vídeos.</p></div><button type="button" class="btn btn-ghost" id="recentMediaClose">Fechar</button></div>\n      <div class="recent-media-upload"><label class="btn btn-primary" for="recentMediaInput">Adicionar fotos ou vídeos</label><input id="recentMediaInput" type="file" accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm" multiple><span id="recentMediaStatus" class="recent-status"></span></div>\n      <div id="recentMediaGrid" class="recent-media-grid"></div>\n    </section>\n    <p id="recentStatus" class="recent-status" aria-live="polite"></p>'''
if anchor not in s: raise SystemExit('recent manager anchor not found')
s=s.replace(anchor,manager,1)
s=s.replace("categories = (data || []).filter(c => c.area === 'portfolio');","categories = (data || []).filter(c => c.area === 'portfolio' && c.slug !== RECENT_MEDIA_CATEGORY);")
s=s.replace("<button type=\"button\" class=\"btn btn-ghost recent-edit\">Editar</button>","<button type=\"button\" class=\"btn btn-ghost recent-media\">Mídias</button><button type=\"button\" class=\"btn btn-ghost recent-edit\">Editar</button>")
s=s.replace("row.querySelector('.recent-edit').addEventListener('click', () => editItem(item));","row.querySelector('.recent-media').addEventListener('click', () => openMediaManager(item));\n    row.querySelector('.recent-edit').addEventListener('click', () => editItem(item));")
s=s.replace("function resetForm() {\n  editingId = null;","function resetForm() {\n  editingId = null;\n  closeMediaManager();")
s=s.replace("  document.getElementById('recentForm').scrollIntoView({behavior:'smooth',block:'center'});","  openMediaManager(item);\n  document.getElementById('recentForm').scrollIntoView({behavior:'smooth',block:'center'});")

insert_before='''async function init() {'''
media_code=r'''
function setMediaStatus(text='', type='') {
  const el=document.getElementById('recentMediaStatus'); if(!el)return;
  el.textContent=text; el.className='recent-status'+(type?' '+type:'');
}
function isVideoFile(file){return /^video\//i.test(file?.type||'');}
function fileIssue(file){
  const image=/^image\/(jpeg|png|webp|avif)$/i.test(file.type),video=/^video\/(mp4|webm)$/i.test(file.type);
  if(!image&&!video)return'Formato não aceito';
  if(image&&file.size>MAX_IMAGE_BYTES)return'Foto acima de 25 MB';
  if(video&&file.size>MAX_VIDEO_BYTES)return'Vídeo acima de 100 MB';
  return'';
}
async function optimizeImage(file){
  if(isVideoFile(file)||file.type==='image/avif')return file;
  try{const bitmap=await createImageBitmap(file),maxSide=2400,scale=Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height));const w=Math.max(1,Math.round(bitmap.width*scale)),h=Math.max(1,Math.round(bitmap.height*scale));const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;canvas.getContext('2d',{alpha:true}).drawImage(bitmap,0,0,w,h);bitmap.close();const blob=await new Promise(r=>canvas.toBlob(r,'image/webp',.88));return blob?new File([blob],file.name.replace(/\.[^.]+$/,'')+'.webp',{type:'image/webp'}):file;}catch(_){return file;}
}
async function storageCall(payload){
  const token=await neon.auth.getJWTToken?.(); if(!token)throw new Error('Sessão expirada. Entre novamente.');
  const res=await fetch(STORAGE_FN,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(payload)});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||'Falha no armazenamento.');return data;
}
async function loadWorkMedia(){
  const grid=document.getElementById('recentMediaGrid'); if(!grid||!mediaWorkId)return;
  grid.innerHTML='<div class="recent-empty">Carregando mídias…</div>';
  const {data:links,error}=await neon.from('recent_work_media').select('media_id,sort_order,is_cover').eq('recent_work_id',mediaWorkId).order('sort_order',{ascending:true});
  if(error){grid.innerHTML='<div class="recent-empty">Não foi possível carregar as mídias.</div>';return;}
  if(!links?.length){grid.innerHTML='<div class="recent-empty">Nenhuma mídia adicionada ainda.</div>';return;}
  const ids=links.map(x=>x.media_id); const {data:media,error:mediaError}=await neon.from('site_images').select('id,public_url,storage_key,mime_type,bytes,alt_text').in('id',ids);
  if(mediaError){grid.innerHTML='<div class="recent-empty">Não foi possível carregar os arquivos.</div>';return;}
  const map=new Map((media||[]).map(m=>[m.id,m]));
  grid.innerHTML=links.map(link=>{const m=map.get(link.media_id);if(!m)return'';const video=String(m.mime_type||'').startsWith('video/');const preview=video?`<video src="${esc(m.public_url)}" controls preload="metadata"></video>`:`<img src="${esc(m.public_url)}" alt="${esc(m.alt_text||'')}" loading="lazy">`;return `<article class="recent-media-card" data-media-id="${esc(m.id)}" data-key="${esc(m.storage_key)}"><figure>${preview}</figure><div class="recent-media-card-body"><label>Ordem<input class="recent-media-order" type="number" value="${Number(link.sort_order||0)}"></label><div class="recent-media-actions"><button type="button" class="btn btn-ghost recent-set-cover ${link.is_cover?'recent-cover-on':''}" ${video?'disabled title="Vídeo não pode ser capa"':''}>${link.is_cover?'Capa atual':'Definir capa'}</button><button type="button" class="btn btn-danger recent-remove-media">Excluir</button></div></div></article>`}).join('');
  grid.querySelectorAll('.recent-media-card').forEach(card=>{card.querySelector('.recent-media-order')?.addEventListener('change',()=>updateMediaOrder(card));card.querySelector('.recent-set-cover')?.addEventListener('click',()=>setWorkCover(card));card.querySelector('.recent-remove-media')?.addEventListener('click',()=>deleteWorkMedia(card));});
}
async function openMediaManager(item){mediaWorkId=item.id;const box=document.getElementById('recentMediaManager');if(!box)return;box.hidden=false;document.getElementById('recentMediaTitle').textContent=item.title;setMediaStatus('');await loadWorkMedia();box.scrollIntoView({behavior:'smooth',block:'start'});}
function closeMediaManager(){mediaWorkId=null;const box=document.getElementById('recentMediaManager');if(box)box.hidden=true;const input=document.getElementById('recentMediaInput');if(input)input.value='';}
async function uploadWorkMedia(files){
  if(!mediaWorkId||!files.length)return; const valid=files.filter(f=>!fileIssue(f)); const invalid=files.length-valid.length;if(!valid.length){setMediaStatus('Nenhum arquivo válido selecionado.','err');return;}
  setMediaStatus(`Enviando 0 de ${valid.length}…`); let done=0;
  try{const {data:existing}=await neon.from('recent_work_media').select('sort_order').eq('recent_work_id',mediaWorkId).order('sort_order',{ascending:false}).limit(1);let order=existing?.length?Number(existing[0].sort_order||0)+1:1;
    for(const original of valid){const file=await optimizeImage(original);const signed=await storageCall({action:'presign',category:RECENT_MEDIA_CATEGORY,fileName:file.name,contentType:file.type});const put=await fetch(signed.uploadUrl,{method:'PUT',headers:{'Content-Type':file.type},body:file});if(!put.ok)throw new Error(`Não foi possível enviar ${original.name}.`);const {data:inserted,error}=await neon.from('site_images').insert({storage_key:signed.storageKey,public_url:signed.publicUrl,category:RECENT_MEDIA_CATEGORY,alt_text:'',sort_order:order,is_visible:true,is_cover:false,mime_type:file.type,bytes:file.size}).select('id').single();if(error){await storageCall({action:'delete',storageKey:signed.storageKey}).catch(()=>{});throw error;}const {error:linkError}=await neon.from('recent_work_media').insert({recent_work_id:mediaWorkId,media_id:inserted.id,sort_order:order,is_cover:false});if(linkError){await neon.from('site_images').delete().eq('id',inserted.id);await storageCall({action:'delete',storageKey:signed.storageKey}).catch(()=>{});throw linkError;}done++;order++;setMediaStatus(`Enviando ${done} de ${valid.length}…`);}
    setMediaStatus(`${done} arquivo${done===1?'':'s'} enviado${done===1?'':'s'}${invalid?` · ${invalid} ignorado${invalid===1?'':'s'}`:''}.`,'ok');await loadWorkMedia();
  }catch(err){console.error(err);setMediaStatus(err?.message||'Não foi possível enviar as mídias.','err');}
}
async function updateMediaOrder(card){const mediaId=card.dataset.mediaId,order=Number(card.querySelector('.recent-media-order').value||0);const {error}=await neon.from('recent_work_media').update({sort_order:order}).eq('recent_work_id',mediaWorkId).eq('media_id',mediaId);setMediaStatus(error?'Não foi possível alterar a ordem.':'Ordem atualizada.',error?'err':'ok');if(!error)await loadWorkMedia();}
async function setWorkCover(card){const mediaId=card.dataset.mediaId;setMediaStatus('Atualizando capa…');const {error:e1}=await neon.from('recent_work_media').update({is_cover:false}).eq('recent_work_id',mediaWorkId);if(e1){setMediaStatus('Não foi possível atualizar a capa.','err');return;}const {error:e2}=await neon.from('recent_work_media').update({is_cover:true}).eq('recent_work_id',mediaWorkId).eq('media_id',mediaId);setMediaStatus(e2?'Não foi possível definir a capa.':'Capa atualizada.',e2?'err':'ok');if(!e2)await loadWorkMedia();}
async function deleteWorkMedia(card){if(!confirm('Excluir esta mídia deste trabalho?'))return;const mediaId=card.dataset.mediaId,key=card.dataset.key;setMediaStatus('Excluindo…');const {error}=await neon.from('site_images').delete().eq('id',mediaId);if(error){setMediaStatus('Não foi possível excluir esta mídia.','err');return;}if(key&&!key.startsWith('legacy:'))await storageCall({action:'delete',storageKey:key}).catch(()=>{});setMediaStatus('Mídia excluída.','ok');await loadWorkMedia();}
'''
if insert_before not in s: raise SystemExit('recent init anchor not found')
s=s.replace(insert_before,media_code+'\n'+insert_before,1)
s=s.replace("document.getElementById('recentRefresh').addEventListener('click', loadRecentWorks);","document.getElementById('recentRefresh').addEventListener('click', loadRecentWorks);\n    document.getElementById('recentMediaInput').addEventListener('change',e=>uploadWorkMedia([...e.target.files]).finally(()=>{e.target.value='';}));\n    document.getElementById('recentMediaClose').addEventListener('click',closeMediaManager);")
p.write_text(s,encoding='utf-8')

# recent-works.js: use dedicated linked media, fallback to old portfolio category
p=Path('recent-works.js'); s=p.read_text(encoding='utf-8')
anchor="    const labels = new Map((categorias || []).map(c => [c.slug, c.label]));\n\n    const preparados = await Promise.all(trabalhos.map(async (t) => {\n      const remoto = await midiasDoPainel(t.gallery_category);\n      if (!remoto.ok || !remoto.items.length) return null;\n      const itens = remoto.items;"
replacement="""    const labels = new Map((categorias || []).map(c => [c.slug, c.label]));\n    const ids = trabalhos.map(t => t.id);\n    let links = [], linkedMedia = new Map();\n    if (ids.length) {\n      const { data: rels } = await neon.from('recent_work_media').select('recent_work_id,media_id,sort_order,is_cover').in('recent_work_id', ids).order('sort_order', { ascending: true });\n      links = Array.isArray(rels) ? rels : [];\n      const mediaIds = [...new Set(links.map(r => r.media_id))];\n      if (mediaIds.length) {\n        const { data: medias } = await neon.from('site_images').select('id,public_url,alt_text,mime_type').in('id', mediaIds).eq('is_visible', true);\n        linkedMedia = new Map((medias || []).map(m => [m.id, m]));\n      }\n    }\n\n    const preparados = await Promise.all(trabalhos.map(async (t) => {\n      const proprias = links.filter(r => r.recent_work_id === t.id).map(r => { const m = linkedMedia.get(r.media_id); return m ? normalizeMedia({ ...m, is_cover:r.is_cover }) : null; }).filter(Boolean);\n      let itens = proprias;\n      if (!itens.length) {\n        const remoto = await midiasDoPainel(t.gallery_category);\n        if (!remoto.ok || !remoto.items.length) return null;\n        itens = remoto.items;\n      }"""
if anchor not in s: raise SystemExit('recent-works public anchor not found')
s=s.replace(anchor,replacement,1)
p.write_text(s,encoding='utf-8')
