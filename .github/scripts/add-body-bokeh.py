from pathlib import Path

p = Path('script.js')
s = p.read_text(encoding='utf-8')
anchor = "document.querySelectorAll('.hero, .page-hero').forEach(hero => {\n  for (let i = 0; i < 7; i++) {\n    const dot = document.createElement('span'); dot.className = 'bokeh-dot';\n    const size = 8 + Math.random() * 20; dot.style.width = size + 'px'; dot.style.height = size + 'px';\n    dot.style.left = (4 + Math.random() * 92) + '%'; dot.style.top = (18 + Math.random() * 72) + '%';\n    dot.style.animationDuration = (9 + Math.random() * 8) + 's'; dot.style.animationDelay = (Math.random() * 9) + 's'; hero.appendChild(dot);\n  }\n});\n"

insert = anchor + r'''

// Bokeh editorial sutil no corpo das páginas internas.
// Mantém a Home limpa e usa menos intensidade do que os heros.
(function adicionarBodyBokeh(){
  if (!document.querySelector('.page-hero')) return;

  if (!document.getElementById('bodyBokehStyle')) {
    const style = document.createElement('style');
    style.id = 'bodyBokehStyle';
    style.textContent = `
      .body-bokeh-host{position:relative!important;isolation:isolate}
      .body-bokeh-dot{
        position:absolute;
        border-radius:50%;
        pointer-events:none;
        z-index:-1;
        background:radial-gradient(circle,rgba(230,200,120,.24) 0%,rgba(201,162,75,.10) 38%,rgba(201,162,75,.025) 62%,transparent 76%);
        filter:blur(18px);
        opacity:.11;
        animation:bodyBokehFloat var(--body-bokeh-dur,32s) ease-in-out infinite alternate;
        will-change:transform;
      }
      .body-bokeh-dot.is-soft{opacity:.075;filter:blur(24px)}
      @keyframes bodyBokehFloat{
        from{transform:translate3d(0,0,0) scale(1)}
        to{transform:translate3d(12px,-10px,0) scale(1.04)}
      }
      @media(max-width:640px){
        .body-bokeh-dot{opacity:.07;filter:blur(20px)}
        .body-bokeh-dot.is-soft{opacity:.05}
      }
      @media(prefers-reduced-motion:reduce){
        .body-bokeh-dot{animation:none!important}
      }
    `;
    document.head.appendChild(style);
  }

  const secoes = document.querySelectorAll('main > section:not(.page-hero)');
  secoes.forEach((secao, idx) => {
    if (secao.querySelector('.body-bokeh-dot')) return;
    secao.classList.add('body-bokeh-host');

    const configs = idx % 2 === 0
      ? [
          { size: 150, left: '-4%', top: '18%', dur: '34s', soft: false },
          { size: 110, left: '82%', top: '68%', dur: '39s', soft: true }
        ]
      : [
          { size: 125, left: '86%', top: '16%', dur: '37s', soft: false },
          { size: 165, left: '-7%', top: '72%', dur: '42s', soft: true }
        ];

    configs.forEach(cfg => {
      const dot = document.createElement('span');
      dot.className = 'body-bokeh-dot' + (cfg.soft ? ' is-soft' : '');
      dot.setAttribute('aria-hidden', 'true');
      dot.style.width = cfg.size + 'px';
      dot.style.height = cfg.size + 'px';
      dot.style.left = cfg.left;
      dot.style.top = cfg.top;
      dot.style.setProperty('--body-bokeh-dur', cfg.dur);
      secao.appendChild(dot);
    });
  });
})();
'''

if anchor not in s:
    raise SystemExit('hero bokeh anchor not found')
if 'function adicionarBodyBokeh()' in s:
    raise SystemExit('body bokeh already present')
s = s.replace(anchor, insert, 1)
p.write_text(s, encoding='utf-8')
