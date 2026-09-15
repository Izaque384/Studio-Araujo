from pathlib import Path

# 1, 2 e 3 — depoimentos, CTA e hero Sobre
styles = Path('styles.css')
s = styles.read_text(encoding='utf-8')
marker = '/* ---------- MOBILE POLISH 2026-09 ---------- */'
if marker not in s:
    s += r'''

/* ---------- MOBILE POLISH 2026-09 ---------- */
@media (max-width:860px){
  /* Depoimentos: no toque a navegação é feita por gesto, sem controles sobre o card. */
  .testi-carousel .carousel-nav{
    display:none !important;
  }
  .testi-carousel .carousel-track{
    touch-action:pan-y;
    -webkit-user-select:none;
    user-select:none;
  }
  .testi-carousel .carousel-wrapper{
    touch-action:pan-y;
  }
}

@media (max-width:820px){
  /* Sobre: mantém a família no eixo central da foto em qualquer largura mobile. */
  .hero-sobre .hero-photo img{
    object-position:50% center !important;
  }
}
@media (max-width:380px){
  .hero-sobre .hero-photo img{
    object-position:50% center !important;
  }
}
'''
styles.write_text(s, encoding='utf-8')

dep = Path('depoimentos.js')
d = dep.read_text(encoding='utf-8')
old_touch = '''if (carrosselTrack) {
  let tx = 0;
  carrosselTrack.addEventListener("touchstart", e => { tx = e.changedTouches[0].clientX; }, { passive: true });
  carrosselTrack.addEventListener("touchend", e => { const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) dx < 0 ? avancar() : voltar(); }, { passive: true });
}'''
new_touch = '''if (carrosselTrack) {
  let tx = 0, ty = 0;
  carrosselTrack.addEventListener("touchstart", e => {
    tx = e.changedTouches[0].clientX;
    ty = e.changedTouches[0].clientY;
    clearInterval(autoplayTimer);
  }, { passive: true });
  carrosselTrack.addEventListener("touchend", e => {
    const dx = e.changedTouches[0].clientX - tx;
    const dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) dx < 0 ? avancar() : voltar();
    if (carrosselTotal > 1) iniciarAutoplay();
  }, { passive: true });
}'''
if old_touch not in d:
    raise SystemExit('Bloco de toque dos depoimentos não encontrado')
d = d.replace(old_touch, new_touch, 1)
dep.write_text(d, encoding='utf-8')

# CTA imersivo é injetado pelo script.js e usa !important.
script = Path('script.js')
j = script.read_text(encoding='utf-8')
replacements = {
    "url('assets/cta-final-hq.webp') 72% 16%/auto 122% no-repeat": "url('assets/cta-final-hq.webp') 50% 16%/auto 122% no-repeat",
    "url('assets/cta-final-hq.webp') 66% 14%/auto 108% no-repeat": "url('assets/cta-final-hq.webp') 50% 14%/auto 108% no-repeat",
    ".cta-panel h2{max-width:560px!important}": ".cta-panel .eyebrow{width:max-content!important;max-width:100%!important;padding:8px 13px!important;border-radius:999px!important;background:rgba(6,5,4,.76)!important;backdrop-filter:blur(8px)!important;-webkit-backdrop-filter:blur(8px)!important;box-shadow:0 8px 26px rgba(0,0,0,.34)!important;text-shadow:0 1px 10px rgba(0,0,0,.8)!important}\n        .cta-panel h2{max-width:560px!important}",
}
for old, new in replacements.items():
    if old not in j:
        raise SystemExit(f'Trecho do CTA não encontrado: {old[:70]}')
    j = j.replace(old, new, 1)
script.write_text(j, encoding='utf-8')

# 4 — Serviços: elimina o estado invisível/stagger no toque.
serv = Path('servicos.css')
sc = serv.read_text(encoding='utf-8')
smarker = '/* ---------- SERVIÇOS MOBILE · RENDER IMEDIATO ---------- */'
if smarker not in sc:
    sc += r'''

/* ---------- SERVIÇOS MOBILE · RENDER IMEDIATO ---------- */
@media (max-width:860px){
  .servicos-grid.reveal,
  .servicos-grid.reveal.in-view{
    opacity:1 !important;
    transform:none !important;
    transition:none !important;
  }
  .servicos-grid.reveal .servico-card,
  .servicos-grid.reveal.in-view .servico-card{
    opacity:1 !important;
    transform:none !important;
    transition:background .25s ease !important;
    transition-delay:0s !important;
  }
  .servico-card::after{
    display:none;
  }
  .servico-card .card-photo{
    background:linear-gradient(145deg,rgba(201,162,75,.045),rgba(255,255,255,.012)),var(--bg);
  }
}
'''
serv.write_text(sc, encoding='utf-8')

# 5 e 6 — Agendamento: contenção de texto + rodapé mais compacto e câmera maior.
agenda = Path('agendamento.css')
ac = agenda.read_text(encoding='utf-8')
amarker = '/* ---------- AGENDAMENTO MOBILE · CONTENÇÃO E RODAPÉ ---------- */'
if amarker not in ac:
    ac += r'''

/* ---------- AGENDAMENTO MOBILE · CONTENÇÃO E RODAPÉ ---------- */
@media (max-width:620px){
  .booking-panel,
  .bk-corpo,
  .bk-etapa,
  .booking-step,
  .bk-tipos,
  .bk-servicos,
  .bk-pacote,
  .rev-premium,
  .rev-hero,
  .rev-section,
  .rev-inclui,
  .bk-nav{
    min-width:0;
    max-width:100%;
  }

  .booking-label,
  .booking-hint,
  .aviso-privacidade,
  .bk-sinal,
  .bk-passo,
  .bk-tipo strong,
  .bk-tipo em,
  .bk-servico-nome,
  .bk-servico-meta,
  .bk-pacote-topo span,
  .bk-pacote li,
  .svc-consulta,
  .svc-note,
  .rev-servico,
  .rev-pacote,
  .rev-v,
  .rev-inclui li,
  .rev-confirm-note p{
    max-width:100%;
    overflow-wrap:anywhere;
    word-break:normal;
  }

  .booking-input,
  .booking-select,
  .dd-toggle,
  .svc-opt{
    min-width:0;
    max-width:100%;
  }
  .dd-toggle{
    white-space:normal;
  }
  .svc-opt .o-name{
    min-width:0;
    overflow-wrap:anywhere;
  }
  .svc-opt .o-price{
    white-space:normal;
  }
  .bk-pacote-topo{
    align-items:flex-start;
    flex-wrap:wrap;
  }
  .bk-pacote-topo b{
    white-space:normal;
  }
  .bk-cal-topo strong{
    min-width:0;
    text-align:center;
    overflow-wrap:anywhere;
  }
  .bk-legenda{
    row-gap:6px;
  }
}

@media (max-width:700px){
  .agenda-rodape{
    grid-template-columns:1fr;
    gap:20px;
    margin-top:46px;
    padding-top:34px;
  }
  .agenda-rodape-texto{
    max-width:520px;
    margin:0 auto;
    text-align:center;
  }
  .agenda-rodape-texto h2{
    margin-bottom:10px;
    font-size:clamp(1.55rem,7vw,1.85rem);
    line-height:1.12;
  }
  .agenda-rodape-texto p{
    margin-bottom:10px;
    font-size:.88rem;
    line-height:1.55;
  }
  .agenda-rodape-texto .btn{
    margin-top:4px;
  }
  .agenda-rodape-cam{
    display:flex;
    justify-content:center;
    margin-top:2px;
  }
  .agenda-logo{
    width:min(420px,100%);
    margin:0 auto;
  }
  .agenda-logo .lens{
    width:min(400px,100%);
    max-width:100%;
  }
}

@media (max-width:420px){
  .agenda-rodape{
    gap:14px;
    margin-top:38px;
    padding-top:28px;
  }
  .agenda-logo{
    width:100%;
  }
  .agenda-logo .lens{
    width:100%;
  }
}
'''
agenda.write_text(ac, encoding='utf-8')
