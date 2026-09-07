from pathlib import Path
import re

p = Path('script.js')
s = p.read_text(encoding='utf-8')

panel = ".cta-panel{position:relative!important;min-height:510px!important;padding:76px 68px!important;display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:flex-start!important;text-align:left!important;border:1px solid rgba(230,200,120,.34)!important;border-radius:20px!important;overflow:hidden!important;background:linear-gradient(90deg,#080604 0%,#090705 38%,rgba(9,7,5,.995) 46%,rgba(9,7,5,.97) 52%,rgba(9,7,5,.90) 58%,rgba(9,7,5,.78) 64%,rgba(9,7,5,.61) 70%,rgba(9,7,5,.41) 75%,rgba(9,7,5,.22) 80%,rgba(9,7,5,.08) 84%,rgba(9,7,5,0) 88%),url('assets/cta-final-hq.webp') right center/auto 100% no-repeat,#090705!important;box-shadow:0 38px 100px rgba(0,0,0,.44),0 0 0 1px rgba(201,162,75,.035),inset 0 1px 0 rgba(230,200,120,.11),inset 0 0 0 1px rgba(255,255,255,.018)!important;animation:none!important;transition:none!important}"
s, n1 = re.subn(r"\.cta-panel\{position:relative!important;min-height:510px!important;.*?\}", panel, s, count=1)

before = ".cta-panel::before{content:''!important;position:absolute!important;inset:0!important;background:radial-gradient(90% 78% at 8% 96%,rgba(91,43,19,.16) 0%,rgba(77,34,14,.08) 18%,rgba(53,23,10,.035) 34%,transparent 54%)!important;pointer-events:none!important;z-index:0!important;animation:none!important;transform:none!important;transition:none!important;opacity:1!important}"
s, n2 = re.subn(r"\.cta-panel::before\{content:''!important;position:absolute!important;.*?\}", before, s, count=1)

main = ".cta-photo-main{display:none!important}"
s, n3 = re.subn(r"\.cta-photo-main\{position:absolute!important;inset:0!important;.*?\}", main, s, count=1)

after = ".cta-panel::after{content:''!important;position:absolute!important;inset:0!important;background:radial-gradient(50% 110% at 86% 44%,rgba(230,200,120,.035) 0%,rgba(201,162,75,.010) 36%,transparent 72%),linear-gradient(180deg,rgba(255,255,255,.006) 0%,transparent 24%,transparent 76%,rgba(0,0,0,.12) 100%)!important;pointer-events:none!important;z-index:2!important;animation:none!important;transform:none!important;transition:none!important}"
s, n4 = re.subn(r"\.cta-panel::after\{content:''!important;position:absolute!important;inset:0!important;.*?\}", after, s, count=1)

# Tablet: photo and dark blend stay in the same background stack.
tablet_panel = ".cta-panel{min-height:520px!important;padding:54px 38px!important;justify-content:flex-end!important;background:linear-gradient(180deg,rgba(9,7,5,.03) 0%,rgba(9,7,5,.06) 24%,rgba(9,7,5,.22) 44%,rgba(9,7,5,.58) 66%,rgba(9,7,5,.88) 84%,#090705 100%),url('assets/cta-final-hq.webp') 72% 16%/auto 122% no-repeat,#090705!important}"
s, n5 = re.subn(r"\.cta-panel\{min-height:520px!important;padding:54px 38px!important;justify-content:flex-end!important\}", tablet_panel, s, count=1)

# Remove now-unused tablet image/background overrides and keep pseudo layers static.
s, n6 = re.subn(r"\s*\.cta-panel::before\{inset:0!important;.*?\}", "", s, count=1)
s, n7 = re.subn(r"\s*\.cta-photo-main\{background-position:72% 16%!important;.*?\}", "", s, count=1)

# Mobile version on the same element.
mobile_panel = ".cta-panel{min-height:540px!important;padding:42px 24px!important;border-radius:16px!important;background:linear-gradient(180deg,rgba(9,7,5,.03) 0%,rgba(9,7,5,.08) 24%,rgba(9,7,5,.28) 46%,rgba(9,7,5,.62) 68%,rgba(9,7,5,.90) 84%,#090705 100%),url('assets/cta-final-hq.webp') 66% 14%/auto 108% no-repeat,#090705!important}"
s, n8 = re.subn(r"\.cta-panel\{min-height:540px!important;padding:42px 24px!important;border-radius:16px!important\}", mobile_panel, s, count=1)
s, n9 = re.subn(r"\s*\.cta-panel::before\{inset:0!important;.*?\}", "", s, count=1)
s, n10 = re.subn(r"\s*\.cta-photo-main\{background-position:66% 14%!important;.*?\}", "", s, count=1)

if (n1,n2,n3,n4,n5,n6,n7,n8,n9,n10) != (1,1,1,1,1,1,1,1,1,1):
    raise SystemExit(f'Unexpected replacements: {(n1,n2,n3,n4,n5,n6,n7,n8,n9,n10)}')

p.write_text(s, encoding='utf-8')
