from pathlib import Path

# --- admin.html ---
p = Path('admin.html')
s = p.read_text(encoding='utf-8')
old = '''      <form id="loginForm" class="login-form">
        <label>E-mail
          <input id="loginEmail" type="email" autocomplete="email" value="michelearaujofotografia@gmail.com" required>
        </label>
        <label>Senha
          <input id="loginPassword" type="password" autocomplete="current-password" required>
        </label>
        <button class="btn" type="submit">Entrar com e-mail</button>
      </form>
      <p id="authMsg" class="msg" role="status" aria-live="polite"></p>'''
new = '''      <form id="loginForm" class="login-form">
        <label>E-mail
          <input id="loginEmail" type="email" autocomplete="email" value="michelearaujofotografia@gmail.com" required>
        </label>
        <label>Senha
          <input id="loginPassword" type="password" autocomplete="current-password" required>
        </label>
        <button class="btn" type="submit">Entrar com e-mail</button>
      </form>

      <div class="otp-login">
        <button type="button" id="otpStartBtn" class="btn btn-ghost otp-start">Entrar com código por e-mail</button>
        <form id="otpForm" class="otp-form" hidden>
          <p class="otp-copy">Enviaremos um código de acesso para o e-mail informado acima.</p>
          <label>Código de acesso
            <input id="otpCode" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="8" placeholder="Digite o código" required>
          </label>
          <button type="submit" id="otpConfirmBtn" class="btn">Confirmar código</button>
        </form>
      </div>
      <p id="authMsg" class="msg" role="status" aria-live="polite"></p>'''
if old not in s:
    raise SystemExit('admin.html auth block not found')
p.write_text(s.replace(old,new,1), encoding='utf-8')

# --- admin.css ---
p = Path('admin.css')
s = p.read_text(encoding='utf-8')
anchor = ".msg.warn{color:#d8b77b}\n"
addition = '''.msg.warn{color:#d8b77b}\n\n.otp-login{margin-top:12px;display:grid;gap:12px}\n.otp-start{width:100%}\n.otp-form{display:grid;gap:12px;padding:14px;border:1px solid rgba(201,162,75,.14);border-radius:12px;background:rgba(201,162,75,.025);text-align:left}\n.otp-form[hidden]{display:none}\n.otp-form label{display:grid;gap:7px;color:var(--muted);font-size:.82rem}\n.otp-form input{width:100%;background:var(--card-2);border:1px solid var(--line);border-radius:10px;color:var(--cream);padding:11px 12px;outline:none}\n.otp-form input:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(201,162,75,.08)}\n.otp-copy{margin:0;color:var(--muted);font-size:.8rem;line-height:1.5}\n'''
if anchor not in s:
    raise SystemExit('admin.css anchor not found')
p.write_text(s.replace(anchor,addition,1), encoding='utf-8')

# --- admin.js ---
p = Path('admin.js')
s = p.read_text(encoding='utf-8')

old_import = "import { createClient, BetterAuthVanillaAdapter } from 'https://esm.sh/@neondatabase/neon-js@0.7.0-beta?bundle';"
new_import = "import { createClient } from 'https://esm.sh/@neondatabase/neon-js@latest?bundle';"
if old_import not in s:
    raise SystemExit('admin.js import not found')
s = s.replace(old_import, new_import, 1)

old_client = "const neon = createClient({ auth: { adapter: BetterAuthVanillaAdapter(), url: AUTH_URL }, dataApi: { url: DATA_API_URL } });"
new_client = "const neon = createClient({ auth: { url: AUTH_URL }, dataApi: { url: DATA_API_URL } });"
if old_client not in s:
    raise SystemExit('admin.js client init not found')
s = s.replace(old_client, new_client, 1)

old_refs = "const loginForm=$('loginForm'), googleBtn=$('googleBtn'), logoutBtn=$('logoutBtn');"
new_refs = "const loginForm=$('loginForm'), googleBtn=$('googleBtn'), logoutBtn=$('logoutBtn');\nconst otpStartBtn=$('otpStartBtn'), otpForm=$('otpForm'), otpCode=$('otpCode'), otpConfirmBtn=$('otpConfirmBtn');"
if old_refs not in s:
    raise SystemExit('admin.js refs block not found')
s = s.replace(old_refs, new_refs, 1)

start = s.find("async function getSession(){")
end = s.find("\nasync function loadCategories(){", start)
if start == -1 or end == -1:
    raise SystemExit('admin.js auth section not found')

new_auth = r'''async function getSession(){
  const r=await neon.auth.getSession();
  if(r?.error)throw new Error(r.error.message||'Não foi possível consultar a sessão.');
  return r?.data||r||null;
}
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
async function waitForSession(attempts=12,delay=450){
  let lastError=null;
  for(let i=0;i<attempts;i++){
    try{
      const s=await getSession();
      if(s?.user)return s;
    }catch(e){lastError=e;console.warn('Tentativa de recuperar sessão falhou.',e);}
    if(i<attempts-1)await sleep(delay);
  }
  if(lastError)console.warn('Sessão não recuperada após as tentativas.',lastError);
  return null;
}
async function checkAdmin(){
  const {data,error}=await neon.from('site_admins').select('user_id,email').limit(1);
  if(error){console.error('Falha ao verificar administrador.',error);return false;}
  return Array.isArray(data)&&data.length>0;
}
async function authorizeAndOpen(user){
  if(!user)return false;
  currentUser=user;
  if(!(await checkAdmin())){
    await neon.auth.signOut().catch(()=>{});
    currentUser=null;
    showAuth();
    setMsg(authMsg,'Esta conta não tem acesso administrativo.','error');
    return false;
  }
  setMsg(authMsg,'');
  await showPanel();
  return true;
}

async function boot(){
  const params=new URLSearchParams(location.search);
  const googleReturn=params.get('auth')==='google'||sessionStorage.getItem('studio-admin-oauth-pending')==='1';
  const googleError=params.get('authError')==='google';
  showAuth();
  try{
    if(googleError){
      sessionStorage.removeItem('studio-admin-oauth-pending');
      history.replaceState({},'', '/painel');
      setMsg(authMsg,'O Google não concluiu o acesso. Tente novamente ou use o código por e-mail.','error');
      return;
    }
    if(googleReturn)setMsg(authMsg,'Concluindo acesso com Google…');
    const s=googleReturn?await waitForSession(14,500):await waitForSession(2,250);
    if(!s?.user){
      if(googleReturn){
        sessionStorage.removeItem('studio-admin-oauth-pending');
        history.replaceState({},'', '/painel');
        setMsg(authMsg,'O Google autenticou sua conta, mas o navegador não recuperou a sessão. Use “Entrar com código por e-mail” abaixo.','warn');
      }
      return;
    }
    sessionStorage.removeItem('studio-admin-oauth-pending');
    if(params.has('auth')||params.has('authError'))history.replaceState({},'', '/painel');
    await authorizeAndOpen(s.user);
  }catch(e){
    console.error(e);
    showAuth();
    setMsg(authMsg,e?.message||'Não foi possível validar a sessão. Tente novamente.','error');
  }
}
function showAuth(){authView.hidden=false;panelView.hidden=true;}
async function showPanel(){
  authView.hidden=true;
  panelView.hidden=false;
  $('welcome').textContent=currentUser?.email||'';
  try{
    await loadCategories();
    await loadMedia();
  }catch(e){
    console.error('Falha ao carregar dados do painel.',e);
    setMsg(libraryMsg,'Você entrou, mas alguns dados do painel não puderam ser carregados. Clique em “Atualizar biblioteca”.','error');
  }
}

googleBtn.addEventListener('click',async()=>{
  setMsg(authMsg,'Abrindo o Google…');
  googleBtn.disabled=true;
  try{
    sessionStorage.setItem('studio-admin-oauth-pending','1');
    const r=await neon.auth.signIn.social({
      provider:'google',
      callbackURL:location.origin+'/painel?auth=google',
      errorCallbackURL:location.origin+'/painel?authError=google'
    });
    if(r?.error)throw new Error(r.error.message||'Não foi possível iniciar o login com Google.');
  }catch(e){
    sessionStorage.removeItem('studio-admin-oauth-pending');
    console.error(e);
    setMsg(authMsg,e?.message||'Não foi possível iniciar o login com Google.','error');
    googleBtn.disabled=false;
  }
});

loginForm.addEventListener('submit',async e=>{
  e.preventDefault();
  setMsg(authMsg,'Entrando…');
  const submit=loginForm.querySelector('button[type="submit"]');
  submit.disabled=true;
  try{
    const email=$('loginEmail').value.trim(),password=$('loginPassword').value;
    const r=await neon.auth.signIn.email({email,password});
    if(r?.error)throw new Error(r.error.message||'Credenciais inválidas.');
    const user=r?.data?.user||(await waitForSession(6,300))?.user;
    if(!user)throw new Error('A autenticação foi aceita, mas a sessão não pôde ser recuperada.');
    await authorizeAndOpen(user);
  }catch(err){
    setMsg(authMsg,err?.message||'Não foi possível entrar.','error');
  }finally{submit.disabled=false;}
});

otpStartBtn.addEventListener('click',async()=>{
  const email=$('loginEmail').value.trim();
  if(!email){setMsg(authMsg,'Informe o e-mail para receber o código.','error');return;}
  otpStartBtn.disabled=true;
  setMsg(authMsg,'Enviando código de acesso…');
  try{
    const r=await neon.auth.emailOtp.sendVerificationOtp({email,type:'sign-in'});
    if(r?.error)throw new Error(r.error.message||'Não foi possível enviar o código.');
    otpForm.hidden=false;
    otpCode.value='';
    otpCode.focus();
    setMsg(authMsg,'Código enviado. Verifique sua caixa de entrada e o spam.','success');
  }catch(err){
    console.error(err);
    setMsg(authMsg,err?.message||'Não foi possível enviar o código.','error');
  }finally{otpStartBtn.disabled=false;}
});

otpForm.addEventListener('submit',async e=>{
  e.preventDefault();
  const email=$('loginEmail').value.trim(),otp=otpCode.value.trim();
  if(!otp)return;
  otpConfirmBtn.disabled=true;
  setMsg(authMsg,'Validando código…');
  try{
    const r=await neon.auth.signIn.emailOtp({email,otp});
    if(r?.error)throw new Error(r.error.message||'Código inválido ou expirado.');
    const user=r?.data?.user||(await waitForSession(6,300))?.user;
    if(!user)throw new Error('O código foi aceito, mas a sessão não pôde ser recuperada.');
    otpForm.hidden=true;
    await authorizeAndOpen(user);
  }catch(err){
    console.error(err);
    setMsg(authMsg,err?.message||'Não foi possível validar o código.','error');
  }finally{otpConfirmBtn.disabled=false;}
});

logoutBtn.addEventListener('click',async()=>{
  await neon.auth.signOut();
  currentUser=null;
  showAuth();
});
'''

s = s[:start] + new_auth + s[end:]
p.write_text(s, encoding='utf-8')
