from pathlib import Path

p = Path('sobre.html')
s = p.read_text(encoding='utf-8')
s2 = s.replace("font-size:clamp(1.65rem,3.1vw,2.35rem);","font-size:clamp(1.82rem,3.45vw,2.58rem);",1)
s2 = s2.replace("font-size:clamp(1.45rem,7vw,1.9rem);","font-size:clamp(1.58rem,7.5vw,2.08rem);",1)
if s2 == s:
    raise SystemExit('quote font-size anchors not found')
p.write_text(s2, encoding='utf-8')
