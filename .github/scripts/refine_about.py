from pathlib import Path

p = Path('sobre.html')
s = p.read_text(encoding='utf-8')

if 'sobre-editorial.css' not in s:
    s = s.replace('<link rel="stylesheet" href="styles.css">', '<link rel="stylesheet" href="styles.css">\n<link rel="stylesheet" href="sobre-editorial.css">', 1)

start = s.index('  <section class="tight">')
end = s.index('</main>', start)

replacement = '''  <section class="about-editorial">
    <div class="wrap">
      <div class="about-section about-intro reveal">
        <div class="about-copy">
          <div class="about-kicker">Quem somos</div>
          <h2 class="about-heading">Michele &amp; Wellington Araújo</h2>
          <p>Somos Michele Araújo e Wellington Araújo, casal, pais e fotógrafos. O Studio Araújo nasceu da união da nossa família, da paixão pela fotografia e da certeza de que Deus nos chamou para transformar momentos em memórias que atravessam gerações.</p>
        </div>
        <figure class="about-photo-primary">
          <img src="assets/foto-equipe.jpg" width="900" height="1224" alt="Michele Araújo e Wellington Araújo, fotógrafos do Studio Araújo" loading="lazy" decoding="async">
          <figcaption class="about-photo-caption">Michele &amp; Wellington Araújo</figcaption>
        </figure>
      </div>

      <div class="about-section about-history reveal">
        <div class="about-history-head">
          <div class="about-kicker">Nossa história</div>
          <h2 class="about-heading">2015 → 2020 → hoje</h2>
        </div>
        <div class="about-timeline">
          <div class="about-era"><span class="about-year">2015</span><p>Nossa história na fotografia começou em 2015, em Sítio Alegre. Iniciamos fotografando eventos e, desde os primeiros trabalhos, fomos acolhidos com muito carinho pela nossa cidade. A confiança dos nossos clientes nos permitiu crescer e levar nosso trabalho para diversas cidades da região norte do Ceará.</p></div>
          <div class="about-era"><span class="about-year">2020</span><p>Em 2020, nasceu um novo capítulo: o Studio Araújo. O que começou com as tradicionais sessões de Natal logo se transformou em um espaço pensado para registrar a maternidade, o crescimento das crianças, os laços familiares e tantos outros momentos especiais.</p></div>
          <div class="about-era"><span class="about-year">Hoje</span><p>Seguimos investindo em conhecimento, equipamentos, estrutura e atendimento, porque acreditamos que a excelência é uma forma de honrar a confiança de quem nos escolhe.</p></div>
        </div>
      </div>

      <div class="about-section about-beliefs reveal">
        <div>
          <div class="about-kicker">O que acreditamos</div>
          <h2 class="about-heading">Experiência, acolhimento, excelência e memória.</h2>
        </div>
        <div class="about-copy about-beliefs-copy"><p>Acreditamos que fotografar vai muito além de fazer belas imagens. É acolher pessoas, eternizar sentimentos e contar histórias de forma verdadeira. Por isso, buscamos oferecer uma experiência leve, personalizada e cheia de significado para cada família que passa por nosso estúdio.</p></div>
      </div>

      <div class="about-section about-family reveal">
        <div class="about-family-head">
          <div class="about-kicker">Nossa família / nossa essência</div>
          <h2 class="about-heading">O que existe por trás de cada história que contamos.</h2>
        </div>
        <div class="about-family-story">
          <figure class="about-family-photo">
            <img src="assets/familia-araujo.jpg" width="1000" height="698" alt="Família Araújo" loading="lazy" decoding="async">
            <figcaption class="about-photo-caption">Nossa família</figcaption>
          </figure>
          <div class="about-copy about-family-copy">
            <p>Nossa família é formada por cinco filhos: Matheus, Arthur, Israel, Davi e Eva. Matheus e Arthur vivem para sempre em nossos corações. Israel, Davi e Eva são a nossa alegria diária e a inspiração para fazermos cada trabalho com ainda mais amor e dedicação.</p>
            <p>Mais do que uma empresa, o Studio Araújo é um sonho que nasceu em oração, foi confiado a Deus desde o início e continua sendo construído todos os dias com fé, dedicação e gratidão.</p>
          </div>
        </div>
        <blockquote class="about-closing"><p>Seja bem-vindo ao Studio Araújo. Será uma alegria contar um pedacinho da sua história através do nosso olhar.</p></blockquote>
      </div>
    </div>
  </section>
'''

s = s[:start] + replacement + s[end:]

checks = [
    'Somos Michele Araújo e Wellington Araújo, casal, pais e fotógrafos.',
    'Nossa família é formada por cinco filhos: Matheus, Arthur, Israel, Davi e Eva.',
    'Nossa história na fotografia começou em 2015, em Sítio Alegre.',
    'Em 2020, nasceu um novo capítulo: o Studio Araújo.',
    'Acreditamos que fotografar vai muito além de fazer belas imagens.',
    'Seguimos investindo em conhecimento, equipamentos, estrutura e atendimento,',
    'Mais do que uma empresa, o Studio Araújo é um sonho que nasceu em oração,',
    'Seja bem-vindo ao Studio Araújo. Será uma alegria contar um pedacinho da sua história através do nosso olhar.'
]
for text in checks:
    assert text in s, text

p.write_text(s, encoding='utf-8')
