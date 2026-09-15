from pathlib import Path

# 1 — CTA mobile: remove eyebrow/frase e adiciona sombreamento leve sobre a foto.
script = Path('script.js')
j = script.read_text(encoding='utf-8')
old_820 = "background:linear-gradient(180deg,rgba(9,7,5,.03) 0%,rgba(9,7,5,.06) 24%,rgba(9,7,5,.22) 44%,rgba(9,7,5,.58) 66%,rgba(9,7,5,.88) 84%,#090705 100%),url('assets/cta-final-mobile.webp') 50% 14%/cover no-repeat,#090705!important"
new_820 = "background:linear-gradient(rgba(7,7,6,.18),rgba(7,7,6,.18)),linear-gradient(180deg,rgba(9,7,5,.03) 0%,rgba(9,7,5,.06) 24%,rgba(9,7,5,.22) 44%,rgba(9,7,5,.58) 66%,rgba(9,7,5,.88) 84%,#090705 100%),url('assets/cta-final-mobile.webp') 50% 14%/cover no-repeat,#090705!important"
old_560 = "background:linear-gradient(180deg,rgba(9,7,5,.03) 0%,rgba(9,7,5,.08) 24%,rgba(9,7,5,.28) 46%,rgba(9,7,5,.62) 68%,rgba(9,7,5,.90) 84%,#090705 100%),url('assets/cta-final-mobile.webp') 50% 12%/cover no-repeat,#090705!important"
new_560 = "background:linear-gradient(rgba(7,7,6,.22),rgba(7,7,6,.22)),linear-gradient(180deg,rgba(9,7,5,.03) 0%,rgba(9,7,5,.08) 24%,rgba(9,7,5,.28) 46%,rgba(9,7,5,.62) 68%,rgba(9,7,5,.90) 84%,#090705 100%),url('assets/cta-final-mobile.webp') 50% 12%/cover no-repeat,#090705!important"
for old, new in ((old_820,new_820),(old_560,new_560)):
    if old in j:
        j = j.replace(old,new,1)
    elif new not in j:
        raise SystemExit('Background mobile do CTA não encontrado')

old_eyebrow = ".cta-panel .eyebrow{width:max-content!important;max-width:100%!important;padding:8px 13px!important;border-radius:999px!important;background:rgba(6,5,4,.76)!important;backdrop-filter:blur(8px)!important;-webkit-backdrop-filter:blur(8px)!important;box-shadow:0 8px 26px rgba(0,0,0,.34)!important;text-shadow:0 1px 10px rgba(0,0,0,.8)!important}"
new_eyebrow = ".cta-panel .eyebrow{display:none!important}"
if old_eyebrow in j:
    j = j.replace(old_eyebrow,new_eyebrow,1)
elif new_eyebrow not in j:
    raise SystemExit('Regra mobile do eyebrow do CTA não encontrada')
script.write_text(j,encoding='utf-8')

# 2, 3 e 4 — Sobre mobile mais imediato, enquadramento ajustado e texto do Ver fotos restaurado.
styles = Path('styles.css')
s = styles.read_text(encoding='utf-8')
marker = '/* ---------- MOBILE POLISH 2026-09 · ROUND 3 ---------- */'
if marker not in s:
    s += r'''

/* ---------- MOBILE POLISH 2026-09 · ROUND 3 ---------- */
@media (max-width:820px){
  /* Sobre: desloca a composição discretamente para a direita no quadro. */
  .hero-sobre .hero-photo img{
    object-position:44% center !important;
  }

  /* Sobre: evita o vazio durante a rolagem em telas de toque. */
  .sobre-article.reveal,
  .sobre-article.reveal.in-view{
    opacity:1 !important;
    transform:none !important;
    transition:none !important;
  }
}

@media (max-width:380px){
  .hero-sobre .hero-photo img{
    object-position:42% center !important;
  }
}

@media (max-width:600px){
  /* O botão mobile volta a mostrar câmera + texto + contador. */
  .gallery-btn .g-txt{
    position:static !important;
    width:auto !important;
    height:auto !important;
    overflow:visible !important;
    clip:auto !important;
    white-space:nowrap !important;
  }
}
'''
styles.write_text(s,encoding='utf-8')

# 5 — Cards do modal de orçamento mais neutros, preservando dourado apenas nos destaques.
serv = Path('servicos.css')
sc = serv.read_text(encoding='utf-8')
smarker = '/* ---------- ORÇAMENTOS · CARDS MAIS NEUTROS ---------- */'
if smarker not in sc:
    sc += r'''

/* ---------- ORÇAMENTOS · CARDS MAIS NEUTROS ---------- */
#serviceModal .package-option{
  border-color:rgba(243,236,220,.13) !important;
  background:linear-gradient(145deg,rgba(255,255,255,.025),rgba(255,255,255,.008)) !important;
  box-shadow:inset 0 1px rgba(255,255,255,.012);
}
#serviceModal .package-option .p-head{
  border-bottom-color:rgba(243,236,220,.085) !important;
  background:rgba(255,255,255,.012) !important;
}
#serviceModal .package-section,
#serviceModal .proposal-detail{
  border-color:rgba(243,236,220,.105) !important;
  background:rgba(255,255,255,.012) !important;
}
'''
serv.write_text(sc,encoding='utf-8')
