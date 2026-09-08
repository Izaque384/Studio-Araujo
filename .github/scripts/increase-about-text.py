from pathlib import Path

p = Path('sobre.html')
s = p.read_text(encoding='utf-8')
anchor = "<style>\n  .sobre-closing-quote{"
insert = "<style>\n  .sobre-article > p:not(.sobre-closing-quote){\n    font-size:clamp(1.06rem,1.25vw,1.14rem);\n    line-height:1.82;\n  }\n  .sobre-closing-quote{"
if anchor not in s:
    raise SystemExit('style anchor not found')
s = s.replace(anchor, insert, 1)
mobile = "  @media(max-width:640px){\n    .sobre-closing-quote{"
mobile_new = "  @media(max-width:640px){\n    .sobre-article > p:not(.sobre-closing-quote){\n      font-size:1.03rem;\n      line-height:1.78;\n    }\n    .sobre-closing-quote{"
if mobile not in s:
    raise SystemExit('mobile anchor not found')
s = s.replace(mobile, mobile_new, 1)
p.write_text(s, encoding='utf-8')
