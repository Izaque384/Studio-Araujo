from pathlib import Path
p=Path('script.js')
s=p.read_text(encoding='utf-8')
old="""      .body-bokeh-host{position:relative!important;isolation:isolate}\n      .body-bokeh-dot{\n        position:absolute;\n        border-radius:50%;\n        pointer-events:none;\n        z-index:-1;\n        background:radial-gradient(circle,rgba(230,200,120,.24) 0%,rgba(201,162,75,.10) 38%,rgba(201,162,75,.025) 62%,transparent 76%);\n        filter:blur(18px);\n        opacity:.11;\n"""
new="""      .body-bokeh-host{position:relative!important;isolation:isolate;overflow:hidden}\n      .body-bokeh-host>.wrap{position:relative;z-index:1}\n      .body-bokeh-dot{\n        position:absolute;\n        border-radius:50%;\n        pointer-events:none;\n        z-index:0;\n        background:radial-gradient(circle,rgba(230,200,120,.34) 0%,rgba(201,162,75,.15) 38%,rgba(201,162,75,.045) 62%,transparent 78%);\n        filter:blur(16px);\n        opacity:.18;\n"""
if old not in s:
    raise SystemExit('body bokeh style anchor not found')
s=s.replace(old,new,1)
s=s.replace("      .body-bokeh-dot.is-soft{opacity:.075;filter:blur(24px)}", "      .body-bokeh-dot.is-soft{opacity:.11;filter:blur(24px)}", 1)
s=s.replace("        .body-bokeh-dot{opacity:.07;filter:blur(20px)}\n        .body-bokeh-dot.is-soft{opacity:.05}", "        .body-bokeh-dot{opacity:.12;filter:blur(20px)}\n        .body-bokeh-dot.is-soft{opacity:.075}", 1)
p.write_text(s,encoding='utf-8')
