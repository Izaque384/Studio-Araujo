from pathlib import Path
p=Path('sobre.html')
s=p.read_text(encoding='utf-8')
s=s.replace("  .sobre-closing-quote{\n", "  .sobre-article > p.sobre-closing-quote{\n", 1)
s=s.replace("font-size:clamp(1.82rem,3.45vw,2.58rem);", "font-size:clamp(2.05rem,3.9vw,2.9rem)!important;", 1)
s=s.replace("font-size:clamp(1.58rem,7.5vw,2.08rem);", "font-size:clamp(1.78rem,8vw,2.28rem)!important;", 1)
p.write_text(s,encoding='utf-8')
