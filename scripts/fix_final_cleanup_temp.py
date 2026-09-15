from pathlib import Path
p=Path('scripts/final_cleanup_temp.py')
s=p.read_text(encoding='utf-8')
old="""if 'DEPOIMENTOS_FIXOS' in s or '.insert({...row,is_visible:true})' in s:\n    raise SystemExit('Resíduo de depoimentos fixos/fallback direto permaneceu')\n"""
new="""if 'DEPOIMENTOS_FIXOS' in s:\n    raise SystemExit('Resíduo DEPOIMENTOS_FIXOS permaneceu')\nif '.insert({...row,is_visible:true})' in s:\n    raise SystemExit('Resíduo do fallback direto permaneceu')\n"""
if old not in s: raise SystemExit('Guarda original não encontrado')
p.write_text(s.replace(old,new,1),encoding='utf-8')
