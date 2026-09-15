from pathlib import Path
import re

PRODUCT_KEYS = ('albuns','luva','maleta','caixa')

# 1) Serviços: remove seção inteira de Produtos e limpa SEO.
p = Path('servicos.html')
h = p.read_text(encoding='utf-8')
start_marker = '      <div class="section-head reveal" style="margin-top:110px;">'
start = h.find(start_marker)
if start < 0:
    raise SystemExit('Seção Produtos não encontrada em servicos.html')
if '          Produtos\n' not in h[start:start+1200]:
    raise SystemExit('Marcador encontrado não corresponde à seção Produtos')
end_marker = '\n    </div>\n  </section>\n</main>'
end = h.find(end_marker, start)
if end < 0:
    raise SystemExit('Fim da seção Produtos não encontrado')
h = h[:start] + h[end:]
h = h.replace(
    'Casamentos, gestantes, formaturas, chá revelação, moda e álbuns fotográficos — Studio Araújo Fotografia.',
    'Casamentos, gestantes, formaturas, aniversários, moda e ensaios fotográficos — Studio Araújo Fotografia.'
)
for key in PRODUCT_KEYS:
    if f'data-service="{key}"' in h or f'data-gallery="{key}"' in h:
        raise SystemExit(f'Serviço de produto ainda presente em servicos.html: {key}')
p.write_text(h, encoding='utf-8')

# 2) Fonte única comercial/agendamento: remove pacotes, labels, grupo e metadados de produtos.
p = Path('dados-servicos.js')
d = p.read_text(encoding='utf-8')
start = d.find('\n  albuns: {')
end = d.find('\n\n  // ✎ Para adicionar', start)
if start < 0 or end < 0:
    raise SystemExit('Bloco de pacotes de produtos não encontrado')
d = d[:start] + '\n' + d[end:]
for line in (
    '  albuns: "Álbuns Fotográficos",\n',
    '  luva: "Luva / Estojo",\n',
    '  maleta: "Maleta / Estojo",\n',
    '  caixa: "Caixa para Fotos"\n',
):
    d = d.replace(line, '')
d = d.replace('  { id: "produtos", titulo: "Álbuns e produtos", desc: "Álbum, luva, maleta e caixa para fotos" }\n', '')
d = d.replace('  { id: "produtos", titulo: "Álbuns e produtos", desc: "Álbum, luva, maleta e caixa para fotos" },\n', '')
for line in (
    '  albuns: { nome: "Álbum Fotográfico", grupo: "produtos", produto: true },\n',
    '  luva: { nome: "Luva / Estojo", grupo: "produtos", produto: true },\n',
    '  maleta: { nome: "Maleta / Estojo", grupo: "produtos", produto: true },\n',
    '  caixa: { nome: "Caixa para Fotos", grupo: "produtos", produto: true }\n',
    '  caixa: { nome: "Caixa para Fotos", grupo: "produtos", produto: true },\n',
):
    d = d.replace(line, '')
# Remove também a oferta avulsa de álbum embutida no pacote de gestante.
d = d.replace(' · Álbum: sob consulta', '')
for key in PRODUCT_KEYS:
    if re.search(rf'^\s*["\']?{re.escape(key)}["\']?\s*:', d, re.M):
        raise SystemExit(f'Chave de produto ainda presente em dados-servicos.js: {key}')
if 'grupo: "produtos"' in d or 'Álbuns e produtos' in d:
    raise SystemExit('Grupo de produtos ainda presente em dados-servicos.js')
p.write_text(d, encoding='utf-8')

# 3) Agendamento: elimina todos os desvios especiais que existiam só para produtos.
p = Path('agenda.js')
a = p.read_text(encoding='utf-8')
replacements = {
    'function fluxoAtual() { return ehProduto() ? [1, 2, 3, 5, 6] : [1, 2, 3, 4, 5, 6]; }': 'function fluxoAtual() { return [1, 2, 3, 4, 5, 6]; }',
    'const ehProduto = () => !!(servicoAtual() && servicoAtual().produto);\n': '',
    'if (!s || ehProduto()) return false;': 'if (!s) return false;',
    '  if (s.produto) return "Produto personalizado";\n': '',
    '    const esperaFoto=s.grupo!=="produtos";': '    const esperaFoto=true;',
    '    b.addEventListener("click",()=>{ st.pacote=o; st.data=null; st.hora=null; montarPacotes(); atualizar(); if(ehProduto()) mostrarEtapa(5, true); else seguir(); });': '    b.addEventListener("click",()=>{ st.pacote=o; st.data=null; st.hora=null; montarPacotes(); atualizar(); seguir(); });',
    '  if(ehProduto()) return true;\n': '',
    '  if(n===4)return ehProduto() || (!!st.data && (!precisaHorarioSelecionado() || !!st.hora) && validarEscolhaAgenda());': '  if(n===4)return !!st.data && (!precisaHorarioSelecionado() || !!st.hora) && validarEscolhaAgenda();',
    '+(ehProduto()?"Resumo do pedido":"Resumo do agendamento")+': '+"Resumo do agendamento"+',
    '+(ehProduto()?"01":"02")+': '+"02"+',
    '  // Produtos não passam pelo calendário.\n  if(ehProduto()&&n===4)n=5;\n': '',
    'function seguir(){if(travaAuto)return;setTimeout(()=>{if(etapaCompleta(etapa)&&etapa<6)mostrarEtapa(ehProduto()&&etapa===3?5:etapa+1,true);},220);}': 'function seguir(){if(travaAuto)return;setTimeout(()=>{if(etapaCompleta(etapa)&&etapa<6)mostrarEtapa(etapa+1,true);},220);}',
    'ehProduto()?"Gostaria de solicitar um produto. 📸":"Gostaria de agendar uma sessão. 📸"': '"Gostaria de agendar uma sessão. 📸"',
    '  if(!ehProduto()){linhas.push("• Data: "+dataPorExtenso());linhas.push("• Horário: "+(precisaHorarioSelecionado()?st.hora:"a combinar"));}': '  linhas.push("• Data: "+dataPorExtenso());linhas.push("• Horário: "+(precisaHorarioSelecionado()?st.hora:"a combinar"));',
    '  if(!ehProduto() && !validarEscolhaAgenda())': '  if(!validarEscolhaAgenda())',
    'el.voltar.addEventListener("click",()=>{if(etapa===5&&ehProduto())mostrarEtapa(3,true);else if(etapa>1)mostrarEtapa(etapa-1,true);});': 'el.voltar.addEventListener("click",()=>{if(etapa>1)mostrarEtapa(etapa-1,true);});',
    'if((tinhaData&&!st.data)||(tinhaHora&&!st.hora)){if(!ehProduto())mostrarEtapa(4,true);}': 'if((tinhaData&&!st.data)||(tinhaHora&&!st.hora)){mostrarEtapa(4,true);}',
}
for old,new in replacements.items():
    if old in a:
        a = a.replace(old,new)
# Remove ícone exclusivo de produtos.
a = re.sub(r'^\s*produtos:\s*\'<rect[^\n]+\n', '', a, flags=re.M)
# A revisão passa a ter sempre a seção de data/horário.
a = a.replace('  if(!ehProduto()){\n', '  {\n')
if 'ehProduto' in a or 'grupo!=="produtos"' in a or 'Produto personalizado' in a:
    raise SystemExit('Lógica de produtos ainda presente em agenda.js')
p.write_text(a, encoding='utf-8')

# 4) Admin: esconde categorias/mídias desses serviços sem apagar nada do Neon/Storage.
p = Path('admin.js')
ad = p.read_text(encoding='utf-8')
const_marker = "const MAX_VIDEO_BYTES = 100 * 1024 * 1024;\n"
const_insert = const_marker + "const RETIRED_PRODUCT_SERVICES = new Set(['albuns','luva','maleta','caixa']);\n"
if 'RETIRED_PRODUCT_SERVICES' not in ad:
    if const_marker not in ad: raise SystemExit('Ponto de inserção do filtro do admin não encontrado')
    ad = ad.replace(const_marker, const_insert, 1)
ad = ad.replace('  categories=data||[];', '  categories=(data||[]).filter(c=>!RETIRED_PRODUCT_SERVICES.has(c.slug));')
ad = ad.replace('  allMedia=data||[];', '  allMedia=(data||[]).filter(m=>!RETIRED_PRODUCT_SERVICES.has(m.category));')
if 'categories=(data||[]).filter(c=>!RETIRED_PRODUCT_SERVICES.has(c.slug));' not in ad or 'allMedia=(data||[]).filter(m=>!RETIRED_PRODUCT_SERVICES.has(m.category));' not in ad:
    raise SystemExit('Filtro dos serviços aposentados não foi aplicado no admin')
p.write_text(ad, encoding='utf-8')

# 5) Mobile: desfaz somente a exibição do texto "Ver fotos" e intensifica o escurecimento do CTA.
p = Path('styles.css')
s = p.read_text(encoding='utf-8')
marker = '@media (max-width:600px){\n  /* O botão mobile volta a mostrar câmera + texto + contador. */'
pos = s.find(marker)
if pos >= 0:
    brace = s.find('{', pos)
    depth = 0
    end = None
    for i in range(brace, len(s)):
        if s[i] == '{': depth += 1
        elif s[i] == '}':
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    if end is None: raise SystemExit('Não foi possível fechar o bloco mobile de Ver fotos')
    s = s[:pos] + s[end:]
if 'O botão mobile volta a mostrar câmera + texto + contador.' in s:
    raise SystemExit('Override do texto Ver fotos ainda presente')
p.write_text(s, encoding='utf-8')

p = Path('script.js')
j = p.read_text(encoding='utf-8')
cta_repls = {
    "linear-gradient(rgba(7,7,6,.18),rgba(7,7,6,.18)),linear-gradient(180deg,rgba(9,7,5,.03) 0%,rgba(9,7,5,.06) 24%,rgba(9,7,5,.22) 44%,rgba(9,7,5,.58) 66%,rgba(9,7,5,.88) 84%,#090705 100%)": "linear-gradient(rgba(5,5,4,.42),rgba(5,5,4,.42)),linear-gradient(180deg,rgba(9,7,5,.12) 0%,rgba(9,7,5,.18) 24%,rgba(9,7,5,.38) 44%,rgba(9,7,5,.70) 66%,rgba(9,7,5,.92) 84%,#090705 100%)",
    "linear-gradient(180deg,rgba(14,13,11,.05) 0%,rgba(14,13,11,.04) 18%,rgba(14,13,11,.16) 36%,rgba(14,13,11,.48) 56%,rgba(14,13,11,.82) 74%,rgba(14,13,11,.97) 100%)": "linear-gradient(180deg,rgba(10,9,8,.18) 0%,rgba(10,9,8,.20) 18%,rgba(10,9,8,.36) 36%,rgba(10,9,8,.66) 56%,rgba(10,9,8,.91) 74%,rgba(9,8,7,.995) 100%)",
    "linear-gradient(rgba(7,7,6,.22),rgba(7,7,6,.22)),linear-gradient(180deg,rgba(9,7,5,.03) 0%,rgba(9,7,5,.08) 24%,rgba(9,7,5,.28) 46%,rgba(9,7,5,.62) 68%,rgba(9,7,5,.90) 84%,#090705 100%)": "linear-gradient(rgba(5,5,4,.48),rgba(5,5,4,.48)),linear-gradient(180deg,rgba(9,7,5,.14) 0%,rgba(9,7,5,.22) 24%,rgba(9,7,5,.44) 46%,rgba(9,7,5,.74) 68%,rgba(9,7,5,.94) 84%,#090705 100%)",
    "linear-gradient(180deg,rgba(14,13,11,.05) 0%,rgba(14,13,11,.04) 20%,rgba(14,13,11,.20) 42%,rgba(14,13,11,.55) 60%,rgba(14,13,11,.85) 78%,rgba(14,13,11,.98) 100%)": "linear-gradient(180deg,rgba(10,9,8,.20) 0%,rgba(10,9,8,.22) 20%,rgba(10,9,8,.42) 42%,rgba(10,9,8,.72) 60%,rgba(10,9,8,.93) 78%,rgba(9,8,7,.998) 100%)",
}
for old,new in cta_repls.items():
    if old not in j:
        raise SystemExit('Trecho esperado do CTA não encontrado para escurecimento')
    j = j.replace(old,new,1)
p.write_text(j, encoding='utf-8')

# 6) Validador permanente: impede que os quatro serviços de produto voltem ao catálogo por engano.
p = Path('scripts/validate_site.py')
v = p.read_text(encoding='utf-8')
needle = "service_keys=set(re.findall(r'data-service=\"([^\"]+)\"',services))\n"
addition = needle + "retired_product_services={'albuns','luva','maleta','caixa'}\nreintroduced=sorted(retired_product_services & service_keys)\nif reintroduced: errors.append('Serviços de produto reintroduzidos em Serviços: '+', '.join(reintroduced))\nif 'id: \"produtos\"' in data or 'grupo: \"produtos\"' in data: errors.append('Agendamento: grupo de produtos reintroduzido')\n"
if 'retired_product_services=' not in v:
    if needle not in v: raise SystemExit('Ponto do validador não encontrado')
    v = v.replace(needle, addition, 1)
p.write_text(v, encoding='utf-8')

print('Product services removed from visible catalog without deleting stored media.')
