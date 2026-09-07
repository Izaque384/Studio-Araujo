from pathlib import Path

p = Path('script.js')
s = p.read_text(encoding='utf-8')
old = ".cta-photo-main{position:absolute!important;inset:0!important;background-image:url('assets/cta-final-hq.webp')!important;background-repeat:no-repeat!important;background-position:right center!important;background-size:auto 100%!important;filter:brightness(.98) contrast(1.03) saturate(1.01)!important;pointer-events:none!important;z-index:1!important}"
new = ".cta-photo-main{position:absolute!important;inset:0!important;background-image:url('assets/cta-final-hq.webp')!important;background-repeat:no-repeat!important;background-position:right center!important;background-size:auto 100%!important;filter:brightness(.98) contrast(1.03) saturate(1.01)!important;pointer-events:none!important;z-index:1!important;-webkit-mask-image:linear-gradient(90deg,transparent 0%,transparent 50%,rgba(0,0,0,.06) 56%,rgba(0,0,0,.16) 61%,rgba(0,0,0,.30) 66%,rgba(0,0,0,.48) 71%,rgba(0,0,0,.66) 76%,rgba(0,0,0,.82) 81%,rgba(0,0,0,.93) 86%,#000 92%,#000 100%)!important;mask-image:linear-gradient(90deg,transparent 0%,transparent 50%,rgba(0,0,0,.06) 56%,rgba(0,0,0,.16) 61%,rgba(0,0,0,.30) 66%,rgba(0,0,0,.48) 71%,rgba(0,0,0,.66) 76%,rgba(0,0,0,.82) 81%,rgba(0,0,0,.93) 86%,#000 92%,#000 100%)!important}"
if old not in s:
    raise SystemExit('Expected cta-photo-main rule not found')
s = s.replace(old, new, 1)

old_tab = ".cta-photo-main{background-position:72% 16%!important;background-size:auto 122%!important}"
new_tab = ".cta-photo-main{background-position:72% 16%!important;background-size:auto 122%!important;-webkit-mask-image:linear-gradient(180deg,#000 0%,#000 42%,rgba(0,0,0,.90) 50%,rgba(0,0,0,.72) 59%,rgba(0,0,0,.48) 68%,rgba(0,0,0,.24) 77%,transparent 90%)!important;mask-image:linear-gradient(180deg,#000 0%,#000 42%,rgba(0,0,0,.90) 50%,rgba(0,0,0,.72) 59%,rgba(0,0,0,.48) 68%,rgba(0,0,0,.24) 77%,transparent 90%)!important}"
if old_tab not in s:
    raise SystemExit('Expected tablet cta-photo-main rule not found')
s = s.replace(old_tab, new_tab, 1)

old_mobile = ".cta-photo-main{background-position:66% 14%!important;background-size:auto 108%!important}"
new_mobile = ".cta-photo-main{background-position:66% 14%!important;background-size:auto 108%!important;-webkit-mask-image:linear-gradient(180deg,#000 0%,#000 40%,rgba(0,0,0,.88) 50%,rgba(0,0,0,.66) 60%,rgba(0,0,0,.42) 70%,rgba(0,0,0,.20) 80%,transparent 92%)!important;mask-image:linear-gradient(180deg,#000 0%,#000 40%,rgba(0,0,0,.88) 50%,rgba(0,0,0,.66) 60%,rgba(0,0,0,.42) 70%,rgba(0,0,0,.20) 80%,transparent 92%)!important}"
if old_mobile not in s:
    raise SystemExit('Expected mobile cta-photo-main rule not found')
s = s.replace(old_mobile, new_mobile, 1)

p.write_text(s, encoding='utf-8')
