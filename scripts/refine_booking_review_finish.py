from pathlib import Path

agenda = Path('agenda.js')
s = agenda.read_text(encoding='utf-8')
old = 'html+=\'<div class="rev-confirm-note"><span class="rev-confirm-icon" aria-hidden="true">✓</span><div><strong>Tudo certo?</strong><p>Ao confirmar, abriremos o WhatsApp com estes dados já organizados. Você revisa a mensagem e envia quando estiver pronto.</p></div></div></div>\';'
new = 'html+=\'<div class="rev-confirm-note"><span class="rev-confirm-icon" aria-hidden="true">✓</span><div><strong>Tudo certo?</strong><p>Ao confirmar, abriremos o WhatsApp com seu pedido pronto para revisar e enviar; a data será reservada assim que confirmarmos por lá.</p></div></div></div>\';'
if old not in s:
    raise SystemExit('Mensagem atual de confirmação não encontrada em agenda.js')
s = s.replace(old, new, 1)
agenda.write_text(s, encoding='utf-8')

html = Path('agendamento.html')
h = html.read_text(encoding='utf-8')
old_hint = '            <p class="booking-hint">Seu pedido abre no WhatsApp já preenchido — é só enviar. A data fica garantida assim que confirmarmos por lá.</p>\n'
if old_hint not in h:
    raise SystemExit('Mensagem inferior duplicada não encontrada em agendamento.html')
h = h.replace(old_hint, '', 1)
html.write_text(h, encoding='utf-8')

css = Path('styles.css')
c = css.read_text(encoding='utf-8')
marker = '/* ---------- AGENDAMENTO · REVISÃO: CHEVRON ÚNICO ---------- */'
if marker not in c:
    c += r'''

/* ---------- AGENDAMENTO · REVISÃO: CHEVRON ÚNICO ---------- */
/* Remove o antigo "+" textual herdado e usa apenas um chevron dentro do
   controle circular, mantendo a leitura limpa do expansor. */
.rev-inclui summary::after{
  content:none !important;
  display:none !important;
}
.rev-inclui summary i{
  transition:transform .25s ease, border-color .25s ease, background .25s ease;
}
.rev-inclui summary i::before{
  content:'›';
  width:auto;
  height:auto;
  background:none;
  color:var(--gold-light);
  font-family:'Jost',sans-serif;
  font-size:1.12rem;
  font-weight:300;
  line-height:1;
  transform:translate(-50%,-54%);
}
.rev-inclui summary i::after{
  content:none;
  display:none;
}
.rev-inclui[open] summary i{
  transform:rotate(90deg);
  border-color:rgba(201,162,75,.38);
  background:rgba(201,162,75,.05);
}
'''
    css.write_text(c, encoding='utf-8')
