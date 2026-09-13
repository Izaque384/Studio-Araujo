from pathlib import Path

p = Path('agenda.js')
s = p.read_text(encoding='utf-8')

old = 'b.addEventListener("click",()=>{st.data=iso(d);st.hora=null;montarCalendario();montarSlots();atualizar();if(!usaHorario())seguir();}); el.dias.appendChild(b);'
new = 'b.addEventListener("click",()=>{st.data=iso(d);st.hora=null;montarCalendario();montarSlots();atualizar();if(!precisaHorarioSelecionado())seguir();}); el.dias.appendChild(b);'
if old not in s:
    raise SystemExit('Clique do calendário não encontrado')
s = s.replace(old, new, 1)

old = 'let destino=Math.min(Number(m.etapa)||1,TOTAL);if(ehProduto()&&destino===4)destino=5;etapa=destino;'
new = 'let destino=Math.min(Number(m.etapa)||1,6);if(ehProduto()&&destino===4)destino=5;etapa=destino;'
if old not in s:
    raise SystemExit('Restauração com TOTAL não encontrada')
s = s.replace(old, new, 1)

p.write_text(s, encoding='utf-8')
