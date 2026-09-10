from pathlib import Path
import re

# 1) Expose the already working admin uploader so recent works uses the same auth/client/storage path.
p = Path('admin.js')
s = p.read_text(encoding='utf-8')
marker = "function nextSortOrder(category){"
if marker not in s:
    raise SystemExit('admin.js insertion marker not found')
helper = r'''// Shared authenticated uploader used by the main panel and by Trabalhos recentes.
window.studioUploadMedia = async function({file: original, storageCategory, databaseCategory, altText = '', sortOrder = 1}){
  if(!original) throw new Error('Arquivo não informado.');
  if(!storageCategory) throw new Error('Categoria de armazenamento não informada.');
  const file = await optimizeImage(original);
  const signed = await storageCall({action:'presign',category:storageCategory,fileName:file.name,contentType:file.type});
  const put = await fetch(signed.uploadUrl,{method:'PUT',headers:{'Content-Type':file.type},body:file});
  if(!put.ok) throw new Error(`Não foi possível enviar ${original.name}.`);
  const {data,error} = await neon.from('site_images').insert({
    storage_key:signed.storageKey,
    public_url:signed.publicUrl,
    category:databaseCategory || storageCategory,
    alt_text:altText,
    sort_order:sortOrder,
    is_visible:true,
    is_cover:false,
    mime_type:file.type,
    bytes:file.size,
    created_by:currentUser?.id||null
  }).select('*').single();
  if(error){
    await storageCall({action:'delete',storageKey:signed.storageKey}).catch(()=>{});
    throw error;
  }
  return data;
};
window.studioStorageCall = storageCall;

'''
if 'window.studioUploadMedia = async function' not in s:
    s = s.replace(marker, helper + marker, 1)
p.write_text(s, encoding='utf-8')

# 2) Recent works: use the main panel uploader, not a parallel Neon client/storage implementation.
p = Path('recent-works-admin.js')
s = p.read_text(encoding='utf-8')
old = "for(const original of valid){const file=await optimizeImage(original);const signed=await storageCall({action:'presign',category:(mediaWorkCategory || categories[0]?.slug || 'portfolio-casamentos'),fileName:file.name,contentType:file.type});const put=await fetch(signed.uploadUrl,{method:'PUT',headers:{'Content-Type':file.type},body:file});if(!put.ok)throw new Error(`Não foi possível enviar ${original.name}.`);const {data:inserted,error}=await neon.from('site_images').insert({storage_key:signed.storageKey,public_url:signed.publicUrl,category:RECENT_MEDIA_CATEGORY,alt_text:'',sort_order:order,is_visible:true,is_cover:false,mime_type:file.type,bytes:file.size}).select('id').single();if(error){await storageCall({action:'delete',storageKey:signed.storageKey}).catch(()=>{});throw error;}const {error:linkError}=await neon.from('recent_work_media').insert({recent_work_id:mediaWorkId,media_id:inserted.id,sort_order:order,is_cover:false});if(linkError){await neon.from('site_images').delete().eq('id',inserted.id);await storageCall({action:'delete',storageKey:signed.storageKey}).catch(()=>{});throw linkError;}done++;order++;setMediaStatus(`Enviando ${done} de ${valid.length}…`);}"
new = "for(const original of valid){const uploader=window.studioUploadMedia;if(typeof uploader!=='function')throw new Error('O uploader principal do painel não está disponível. Recarregue a página.');const inserted=await uploader({file:original,storageCategory:(mediaWorkCategory || categories[0]?.slug || 'portfolio-casamentos'),databaseCategory:RECENT_MEDIA_CATEGORY,altText:'',sortOrder:order});const {error:linkError}=await neon.from('recent_work_media').insert({recent_work_id:mediaWorkId,media_id:inserted.id,sort_order:order,is_cover:false});if(linkError){await neon.from('site_images').delete().eq('id',inserted.id);if(inserted.storage_key&&typeof window.studioStorageCall==='function')await window.studioStorageCall({action:'delete',storageKey:inserted.storage_key}).catch(()=>{});throw linkError;}done++;order++;setMediaStatus(`Enviando ${done} de ${valid.length}…`);}"
if old not in s:
    raise SystemExit('recent upload loop not found')
s = s.replace(old, new, 1)
s = s.replace("if(key&&!key.startsWith('legacy:'))await storageCall({action:'delete',storageKey:key}).catch(()=>{});", "if(key&&!key.startsWith('legacy:')){const deleter=window.studioStorageCall||storageCall;await deleter({action:'delete',storageKey:key}).catch(()=>{});}", 1)
p.write_text(s, encoding='utf-8')

# 3) Home: recent work media is authoritative. Never borrow media from Portfolio.
p = Path('script.js')
s = p.read_text(encoding='utf-8')
pattern = re.compile(r"\s*let itens = proprias;\s*if \(!itens\.length\) \{\s*const remoto = await midiasDoPainel\(t\.gallery_category\);\s*if \(!remoto\.ok \|\| !remoto\.items\.length\) return null;\s*itens = remoto\.items;\s*\}")
replacement = "\n      const itens = proprias;\n      // Trabalhos recentes usam apenas suas próprias mídias. A categoria serve para classificação,\n      // nunca como fonte automática de fotos do Portfólio.\n      if (!itens.length) return null;"
s2, count = pattern.subn(replacement, s, count=1)
if count != 1:
    raise SystemExit('script.js portfolio fallback block not found')
p.write_text(s2, encoding='utf-8')
