from pathlib import Path
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
if 'neon.rpc("submit_testimonial"' not in (ROOT/'depoimentos.js').read_text(encoding='utf-8'): errors.append('Depoimentos: submissão moderada via RPC ausente')
depoimentos=(ROOT/'depoimentos.js').read_text(encoding='utf-8')
if 'DEPOIMENTOS_FIXOS' in depoimentos: errors.append('Depoimentos: conteúdo fixo voltou ao JavaScript')
if '.from("site_testimonials").insert' in depoimentos or ".from('site_testimonials').insert" in depoimentos: errors.append('Depoimentos: fallback de INSERT público direto reintroduzido')
if not (ROOT/'admin-testimonials.js').exists(): errors.append('Painel: módulo de moderação de depoimentos ausente')

services=(ROOT/'servicos.html').read_text(encoding='utf-8')
data=(ROOT/'dados-servicos.js').read_text(encoding='utf-8')
service_keys=set(re.findall(r'data-service="([^"]+)"',services))
retired_product_services={'albuns','luva','maleta','caixa'}
reintroduced=sorted(retired_product_services & service_keys)
if reintroduced: errors.append('Serviços de produto reintroduzidos em Serviços: '+', '.join(reintroduced))
if 'id: "produtos"' in data or 'grupo: "produtos"' in data: errors.append('Agendamento: grupo de produtos reintroduzido')
if re.search(r'^\s*batizado\s*:',data,re.M): errors.append('Serviços: Batizado órfão reintroduzido sem pacote comercial')
package_match=re.search(r'const servicePackages\s*=\s*\{(.*?)\n\};',data,re.S)
if package_match:
    package_keys=set(re.findall(r'^\s*["\']?([a-z0-9-]+)["\']?\s*:',package_match.group(1),re.M))
    missing=sorted(service_keys-package_keys)
    if missing: print('AVISO: serviços sem pacote comercial: '+', '.join(missing))

for js in ['script.js','servicos.js','dados-servicos.js','agenda.js','depoimentos.js','recent-works.js','admin.js','admin-testimonials.js','recent-works-admin.js']:
    r=subprocess.run(['node','--check',str(ROOT/js)],capture_output=True,text=True)
    if r.returncode: errors.append(f'{js}: falha de sintaxe: {r.stderr.strip()}')

if errors:
    print('\n'.join('ERRO: '+e for e in errors)); sys.exit(1)
print('Validação estrutural concluída com sucesso.')
