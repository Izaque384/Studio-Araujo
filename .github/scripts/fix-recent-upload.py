from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly 1 match, found {count}')
    return text.replace(old, new, 1)

admin_path = Path('admin.js')
recent_path = Path('recent-works-admin.js')
admin = admin_path.read_text(encoding='utf-8')
recent = recent_path.read_text(encoding='utf-8')

admin = admin.replace("@neondatabase/neon-js@latest?bundle", "@neondatabase/neon-js@0.7.0-beta?bundle")
recent = recent.replace("@neondatabase/neon-js@latest?bundle", "@neondatabase/neon-js@0.7.0-beta?bundle")

admin = replace_once(
    admin,
    "let categories=[], queueEntries=[], currentUser=null, allMedia=[], currentUploadArea='portfolio', currentLibraryArea='all', currentOverviewArea='portfolio';",
    "let categories=[], queueEntries=[], currentUser=null, cachedAuthToken='', allMedia=[], currentUploadArea='portfolio', currentLibraryArea='all', currentOverviewArea='portfolio';",
    'admin state'
)

admin = replace_once(
    admin,
    "async function checkAdmin(){",
    """function tokenFromSession(sessionLike){
  return sessionLike?.session?.token||sessionLike?.data?.session?.token||sessionLike?.token||sessionLike?.access_token||'';
}
function tokenExpiresSoon(token){
  try{
    const part=String(token).split('.')[1];
    if(!part)return false;
    const normalized=part.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(part.length/4)*4,'=');
    const payload=JSON.parse(atob(normalized));
    return Number(payload?.exp||0)>0 && Number(payload.exp)<=Math.floor(Date.now()/1000)+45;
  }catch(_){return false;}
}
async function getUploadAuthToken(){
  if(cachedAuthToken&&!tokenExpiresSoon(cachedAuthToken))return cachedAuthToken;
  try{
    const session=await getSession();
    const token=tokenFromSession(session);
    if(token&&!tokenExpiresSoon(token)){cachedAuthToken=token;return token;}
  }catch(err){console.warn('Não foi possível reaproveitar o token da sessão.',err);}
  try{
    const token=await neon.auth.getJWTToken?.();
    if(token){cachedAuthToken=token;return token;}
  }catch(err){
    console.error('Falha ao renovar JWT para upload.',err);
    throw new Error('Não foi possível renovar a autenticação do upload. Recarregue o painel e entre novamente.');
  }
  throw new Error('Sessão de upload indisponível. Recarregue o painel e entre novamente.');
}
async function checkAdmin(){""",
    'auth helper insertion'
)

admin = replace_once(
    admin,
    "async function authorizeAndOpen(user){\n  if(!user)return false;\n  currentUser=user;",
    "async function authorizeAndOpen(user,sessionData=null){\n  if(!user)return false;\n  currentUser=user;\n  const sessionToken=tokenFromSession(sessionData);\n  if(sessionToken)cachedAuthToken=sessionToken;",
    'authorizeAndOpen'
)
admin = replace_once(admin, "await authorizeAndOpen(s.user);", "await authorizeAndOpen(s.user,s);", 'boot auth token capture')
admin = admin.replace("await authorizeAndOpen(user);", "await authorizeAndOpen(user,r?.data||null);")
admin = replace_once(
    admin,
    "  await neon.auth.signOut();\n  currentUser=null;\n  showAuth();",
    "  await neon.auth.signOut();\n  currentUser=null;\n  cachedAuthToken='';\n  showAuth();",
    'logout token reset'
)

old_storage = """async function storageCall(payload){
  const token=await neon.auth.getJWTToken?.();
  if(!token)throw new Error('Sessão expirada. Entre novamente.');
  const res=await fetch(STORAGE_FN,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(payload)});
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(data.error||'Falha no armazenamento.');
  return data;
}"""
new_storage = """async function storageCall(payload){
  const token=await getUploadAuthToken();
  let res;
  try{
    res=await fetch(STORAGE_FN,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(payload)});
  }catch(err){
    console.error('Falha de rede ao chamar o armazenamento.',err);
    throw new Error('Não foi possível acessar o serviço de armazenamento. Verifique a conexão e tente novamente.');
  }
  const raw=await res.text().catch(()=>'');
  let data={};
  try{data=raw?JSON.parse(raw):{};}catch(_){data={};}
  if(res.status===401)cachedAuthToken='';
  if(!res.ok){
    const detail=data?.error||raw||res.statusText||'falha sem detalhe';
    throw new Error(`Armazenamento HTTP ${res.status}: ${String(detail).slice(0,220)}`);
  }
  return data;
}"""
admin = replace_once(admin, old_storage, new_storage, 'storageCall')

old_uploader = """window.studioUploadMedia = async function({file: original, storageCategory, databaseCategory, altText = '', sortOrder = 1, recentWorkId = null}){
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
    created_by:currentUser?.id||null,
    recent_work_id:recentWorkId
  }).select('*').single();
  if(error){
    await storageCall({action:'delete',storageKey:signed.storageKey}).catch(()=>{});
    throw error;
  }
  return data;
};"""
new_uploader = """window.studioUploadMedia = async function({file: original, storageCategory, databaseCategory, altText = '', sortOrder = 1, recentWorkId = null}){
  if(!original)throw new Error('Arquivo não informado.');
  if(!storageCategory)throw new Error('Categoria de armazenamento não informada.');
  const file=await optimizeImage(original);
  let signed;
  try{
    signed=await storageCall({action:'presign',category:storageCategory,fileName:file.name,contentType:file.type});
  }catch(err){
    throw new Error(`Falha ao preparar o upload: ${err?.message||'erro desconhecido'}`);
  }
  if(!signed?.uploadUrl||!signed?.storageKey||!signed?.publicUrl)throw new Error('O serviço de armazenamento retornou uma resposta incompleta.');
  let put;
  try{
    put=await fetch(signed.uploadUrl,{method:'PUT',headers:{'Content-Type':file.type},body:file});
  }catch(err){
    console.error('Falha de rede no PUT do Storage.',err);
    throw new Error(`Falha de conexão ao enviar ${original.name} para o Storage.`);
  }
  if(!put.ok){
    const detail=await put.text().catch(()=>'');
    throw new Error(`Storage recusou ${original.name} (HTTP ${put.status})${detail?`: ${detail.slice(0,180)}`:''}`);
  }
  const row={
    storage_key:signed.storageKey,
    public_url:signed.publicUrl,
    category:databaseCategory||storageCategory,
    alt_text:altText,
    sort_order:sortOrder,
    is_visible:true,
    is_cover:false,
    mime_type:file.type,
    bytes:file.size,
    created_by:currentUser?.id||null,
    recent_work_id:recentWorkId
  };
  const {error}=await neon.from('site_images').insert(row);
  if(error){
    await storageCall({action:'delete',storageKey:signed.storageKey}).catch(()=>{});
    const detail=error?.message||error?.details||error?.hint||'erro desconhecido';
    throw new Error(`Falha ao registrar a mídia no banco: ${detail}`);
  }
  return row;
};"""
admin = replace_once(admin, old_uploader, new_uploader, 'shared uploader')

old_recent_upload = """  try{
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
  }catch(err){console.error('Upload de trabalho recente falhou',err);setMediaStatus(err?.message||'Não foi possível enviar as mídias.','err');}"""
new_recent_upload = """  try{
    // A grade já contém as mídias atuais do trabalho. Usar seus valores elimina
    // a antiga consulta extra ao Data API que falhava com HTTP 404 antes do upload.
    const visibleOrders=[...document.querySelectorAll('#recentMediaGrid .recent-media-order')]
      .map(input=>Number(input.value||0)).filter(Number.isFinite);
    let order=visibleOrders.length?Math.max(...visibleOrders)+1:1;
    for(const original of valid){
      const uploader=window.studioUploadMedia;
      if(typeof uploader!=='function')throw new Error('O uploader principal do painel não está disponível. Recarregue a página.');
      await uploader({file:original,storageCategory:(mediaWorkCategory||categories[0]?.slug||'portfolio-casamentos'),databaseCategory:RECENT_MEDIA_CATEGORY,altText:'',sortOrder:order,recentWorkId:mediaWorkId});
      done++;order++;setMediaStatus(`Enviando ${done} de ${valid.length}…`);
    }
    setMediaStatus(`${done} arquivo${done===1?'':'s'} enviado${done===1?'':'s'}${invalid?` · ${invalid} ignorado${invalid===1?'':'s'}`:''}.`,'ok');
    await loadWorkMedia();
  }catch(err){
    console.error('Upload de trabalho recente falhou',err);
    setMediaStatus(`Falha no upload: ${err?.message||'erro desconhecido'}`,'err');
  }"""
recent = replace_once(recent, old_recent_upload, new_recent_upload, 'recent upload preflight removal')

admin_path.write_text(admin, encoding='utf-8')
recent_path.write_text(recent, encoding='utf-8')
print('patched admin.js and recent-works-admin.js')
