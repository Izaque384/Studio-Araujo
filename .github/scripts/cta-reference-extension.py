from pathlib import Path
import re

p = Path('script.js')
s = p.read_text(encoding='utf-8')

# Desktop CTA shell: base tone derived from the supplied extension reference.
s, n1 = re.subn(
    r"\.cta-panel\{position:relative!important;min-height:510px!important;.*?\}",
    ".cta-panel{position:relative!important;min-height:510px!important;padding:76px 68px!important;display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:flex-start!important;text-align:left!important;border:1px solid rgba(230,200,120,.34)!important;border-radius:20px!important;overflow:hidden!important;background:#090705!important;box-shadow:0 38px 100px rgba(0,0,0,.44),0 0 0 1px rgba(201,162,75,.035),inset 0 1px 0 rgba(230,200,120,.11),inset 0 0 0 1px rgba(255,255,255,.018)!important}",
    s,
    count=1,
)

# Paint the entire card with a warm, near-black extension that mimics the user's reference strip.
new_before = ".cta-panel::before{content:''!important;position:absolute!important;inset:0!important;background:radial-gradient(90% 78% at 8% 96%,rgba(91,43,19,.22) 0%,rgba(77,34,14,.12) 18%,rgba(53,23,10,.055) 34%,transparent 54%),radial-gradient(74% 88% at 40% 82%,rgba(58,27,12,.08) 0%,rgba(42,18,8,.035) 28%,transparent 50%),linear-gradient(90deg,#080604 0%,#090705 18%,#0a0705 34%,#0b0806 52%,#0d0907 70%,#0f0a07 86%,#110b08 100%)!important;pointer-events:none!important;z-index:0!important}"
s, n2 = re.subn(r"\.cta-panel::before\{content:''!important;position:absolute!important;.*?\}", new_before, s, count=1)

# Keep the original image on the right and dissolve only its left edge into the painted extension.
new_main = ".cta-photo-main{position:absolute!important;inset:0!important;background-image:url('assets/cta-final-hq.webp')!important;background-repeat:no-repeat!important;background-position:right center!important;background-size:auto 100%!important;filter:brightness(.99) contrast(1.03) saturate(1.01)!important;pointer-events:none!important;z-index:1!important;-webkit-mask-image:linear-gradient(90deg,transparent 0%,transparent 55%,rgba(0,0,0,.03) 58%,rgba(0,0,0,.08) 61%,rgba(0,0,0,.16) 64%,rgba(0,0,0,.28) 67%,rgba(0,0,0,.43) 70%,rgba(0,0,0,.59) 73%,rgba(0,0,0,.74) 76%,rgba(0,0,0,.86) 79%,rgba(0,0,0,.94) 82%,rgba(0,0,0,.985) 86%,#000 90%,#000 100%)!important;mask-image:linear-gradient(90deg,transparent 0%,transparent 55%,rgba(0,0,0,.03) 58%,rgba(0,0,0,.08) 61%,rgba(0,0,0,.16) 64%,rgba(0,0,0,.28) 67%,rgba(0,0,0,.43) 70%,rgba(0,0,0,.59) 73%,rgba(0,0,0,.74) 76%,rgba(0,0,0,.86) 79%,rgba(0,0,0,.94) 82%,rgba(0,0,0,.985) 86%,#000 90%,#000 100%)!important}"
s, n3 = re.subn(r"\.cta-photo-main\{position:absolute!important;inset:0!important;.*?\}", new_main, s, count=1)

# Only a subtle premium polish remains above the image; no horizontal dark wall.
new_after = ".cta-panel::after{content:''!important;position:absolute!important;inset:0!important;background:radial-gradient(50% 110% at 86% 44%,rgba(230,200,120,.045) 0%,rgba(201,162,75,.012) 36%,transparent 72%),linear-gradient(180deg,rgba(255,255,255,.008) 0%,transparent 24%,transparent 76%,rgba(0,0,0,.14) 100%)!important;pointer-events:none!important;z-index:2!important}"
s, n4 = re.subn(r"\.cta-panel::after\{content:''!important;position:absolute!important;inset:0!important;.*?\}", new_after, s, count=1)

# Tablet: replace only the background extension and keep the existing vertical photo composition.
tablet_before = ".cta-panel::before{inset:0!important;background:radial-gradient(100% 72% at 15% 96%,rgba(91,43,19,.18) 0%,rgba(65,29,12,.08) 24%,transparent 48%),linear-gradient(180deg,#080604 0%,#090705 30%,#0b0806 62%,#0f0907 100%)!important;filter:none!important;opacity:1!important;-webkit-mask-image:none!important;mask-image:none!important}"
s, n5 = re.subn(r"\.cta-panel::before\{top:-6%!important;bottom:14%!important;.*?\}", tablet_before, s, count=1)

# Mobile: same visual language, slightly warmer near the bottom-left.
mobile_before = ".cta-panel::before{inset:0!important;background:radial-gradient(105% 78% at 12% 96%,rgba(91,43,19,.19) 0%,rgba(64,28,12,.08) 24%,transparent 50%),linear-gradient(180deg,#080604 0%,#090705 28%,#0b0806 60%,#100907 100%)!important;filter:none!important;opacity:1!important}"
s, n6 = re.subn(r"\.cta-panel::before\{left:-12%!important;right:-12%!important;.*?\}", mobile_before, s, count=1)

if (n1,n2,n3,n4,n5,n6) != (1,1,1,1,1,1):
    raise SystemExit(f'Unexpected replacements: {(n1,n2,n3,n4,n5,n6)}')

p.write_text(s, encoding='utf-8')
