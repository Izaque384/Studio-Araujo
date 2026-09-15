from pathlib import Path
from PIL import Image, ImageFilter

# 1 e 2 — indicador discreto + carrossel mais calmo/sem timers duplicados.
index = Path('index.html')
h = index.read_text(encoding='utf-8')
old = '''        </div>\n        <div class="carousel-dots" id="testiDots"></div>'''
new = '''        </div>\n        <div class="testi-swipe-hint" id="testiSwipeHint" aria-hidden="true">\n          <span class="testi-swipe-mark" aria-hidden="true">↔</span>\n          <span>Deslize para ver mais</span>\n        </div>\n        <div class="carousel-dots" id="testiDots"></div>'''
if 'id="testiSwipeHint"' not in h:
    if old not in h:
        raise SystemExit('Ponto de inserção do indicador de swipe não encontrado')
    h = h.replace(old, new, 1)
index.write_text(h, encoding='utf-8')

styles = Path('styles.css')
s = styles.read_text(encoding='utf-8')
marker = '/* ---------- DEPOIMENTOS MOBILE · DICA DE SWIPE ---------- */'
if marker not in s:
    s += r'''

/* ---------- DEPOIMENTOS MOBILE · DICA DE SWIPE ---------- */
.testi-swipe-hint{display:none;}
@media (max-width:860px){
  .testi-swipe-hint{
    display:flex;
    align-items:center;
    justify-content:center;
    gap:7px;
    min-height:20px;
    margin:13px auto 0;
    color:rgba(243,236,220,.48);
    font-size:.64rem;
    font-weight:400;
    letter-spacing:.08em;
    text-transform:uppercase;
    transition:opacity .35s ease, transform .35s ease;
  }
  .testi-swipe-hint[hidden]{display:none!important;}
  .testi-swipe-hint.used{
    opacity:0;
    transform:translateY(-2px);
    pointer-events:none;
  }
  .testi-swipe-mark{
    display:inline-block;
    color:rgba(230,200,120,.64);
    font-size:.9rem;
    line-height:1;
    animation:testiSwipeNudge 1.8s ease-in-out 2;
  }
  @keyframes testiSwipeNudge{
    0%,100%{transform:translateX(0)}
    35%{transform:translateX(-3px)}
    70%{transform:translateX(3px)}
  }
}
@media (prefers-reduced-motion:reduce){
  .testi-swipe-mark{animation:none!important;}
}
'''
styles.write_text(s, encoding='utf-8')

dep = Path('depoimentos.js')
d = dep.read_text(encoding='utf-8')

const_old = 'const carrosselNext = document.getElementById("testiNext");\nconst contadorEl'
const_new = 'const carrosselNext = document.getElementById("testiNext");\nconst swipeHint = document.getElementById("testiSwipeHint");\nconst contadorEl'
if 'const swipeHint = document.getElementById("testiSwipeHint")' not in d:
    if const_old not in d:
        raise SystemExit('Constantes do carrossel não encontradas')
    d = d.replace(const_old, const_new, 1)

old_hidden = '''  if (carrosselPrev) carrosselPrev.hidden = sozinho;\n  if (carrosselNext) carrosselNext.hidden = sozinho;\n  carrosselDots.hidden = sozinho;'''
new_hidden = '''  if (carrosselPrev) carrosselPrev.hidden = sozinho;\n  if (carrosselNext) carrosselNext.hidden = sozinho;\n  if (swipeHint) { swipeHint.hidden = sozinho; swipeHint.classList.remove("used"); }\n  carrosselDots.hidden = sozinho;'''
if old_hidden in d:
    d = d.replace(old_hidden, new_hidden, 1)
elif 'swipeHint.hidden = sozinho' not in d:
    raise SystemExit('Bloco de visibilidade do carrossel não encontrado')

old_auto = 'function iniciarAutoplay() { if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return; autoplayTimer = setInterval(avancar, 6000); }'
new_auto = '''function iniciarAutoplay() {\n  clearInterval(autoplayTimer);\n  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;\n  const delay = window.matchMedia?.("(max-width: 860px)").matches ? 12000 : 7000;\n  autoplayTimer = setInterval(avancar, delay);\n}'''
if old_auto in d:
    d = d.replace(old_auto, new_auto, 1)
elif 'const delay = window.matchMedia?.("(max-width: 860px)").matches ? 12000 : 7000' not in d:
    raise SystemExit('Função iniciarAutoplay não encontrada')

old_touch = '''  carrosselTrack.addEventListener("touchend", e => {\n    const dx = e.changedTouches[0].clientX - tx;\n    const dy = e.changedTouches[0].clientY - ty;\n    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) dx < 0 ? avancar() : voltar();\n    if (carrosselTotal > 1) iniciarAutoplay();\n  }, { passive: true });'''
new_touch = '''  carrosselTrack.addEventListener("touchend", e => {\n    const dx = e.changedTouches[0].clientX - tx;\n    const dy = e.changedTouches[0].clientY - ty;\n    const foiSwipe = Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy);\n    if (foiSwipe) {\n      dx < 0 ? avancar() : voltar();\n      swipeHint?.classList.add("used");\n    } else if (carrosselTotal > 1) {\n      iniciarAutoplay();\n    }\n  }, { passive: true });'''
if old_touch in d:
    d = d.replace(old_touch, new_touch, 1)
elif 'const foiSwipe = Math.abs(dx) > 42' not in d:
    raise SystemExit('Bloco touchend não encontrado')

dep.write_text(d, encoding='utf-8')

# 3 — CTA: recorte mobile dedicado, com mais pixels úteis e nitidez no enquadramento.
src = Path('assets/cta-final-hq.webp')
out = Path('assets/cta-final-mobile.webp')
with Image.open(src) as im:
    im = im.convert('RGB')
    w, hgt = im.size
    target_ratio = 0.60  # próximo da proporção real do card no celular
    crop_w = min(w, round(hgt * target_ratio))
    left = max(0, (w - crop_w) // 2)
    im = im.crop((left, 0, left + crop_w, hgt))
    target_w = 1200
    target_h = round(target_w / target_ratio)
    im = im.resize((target_w, target_h), Image.Resampling.LANCZOS)
    im = im.filter(ImageFilter.UnsharpMask(radius=1.0, percent=105, threshold=3))
    im.save(out, 'WEBP', quality=94, method=6)

script = Path('script.js')
j = script.read_text(encoding='utf-8')
repl = {
    "url('assets/cta-final-hq.webp') 50% 16%/auto 122% no-repeat": "url('assets/cta-final-mobile.webp') 50% 14%/cover no-repeat",
    "url('assets/cta-final-hq.webp') 50% 14%/auto 108% no-repeat": "url('assets/cta-final-mobile.webp') 50% 12%/cover no-repeat",
}
for old, new in repl.items():
    if old in j:
        j = j.replace(old, new, 1)
    elif new not in j:
        raise SystemExit(f'Trecho mobile do CTA não encontrado: {old}')
script.write_text(j, encoding='utf-8')

# 4 e 5 — botão Continuar menor e formulário mobile visualmente mais neutro.
agenda = Path('agendamento.css')
a = agenda.read_text(encoding='utf-8')
amarker = '/* ---------- AGENDAMENTO MOBILE · TOM NEUTRO E CTA COMPACTO ---------- */'
if amarker not in a:
    a += r'''

/* ---------- AGENDAMENTO MOBILE · TOM NEUTRO E CTA COMPACTO ---------- */
@media (max-width:700px){
  .booking-panel{
    border-color:rgba(243,236,220,.105) !important;
    background:
      radial-gradient(circle at 8% 0%,rgba(243,236,220,.025),transparent 31%),
      linear-gradient(180deg,rgba(21,20,18,.985),rgba(12,12,11,.995)) !important;
    box-shadow:0 24px 64px rgba(0,0,0,.32),inset 0 0 0 1px rgba(255,255,255,.012) !important;
  }
  .booking-panel::before{
    background:linear-gradient(90deg,transparent,rgba(243,236,220,.24),transparent) !important;
  }
  .booking-glow{
    background:radial-gradient(circle at 85% 0%,rgba(243,236,220,.035),transparent 54%) !important;
  }
  .bk-barra{
    background:rgba(243,236,220,.095) !important;
  }
  .bk-barra i{
    background:linear-gradient(90deg,#9b8557,#b49a62) !important;
  }
  .bk-tipo,
  .bk-servico,
  .bk-pacote,
  .svc-opt{
    border-color:rgba(243,236,220,.105) !important;
    background:rgba(255,255,255,.018) !important;
    box-shadow:inset 0 1px rgba(255,255,255,.012) !important;
  }
  .bk-tipo.selecionado,
  .bk-servico.selecionado,
  .bk-pacote.selecionado,
  .svc-opt.selected{
    border-color:rgba(230,200,120,.40) !important;
    background:rgba(243,236,220,.045) !important;
    box-shadow:none !important;
  }
  .bk-tipo-icone{
    border-color:rgba(243,236,220,.11) !important;
    background:rgba(255,255,255,.018) !important;
  }
  .bk-cal,
  .booking-input,
  .booking-select,
  .slot,
  .svc-info{
    border-color:rgba(243,236,220,.105) !important;
    background:rgba(7,7,7,.32) !important;
    box-shadow:none;
  }
  .rev-hero,
  .rev-section,
  .rev-inclui{
    border-color:rgba(243,236,220,.10) !important;
    background:rgba(255,255,255,.016) !important;
  }
  .rev-hero::before{
    background:linear-gradient(90deg,transparent,rgba(243,236,220,.20),transparent) !important;
  }
  .bk-nav{
    display:flex;
    align-items:center;
    gap:10px;
  }
  .bk-avancar,
  #bkEnviar{
    width:auto !important;
    min-width:0 !important;
    min-height:40px !important;
    margin-left:auto;
    padding:10px 18px !important;
    font-size:.70rem !important;
    letter-spacing:.085em !important;
  }
  #bkPanel:has(.bk-etapa[data-etapa="6"]:not([hidden])) #bkEnviar{
    min-width:0 !important;
  }
}
@media (max-width:420px){
  .bk-avancar,
  #bkEnviar{
    min-height:38px !important;
    padding:9px 16px !important;
    font-size:.68rem !important;
  }
}
'''
agenda.write_text(a, encoding='utf-8')
