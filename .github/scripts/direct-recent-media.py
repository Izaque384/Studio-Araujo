from pathlib import Path

# admin.js: allow the shared, already-working uploader to persist recent_work_id directly.
p=Path('admin.js')
s=p.read_text(encoding='utf-8')
s=s.replace("window.studioUploadMedia = async function({file: original, storageCategory, databaseCategory, altText = '', sortOrder = 1}){", "window.studioUploadMedia = async function({file: original, storageCategory, databaseCategory, altText = '', sortOrder = 1, recentWorkId = null}){", 1)
s=s.replace("    bytes:file.size,\n    created_by:currentUser?.id||null", "    bytes:file.size,\n    created_by:currentUser?.id||null,\n    recent_work_id:recentWorkId", 1)
p.write_text(s,encoding='utf-8')

# recent-works-admin.js: remove all browser dependence on recent_work_media.
p=Path('recent-works-admin.js')
s=p.read_text(encoding='utf-8')
start=s.index('async function loadWorkMedia(){')
end=s.index('\nasync function init() {', start)
replacement=r'''async function loadWorkMedia(){
  const grid=document.getElementById('recentMediaGrid'); if(!grid||!mediaWorkId)return;
  grid.innerHTML='<div class="recent-empty">Carregando mídias…</div>';
  const {data:media,error}=await neon.from('site_images').select('id,public_url,storage_key,mime_type,bytes,alt_text,sort_order,is_cover').eq('recent_work_id',mediaWorkId).order('sort_order',{ascending:true});
  if(error){console.error('Falha ao carregar mídias do trabalho',error);grid.innerHTML='<div class="recent-empty">Não foi possível carregar as mídias.</div>';setMediaStatus(error.message||'Não foi possível carregar as mídias.','err');return;}
  if(!media?.length){grid.innerHTML='<div class="recent-empty">Nenhuma mídia adicionada ainda.</div>';return;}
  grid.innerHTML=media.map(m=>{const video=String(m.mime_type||'').startsWith('video/');const preview=video?`<video src="${esc(m.public_url)}" controls preload="metadata"></video>`:`<img src="${esc(m.public_url)}" alt="${esc(m.alt_text||'')}" loading="lazy">`;return `<article class="recent-media-card" data-media-id="${esc(m.id)}" data-key="${esc(m.storage_key)}"><figure>${preview}</figure><div class="recent-media-card-body"><label>Ordem<input class="recent-media-order" type="number" value="${Number(m.sort_order||0)}"></label><div class="recent-media-actions"><button type="button" class="btn btn-ghost recent-set-cover ${m.is_cover?'recent-cover-on':''}" ${video?'disabled title="Vídeo não pode ser capa"':''}>${m.is_cover?'Capa atual':'Definir capa'}</button><button type="button" class="btn btn-danger recent-remove-media">Excluir</button></div></div></article>`}).join('');
  grid.querySelectorAll('.recent-media-card').forEach(card=>{card.querySelector('.recent-media-order')?.addEventListener('change',()=>updateMediaOrder(card));card.querySelector('.recent-set-cover')?.addEventListener('click',()=>setWorkCover(card));card.querySelector('.recent-remove-media')?.addEventListener('click',()=>deleteWorkMedia(card));});
}
async function openMediaManager(item){
  mediaWorkCategory=item?.gallery_category||null;mediaWorkId=item.id;const box=document.getElementById('recentMediaManager');if(!box)return;box.hidden=false;document.getElementById('recentMediaTitle').textContent=item.title;setMediaStatus('');await loadWorkMedia();box.scrollIntoView({behavior:'smooth',block:'start'});
}
function closeMediaManager(){
  mediaWorkCategory=null;mediaWorkId=null;const box=document.getElementById('recentMediaManager');if(box)box.hidden=true;const input=document.getElementById('recentMediaInput');if(input)input.value='';
}
async function uploadWorkMedia(files){
  if(!mediaWorkId||!files.length)return;
  const valid=files.filter(f=>!fileIssue(f));const invalid=files.length-valid.length;
  if(!valid.length){setMediaStatus('Nenhum arquivo válido selecionado.','err');return;}
  setMediaStatus(`Enviando 0 de ${valid.length}…`);let done=0;
  try{
    const {data:existing,error:orderError}=await neon.from('site_images').select('sort_order').eq('recent_work_id',mediaWorkId).order('sort_order',{ascending:false}).limit(1);
    if(orderError)throw orderError;
    let order=existing?.length?Number(existing[0].sort_order||0)+1:1;
    for(const original of valid){
      const uploader=window.studioUploadMedia;
      if(typeof uploader!=='function')throw new Error('O uploader principal do painel não está disponível. Recarregue a página.');
      await uploader({file:original,storageCategory:(mediaWorkCategory||categories[0]?.slug||'portfolio-casamentos'),databaseCategory:RECENT_MEDIA_CATEGORY,altText:'',sortOrder:order,recentWorkId:mediaWorkId});
      done++;order++;setMediaStatus(`Enviando ${done} de ${valid.length}…`);
    }
    setMediaStatus(`${done} arquivo${done===1?'':'s'} enviado${done===1?'':'s'}${invalid?` · ${invalid} ignorado${invalid===1?'':'s'}`:''}.`,'ok');
    await loadWorkMedia();
  }catch(err){console.error('Upload de trabalho recente falhou',err);setMediaStatus(err?.message||'Não foi possível enviar as mídias.','err');}
}
async function updateMediaOrder(card){
  const mediaId=card.dataset.mediaId,order=Number(card.querySelector('.recent-media-order').value||0);
  const {error}=await neon.from('site_images').update({sort_order:order}).eq('id',mediaId).eq('recent_work_id',mediaWorkId);
  setMediaStatus(error?'Não foi possível alterar a ordem.':'Ordem atualizada.',error?'err':'ok');if(!error)await loadWorkMedia();
}
async function setWorkCover(card){
  const mediaId=card.dataset.mediaId;setMediaStatus('Atualizando capa…');
  const {error:e1}=await neon.from('site_images').update({is_cover:false}).eq('recent_work_id',mediaWorkId);if(e1){setMediaStatus('Não foi possível atualizar a capa.','err');return;}
  const {error:e2}=await neon.from('site_images').update({is_cover:true}).eq('id',mediaId).eq('recent_work_id',mediaWorkId);setMediaStatus(e2?'Não foi possível definir a capa.':'Capa atualizada.',e2?'err':'ok');if(!e2)await loadWorkMedia();
}
async function deleteWorkMedia(card){
  if(!confirm('Excluir esta mídia deste trabalho?'))return;const mediaId=card.dataset.mediaId,key=card.dataset.key;setMediaStatus('Excluindo…');
  const {error}=await neon.from('site_images').delete().eq('id',mediaId).eq('recent_work_id',mediaWorkId);if(error){setMediaStatus('Não foi possível excluir esta mídia.','err');return;}
  if(key&&!key.startsWith('legacy:')){const deleter=window.studioStorageCall||storageCall;await deleter({action:'delete',storageKey:key}).catch(()=>{});}setMediaStatus('Mídia excluída.','ok');await loadWorkMedia();
}
'''
s=s[:start]+replacement+s[end:]
p.write_text(s,encoding='utf-8')

# recent-works.js: Home reads direct relationship from site_images.recent_work_id.
p=Path('recent-works.js')
s=p.read_text(encoding='utf-8')
old=r'''    const ids = trabalhos.map(t => t.id);
    let links = [], linkedMedia = new Map();
    if (ids.length) {
      const { data: rels, error: relsError } = await neon.from('recent_work_media').select('recent_work_id,media_id,sort_order,is_cover').in('recent_work_id', ids).order('sort_order', { ascending: true });
      if (relsError) { if (existente) existente.hidden = true; throw relsError; }
      links = Array.isArray(rels) ? rels : [];
      const mediaIds = [...new Set(links.map(r => r.media_id))];
      if (mediaIds.length) {
        const { data: medias, error: mediasError } = await neon.from('site_images').select('id,public_url,alt_text,mime_type').in('id', mediaIds).eq('is_visible', true);
        if (mediasError) { if (existente) existente.hidden = true; throw mediasError; }
        linkedMedia = new Map((medias || []).map(m => [m.id, m]));
      }
    }

    const preparados = await Promise.all(trabalhos.map(async (t) => {
      const proprias = links.filter(r => r.recent_work_id === t.id).map(r => { const m = linkedMedia.get(r.media_id); return m ? normalizeMedia({ ...m, is_cover:r.is_cover }) : null; }).filter(Boolean);
      const itens = proprias;'''
new=r'''    const ids = trabalhos.map(t => t.id);
    let medias = [];
    if (ids.length) {
      const { data: rows, error: mediasError } = await neon.from('site_images').select('id,public_url,alt_text,mime_type,recent_work_id,sort_order,is_cover').in('recent_work_id', ids).eq('is_visible', true).order('sort_order', { ascending: true });
      if (mediasError) { if (existente) existente.hidden = true; throw mediasError; }
      medias = Array.isArray(rows) ? rows : [];
    }

    const preparados = await Promise.all(trabalhos.map(async (t) => {
      const itens = medias.filter(m => m.recent_work_id === t.id).map(m => normalizeMedia(m));'''
if old not in s: raise SystemExit('home relation block not found')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
