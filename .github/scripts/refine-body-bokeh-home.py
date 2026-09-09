from pathlib import Path

p = Path('script.js')
s = p.read_text(encoding='utf-8')

replacements = {
    "// Bokeh editorial sutil no corpo das páginas internas.\n// Mantém a Home limpa e usa menos intensidade do que os heros.\n(function adicionarBodyBokeh(){\n  if (!document.querySelector('.page-hero')) return;\n": "// Bokeh editorial sutil no corpo das páginas.\n// Também atua na Home, sempre fora dos heros.\n(function adicionarBodyBokeh(){\n",
    "background:radial-gradient(circle,rgba(255,232,170,.72) 0%,rgba(230,200,120,.38) 24%,rgba(201,162,75,.18) 48%,rgba(201,162,75,.05) 68%,transparent 82%);": "background:radial-gradient(circle,rgba(255,232,170,.62) 0%,rgba(230,200,120,.30) 24%,rgba(201,162,75,.14) 48%,rgba(201,162,75,.04) 68%,transparent 82%);",
    "filter:blur(10px);": "filter:blur(12px);",
    "opacity:.30;": "opacity:.22;",
    ".body-bokeh-dot.is-soft{opacity:.18;filter:blur(18px)}": ".body-bokeh-dot.is-soft{opacity:.13;filter:blur(18px)}",
    "to{transform:translate3d(12px,-10px,0) scale(1.04)}": "to{transform:translate3d(10px,-8px,0) scale(1.03)}",
    ".body-bokeh-dot{opacity:.20;filter:blur(14px)}": ".body-bokeh-dot{opacity:.16;filter:blur(14px)}",
    ".body-bokeh-dot.is-soft{opacity:.12}": ".body-bokeh-dot.is-soft{opacity:.10}",
    "const secoes = document.querySelectorAll('main > section:not(.page-hero)');": "const secoes = document.querySelectorAll('main > section:not(.page-hero):not(.hero)');",
    "{ size: 220, left: '-3%', top: '14%', dur: '34s', soft: false }": "{ size: 150, left: '-2%', top: '14%', dur: '34s', soft: false }",
    "{ size: 170, left: '78%', top: '64%', dur: '39s', soft: true }": "{ size: 110, left: '84%', top: '66%', dur: '39s', soft: true }",
    "{ size: 200, left: '82%', top: '12%', dur: '37s', soft: false }": "{ size: 135, left: '84%', top: '12%', dur: '37s', soft: false }",
    "{ size: 230, left: '-5%', top: '68%', dur: '42s', soft: true }": "{ size: 160, left: '-3%', top: '68%', dur: '42s', soft: true }",
}

for old, new in replacements.items():
    if old not in s:
        raise SystemExit(f'anchor not found: {old}')
    s = s.replace(old, new, 1)

p.write_text(s, encoding='utf-8')
