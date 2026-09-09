from pathlib import Path

# Corpo das páginas / Home
p = Path('script.js')
s = p.read_text(encoding='utf-8')
repls = {
    "background:radial-gradient(circle,rgba(255,232,170,.62) 0%,rgba(230,200,120,.30) 24%,rgba(201,162,75,.14) 48%,rgba(201,162,75,.04) 68%,transparent 82%);": "background:radial-gradient(circle,rgba(255,232,170,.46) 0%,rgba(230,200,120,.22) 24%,rgba(201,162,75,.10) 48%,rgba(201,162,75,.028) 68%,transparent 82%);",
    "opacity:.22;": "opacity:.14;",
    ".body-bokeh-dot.is-soft{opacity:.13;filter:blur(18px)}": ".body-bokeh-dot.is-soft{opacity:.08;filter:blur(19px)}",
    ".body-bokeh-dot{opacity:.16;filter:blur(14px)}": ".body-bokeh-dot{opacity:.11;filter:blur(15px)}",
    ".body-bokeh-dot.is-soft{opacity:.10}": ".body-bokeh-dot.is-soft{opacity:.065}",
}
for old, new in repls.items():
    if old not in s:
        raise SystemExit(f'script.js anchor not found: {old}')
    s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')

# Bokehs dos heros
p = Path('styles.css')
s = p.read_text(encoding='utf-8')
repls = {
    "background:radial-gradient(circle, rgba(230,200,120,0.55), rgba(201,162,75,0.18) 55%, transparent 72%);": "background:radial-gradient(circle, rgba(230,200,120,0.38), rgba(201,162,75,0.11) 55%, transparent 74%);",
    "25%{ opacity:0.55; }": "25%{ opacity:0.34; }",
    "75%{ opacity:0.3; }": "75%{ opacity:0.18; }",
}
for old, new in repls.items():
    if old not in s:
        raise SystemExit(f'styles.css anchor not found: {old}')
    s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')
