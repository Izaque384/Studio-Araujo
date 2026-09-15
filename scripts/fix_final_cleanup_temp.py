from pathlib import Path
p=Path('scripts/final_cleanup_temp.py')
s=p.read_text(encoding='utf-8')
old_guard="""if 'DEPOIMENTOS_FIXOS' in s or '.insert({...row,is_visible:true})' in s:\n    raise SystemExit('Resíduo de depoimentos fixos/fallback direto permaneceu')\n"""
new_guard="""if 'DEPOIMENTOS_FIXOS' in s:\n    print('RESIDUAL_LINES', [line for line in s.splitlines() if 'DEPOIMENTOS_FIXOS' in line])\n    raise SystemExit('Resíduo DEPOIMENTOS_FIXOS permaneceu')\nif '.insert({...row,is_visible:true})' in s:\n    raise SystemExit('Resíduo do fallback direto permaneceu')\n"""
if old_guard in s:
    s=s.replace(old_guard,new_guard,1)
old_remove="""s = re.sub(\n    r'const DEPOIMENTOS_FIXOS = \\[.*?\\n\\];\\n\\n',\n    '',\n    s,\n    count=1,\n    flags=re.S,\n)\n"""
new_remove="""fixed_start = s.find('const DEPOIMENTOS_FIXOS = [')\nif fixed_start >= 0:\n    fixed_end = s.find('];', fixed_start)\n    if fixed_end < 0: raise SystemExit('Fim do bloco DEPOIMENTOS_FIXOS não encontrado')\n    s = s[:fixed_start] + s[fixed_end + 2:].lstrip('\\n')\n"""
if old_remove not in s:
    raise SystemExit('Remoção antiga de depoimentos fixos não encontrada')
s=s.replace(old_remove,new_remove,1)
p.write_text(s,encoding='utf-8')
