from pathlib import Path
import re

p = Path('script.js')
s = p.read_text(encoding='utf-8')

s, n1 = re.subn(r"\.cta-panel\{position:relative!important;min-height:510px!important;.*?background:#0e0d0b!important;(.*?)\}", lambda m: m.group(0).replace('background:#0e0d0b!important','background:#17120c!important'), s, count=1)

new_before = ".cta-panel::before{content:''!important;position:absolute!important;inset:0!important;background:#17120c!important;pointer-events:none!important;z-index:0!important}"
s, n2 = re.subn(r"\.cta-panel::before\{content:''!important;position:absolute!important;.*?\}", new_before, s, count=1)

new_main = ".cta-photo-main{position:absolute!important;inset:0!important;background-image:url('assets/cta-final-hq.webp')!important;background-repeat:no-repeat!important;background-position:right center!important;background-size:auto 100%!important;filter:brightness(.99) contrast(1.03) saturate(1.01)!important;pointer-events:none!important;z-index:1!important;-webkit-mask-image:linear-gradient(90deg,transparent 0%,transparent 54%,rgba(0,0,0,.08) 58%,rgba(0,0,0,.22) 62%,rgba(0,0,0,.42) 66%,rgba(0,0,0,.64) 70%,rgba(0,0,0,.82) 74%,rgba(0,0,0,.94) 78%,#000 82%,#000 100%)!important;mask-image:linear-gradient(90deg,transparent 0%,transparent 54%,rgba(0,0,0,.08) 58%,rgba(0,0,0,.22) 62%,rgba(0,0,0,.42) 66%,rgba(0,0,0,.64) 70%,rgba(0,0,0,.82) 74%,rgba(0,0,0,.94) 78%,#000 82%,#000 100%)!important}"
s, n3 = re.subn(r"\.cta-photo-main\{position:absolute!important;inset:0!important;.*?\}", new_main, s, count=1)

new_after = ".cta-panel::after{content:''!important;position:absolute!important;inset:0!important;background:radial-gradient(54% 115% at 86% 44%,rgba(230,200,120,.045) 0%,rgba(201,162,75,.012) 36%,transparent 72%),linear-gradient(180deg,rgba(255,255,255,.008) 0%,transparent 24%,transparent 76%,rgba(0,0,0,.14) 100%)!important;pointer-events:none!important;z-index:2!important}"
s, n4 = re.subn(r"\.cta-panel::after\{content:''!important;position:absolute!important;inset:0!important;.*?\}", new_after, s, count=1)

if (n1,n2,n3,n4) != (1,1,1,1):
    raise SystemExit(f'Unexpected replacements: {(n1,n2,n3,n4)}')

p.write_text(s, encoding='utf-8')
