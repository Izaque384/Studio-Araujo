from pathlib import Path

path = Path('styles.css')
css = path.read_text(encoding='utf-8')
marker = '/* ---------- AGENDAMENTO · ETAPAS SEM PADDING GLOBAL ---------- */'
block = '''\n\n/* ---------- AGENDAMENTO · ETAPAS SEM PADDING GLOBAL ---------- */\n/* As etapas internas são <section>; sem este reset elas herdam os 130px\n   verticais da regra global de seções e criam grandes vazios no formulário. */\n.booking-panel .bk-etapa{\n  padding:0 !important;\n}\n'''
if marker not in css:
    css += block
    path.write_text(css, encoding='utf-8')
