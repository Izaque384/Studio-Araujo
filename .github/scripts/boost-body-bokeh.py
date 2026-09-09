from pathlib import Path
p=Path('script.js')
s=p.read_text(encoding='utf-8')
repls={
"background:radial-gradient(circle,rgba(230,200,120,.34) 0%,rgba(201,162,75,.15) 38%,rgba(201,162,75,.045) 62%,transparent 78%);":"background:radial-gradient(circle,rgba(255,232,170,.72) 0%,rgba(230,200,120,.38) 24%,rgba(201,162,75,.18) 48%,rgba(201,162,75,.05) 68%,transparent 82%);",
"filter:blur(16px);":"filter:blur(10px);",
"opacity:.18;":"opacity:.30;",
"will-change:transform;":"will-change:transform;\n        mix-blend-mode:screen;",
".body-bokeh-dot.is-soft{opacity:.11;filter:blur(24px)}":".body-bokeh-dot.is-soft{opacity:.18;filter:blur(18px)}",
".body-bokeh-dot{opacity:.12;filter:blur(20px)}":".body-bokeh-dot{opacity:.20;filter:blur(14px)}",
".body-bokeh-dot.is-soft{opacity:.075}":".body-bokeh-dot.is-soft{opacity:.12}",
"{ size: 150, left: '-4%', top: '18%', dur: '34s', soft: false }":"{ size: 220, left: '-3%', top: '14%', dur: '34s', soft: false }",
"{ size: 110, left: '82%', top: '68%', dur: '39s', soft: true }":"{ size: 170, left: '78%', top: '64%', dur: '39s', soft: true }",
"{ size: 125, left: '86%', top: '16%', dur: '37s', soft: false }":"{ size: 200, left: '82%', top: '12%', dur: '37s', soft: false }",
"{ size: 165, left: '-7%', top: '72%', dur: '42s', soft: true }":"{ size: 230, left: '-5%', top: '68%', dur: '42s', soft: true }",
}
for a,b in repls.items():
    if a not in s:
        raise SystemExit(f'anchor not found: {a}')
    s=s.replace(a,b,1)
p.write_text(s,encoding='utf-8')
