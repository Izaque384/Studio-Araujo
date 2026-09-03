// Dados de preços e pacotes do Studio Araújo — FONTE ÚNICA.
// Este arquivo é usado por DUAS páginas:
//   • servicos.html  -> monta os modais "Mais informações"
//   • agendamento.html -> mostra o valor do serviço escolhido
// Altere um preço aqui e ele muda nos dois lugares automaticamente.

const servicePackages = {
  formatura: {
    title: "Sessão de Formatura com Beca",
    price: "R$ 200,00",
    items: [
      "1 cenário montado no estúdio",
      "Uso da beca (inclusa no valor)",
      "20 fotos digitais tratadas e entregues em alta qualidade",
      "Participação da família (até 4 pessoas)"
    ],
    note: "Um momento tão importante merece um registro especial! Venha viver essa experiência e eternizar sua conquista de formatura com todo o carinho e cuidado do nosso estúdio."
  },

  aniversario: {
    title: "Pacotes de Aniversário",
    options: [
      {
        name: "Cobertura de Evento",
        price: "R$ 400,00",
        items: [
          "Cobertura completa do evento",
          "Sem limite de fotos",
          "Todas as imagens entregues em alta qualidade e formato digital",
          "Edição básica inclusa para realce das melhores lembranças",
          "Entrega rápida e prática via link online"
        ]
      },
      {
        name: "Sessão Feminina em Estúdio",
        price: "R$ 200,00",
        items: [
          "Sessão fotográfica no Studio Araújo",
          "20 fotos digitais em alta resolução",
          "Entrega por link do Google Fotos"
        ]
      }
    ],
    extra: "Foto extra (sessão em estúdio): R$ 10,00",
    note: "Qualidade, dedicação e sensibilidade para eternizar seu aniversário da melhor forma!"
  },

  abc: {
    title: "Sessão de ABC",
    options: [
      {
        name: "Opção 1 — Sessão Individual",
        price: "R$ 100,00",
        items: [
          "Sessão fotográfica no Studio Araújo (exclusiva com a criança)",
          "Uso da beca, trono e toda a composição da sessão",
          "10 fotos digitais em alta resolução",
          "Entrega por link do Google Fotos"
        ]
      },
      {
        name: "Opção 2 — Com Participação Familiar",
        price: "R$ 200,00",
        items: [
          "Sessão fotográfica no Studio Araújo",
          "Uso da beca, trono e toda a composição da sessão",
          "Participação dos familiares",
          "20 fotos digitais em alta resolução",
          "Entrega por link do Google Fotos"
        ]
      }
    ],
    extra: "Foto extra: R$ 10,00",
    note: "Será um prazer registrar essa conquista tão especial!"
  },

  casamento: {
    title: "Orçamentos de Casamento",
    options: [
      {
        name: "Cobertura do Casamento",
        price: "R$ 1.000,00",
        items: [
          "Making of da noiva: preparação com maquiagem, cabelo e vestido (aprox. 1h)",
          "Cerimônia na igreja: entrada, cerimônia religiosa e saída dos noivos (aprox. 1h)",
          "Recepção: chegada dos noivos, cumprimentos, bolo, brinde, dança e demais momentos (aprox. 2h)",
          "Fotos tratadas e entregues em alta resolução via link do Google Photos, em até 20 dias úteis",
          "Deslocamento combinado previamente conforme a localização do evento",
          "Pagamento: entrada de R$ 300,00 para reserva da data + R$ 700,00 até o dia do evento (ou conforme combinado)"
        ]
      },
      {
        name: "Casamento Civil",
        price: "R$ 300,00",
        items: [
          "Cobertura fotográfica da cerimônia de casamento civil",
          "Todas as fotos realizadas durante a cobertura são entregues, sem limite de quantidade",
          "Entrega de todas as fotos editadas em formato digital"
        ]
      },
      {
        name: "Casamento Civil + Recepção",
        price: "R$ 500,00",
        items: [
          "Cobertura fotográfica da cerimônia de casamento civil",
          "Cobertura fotográfica da recepção",
          "Todas as fotos realizadas durante a cobertura são entregues, sem limite de quantidade",
          "Entrega de todas as fotos editadas em formato digital"
        ]
      }
    ],
    note: "Será um prazer registrar esse momento tão especial da história de vocês!"
  },

  "ensaio-casal": {
    title: "Ensaio de Casal em Estúdio",
    price: "R$ 200,00",
    items: [
      "Sessão fotográfica de casal realizada no Studio Araújo",
      "20 fotos digitais editadas em alta qualidade",
      "Todas as fotos da sessão são disponibilizadas para o casal escolher as 20 melhores",
      "Entrega digital via Google Fotos"
    ]
  },

  "pre-wedding": {
    title: "Pré-Wedding — Ensaio Externo de Casal",
    price: "R$ 400,00",
    items: [
      "Sessão fotográfica de casal (pré-wedding) em local externo",
      "30 fotos digitais editadas em alta qualidade",
      "Todas as fotos da sessão são disponibilizadas para o casal escolher as 30 melhores",
      "Entrega digital via Google Fotos",
      "Locais a mais de 10 km do Studio Araújo: taxa de deslocamento informada no agendamento, conforme o local"
    ]
  },

  "cha-revelacao": {
    title: "Chá Revelação",
    options: [
      {
        name: "Opção 1 — No Studio",
        price: "R$ 250,00",
        items: [
          "Sessão de chá revelação realizada no Studio Araújo",
          "15 fotos digitais editadas em alta qualidade",
          "1 mini vídeo do momento da revelação",
          "A forma da revelação será combinada previamente",
          "Materiais da revelação (balões, caixa, confetes etc.) por conta do cliente — o Studio realiza a cobertura em fotos e vídeo",
          "Por segurança, não é permitido fumaça colorida nem confetes explosivos no estúdio; apenas confetes soltos, lançados manualmente"
        ]
      },
      {
        name: "Opção 2 — No Studio",
        price: "R$ 300,00",
        items: [
          "Sessão de chá revelação realizada no Studio Araújo",
          "30 fotos digitais editadas em alta qualidade",
          "1 mini vídeo do momento da revelação",
          "A forma da revelação será combinada previamente",
          "Materiais da revelação por conta do cliente — o Studio realiza a cobertura em fotos e vídeo",
          "Por segurança, não é permitido fumaça colorida nem confetes explosivos no estúdio; apenas confetes soltos, lançados manualmente"
        ]
      },
      {
        name: "Opção 3 — Externo",
        price: "R$ 400,00",
        items: [
          "Sessão de chá revelação em local externo",
          "30 fotos digitais editadas em alta qualidade",
          "1 mini vídeo do momento da revelação",
          "Materiais da revelação por conta do cliente",
          "Locais a mais de 10 km do Studio Araújo: taxa de deslocamento informada no agendamento"
        ]
      }
    ]
  },

  "acompanhamento-mensal": {
    title: "Sessão de Acompanhamento Mensal",
    price: "R$ 100,00 por sessão",
    items: [
      "Sessão fotográfica no Studio Araújo",
      "10 fotos digitais em alta resolução",
      "Entrega das fotos por link do Google Fotos para download"
    ],
    extra: "Foto extra: R$ 10,00",
    note: "O acompanhamento mensal é uma forma especial de registrar o crescimento e cada nova fase do bebê ao longo do primeiro ano de vida. Fechando o pacote dos 12 meses: descontos exclusivos nas sessões temáticas de Natal, Dia das Mães e Dia dos Pais, e participação dos familiares em todas as sessões, sem custo adicional. Acompanhe cada fase do crescimento do seu bebê e transforme esses momentos em lembranças para toda a vida."
  },

  gestante: {
    title: "Pacotes Sessão Gestante em Estúdio",
    options: [
      {
        name: "Opção 1",
        price: "R$ 300,00",
        items: [
          "30 fotos digitais já editadas",
          "Sessão em estúdio (40 min)",
          "1 look do estúdio"
        ]
      },
      {
        name: "Opção 2",
        price: "R$ 250,00",
        items: [
          "15 fotos digitais já editadas",
          "Sessão em estúdio (40 min)",
          "1 look do estúdio"
        ]
      },
      {
        name: "Opção 3 — Ensaio Externo",
        price: "R$ 350,00",
        items: [
          "Ensaio externo (local a combinar), duração de até 1h30",
          "Direção de poses durante todo o ensaio",
          "1 look do estúdio incluso",
          "30 fotos editadas profissionalmente",
          "Entrega via Google Fotos em até 10 dias úteis após a escolha das fotos",
          "Deslocamento incluso em até 10 km da base do estúdio (acima disso, taxa à parte)",
          "Em caso de chuva, reagendamento sem custo",
          "Look extra do estúdio: R$ 30,00 · Fotos adicionais: R$ 10,00 cada · Pen drive: R$ 40,00 · Álbum: sob consulta",
          "Pagamento: 50% na reserva da data + 50% no dia do ensaio (Pix, transferência ou dinheiro)"
        ]
      }
    ],
    delivery: "Em até 10 dias",
    extra: "Foto extra: R$ 10,00",
    note: "Consulte nosso catálogo de looks disponíveis no estúdio."
  },

  corporativa: {
    title: "Sessão Corporativa",
    price: "R$ 200,00",
    items: [
      "Duração de 40 minutos",
      "Até 3 looks por sessão",
      "Direção e orientação durante toda a sessão",
      "20 fotos digitais tratadas e em alta resolução",
      "Envio das imagens via link para download"
    ],
    delivery: "10 dias úteis após a sessão"
  },

  moda: {
    title: "Fotografia de Moda",
    price: "R$ 25,00 por look (peça de roupa)",
    items: [
      "Entrega de 3 fotos tratadas por look",
      "Envio em alta resolução via link online",
      "Prazo de entrega: 10 dias úteis"
    ],
    extra: "Look adicional: R$ 25,00 · Foto extra: R$ 8,00",
    note: "Valor válido para o mínimo de 10 looks."
  },

  albuns: {
    title: "Álbum Fotográfico Diagramado",
    options: [
      { name: "Álbum 30x30", price: "R$ 980,00" },
      { name: "Álbum 25x25", price: "R$ 820,00" },
      { name: "Álbum 20x30", price: "R$ 820,00" },
      { name: "Álbum 20x20", price: "R$ 690,00" },
      { name: "Álbum 15x21", price: "R$ 470,00" }
    ],
    note: "Capa personalizada, 30 páginas (15 lâminas) e acabamento premium. Memórias que ficam para sempre — feito para durar gerações."
  },

  luva: {
    title: "Luva / Estojo",
    options: [
      { name: "Luva 30x30 / 25x25", price: "R$ 130,00" },
      { name: "Luva 20x30", price: "R$ 115,00" },
      { name: "Luva 20x20", price: "R$ 115,00" },
      { name: "Luva 15x21", price: "R$ 95,00" }
    ],
    note: "Revestida em courino. Proteção e elegância para suas fotografias e memórias."
  },

  maleta: {
    title: "Maleta / Estojo",
    options: [
      { name: "Maleta 30x30 / 25x25", price: "R$ 210,00" },
      { name: "Maleta 20x30", price: "R$ 190,00" },
      { name: "Maleta 20x20", price: "R$ 190,00" },
      { name: "Maleta 15x21", price: "R$ 160,00" }
    ],
    note: "Revestida em courino, com fecho e pegador. Sofisticação, proteção e praticidade para guardar suas memórias com carinho."
  },

  caixa: {
    title: "Caixa para Fotos",
    options: [
      { name: "Caixa 30x30 / 25x25", price: "R$ 226,00" },
      { name: "Caixa 20x30", price: "R$ 209,00" },
      { name: "Caixa 20x20", price: "R$ 209,00" },
      { name: "Caixa 15x21", price: "R$ 170,00" }
    ],
    note: "Revestida em courino. Acabamento premium para suas fotografias e momentos especiais — elegância que protege memórias."
  }

  // ✎ Para adicionar os demais serviços, copie um dos blocos acima e ajuste a chave
  // (deve ser igual ao "data-service" do botão no servicos.html).
  // Use "options" para pacotes com mais de uma opção de preço,
  // "price" + "items" para pacote único, ou "sections" para dividir em etapas.
};

const serviceLabels = {
  casamento: "Casamentos",
  aniversario: "Aniversários",
  abc: "ABC",
  formatura: "Formaturas",
  "cha-revelacao": "Chá Revelação",
  gestante: "Ensaios de Gestante",
  "acompanhamento-mensal": "Acompanhamento Mensal",
  corporativa: "Sessão Corporativa",
  moda: "Moda",
  batizado: "Batizados",
  "ensaio-casal": "Ensaio de Casal",
  "pre-wedding": "Pré-Wedding",
  albuns: "Álbuns Fotográficos",
  luva: "Luva / Estojo",
  maleta: "Maleta / Estojo",
  caixa: "Caixa para Fotos"
};
