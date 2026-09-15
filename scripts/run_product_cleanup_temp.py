from pathlib import Path
import subprocess

p=Path('scripts/remove_product_services_temp.py')
s=p.read_text(encoding='utf-8')
old="""if 'ehProduto' in a or 'grupo!==\"produtos\"' in a or 'Produto personalizado' in a:\n    raise SystemExit('Lógica de produtos ainda presente em agenda.js')\n"""
new="""# Fallback para variações antigas de espaçamento: qualquer chamada residual vira condição falsa,\n# e os textos mortos de produto também são simplificados antes da validação.\na = a.replace('ehProduto()', 'false')\na = re.sub(r'^const ehProduto\\s*=.*\\n', '', a, flags=re.M)\na = a.replace('false?\"Gostaria de solicitar um produto. 📸\":\"Gostaria de agendar uma sessão. 📸\"', '\"Gostaria de agendar uma sessão. 📸\"')\na = a.replace('(false?\"Resumo do pedido\":\"Resumo do agendamento\")', '\"Resumo do agendamento\"')\na = a.replace('(false?\"01\":\"02\")', '\"02\"')\na = a.replace('if(!false){', '{')\na = a.replace('if(false&&n===4)n=5;', '')\na = a.replace('false&&etapa===3?5:etapa+1', 'etapa+1')\na = a.replace('if(!false && !validarEscolhaAgenda())', 'if(!validarEscolhaAgenda())')\na = a.replace('if(etapa===5&&false)mostrarEtapa(3,true);else if(etapa>1)', 'if(etapa>1)')\na = a.replace('{if(!false)mostrarEtapa(4,true);}', '{mostrarEtapa(4,true);}')\nif 'ehProduto' in a or 'grupo!==\"produtos\"' in a or 'Produto personalizado' in a:\n    raise SystemExit('Lógica de produtos ainda presente em agenda.js')\n"""
if old not in s:
    raise SystemExit('Ponto de correção do limpador não encontrado')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
subprocess.run(['python','scripts/remove_product_services_temp.py'],check=True)
