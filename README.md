# 🏭 Fábrica Escola – Simulação Industrial para Jovens Aprendizes

Aplicativo web educativo que simula **uma fábrica completa**, do portão de entrada até o caminhão de entrega,
com desafios, um simulador de linha de produção em tempo real, jogos e ranking da turma.

Não precisa instalar nada nem ter internet: basta abrir o arquivo `index.html` em qualquer navegador
(Chrome, Edge, Firefox) no computador, tablet ou celular.

---

## ▶️ Como usar

1. Baixe ou clone este repositório.
2. Dê dois cliques em **`index.html`**.
3. Cada aprendiz informa **nome e turma** e começa a jogar.
4. Vários aprendizes podem usar o mesmo computador: basta trocar de aprendiz na tela inicial.

> Os dados ficam salvos **no próprio navegador** (localStorage). Para juntar os resultados da turma,
> use **Ranking → Exportar planilha (CSV)** em cada computador e abra no Excel/Google Planilhas.

**Opcional – publicar online:** ative o *GitHub Pages* neste repositório (Settings → Pages → branch principal, pasta `/root`)
e compartilhe o link com a turma.

---

## 🧭 Módulos

### 1. Jornada na Fábrica (8 setores)
Cada setor tem uma parte de **teoria** ("O que você precisa saber") e um **desafio prático**.
É preciso tirar pelo menos **50 pontos** para liberar o próximo setor. Ao concluir todos, o aprendiz recebe
um **certificado** para imprimir ou salvar em PDF.

| # | Setor | Conteúdo | Desafio |
|---|-------|----------|---------|
| 1 | 🦺 Portaria e Segurança | NR-6 (EPI), NR-12 (máquinas), EPC, cores de segurança | Escolher os EPIs do torno e da solda; quiz de sinalização |
| 2 | 📥 Recebimento de Matéria-Prima | Nota fiscal × pedido, inspeção, certificado, quarentena | Aceitar/recusar lotes de aço comparando com o pedido |
| 3 | 🗄️ Almoxarifado e Estoque | PEPS/FIFO, endereçamento, ponto de pedido, inventário, Kanban | Liberar lotes pela ordem PEPS; calcular ponto de pedido |
| 4 | 📊 Planejamento (PCP) | Ordem de produção, capacidade, eficiência, gargalo, lead time | Cálculos de capacidade e identificação do gargalo |
| 5 | ⚙️ Produção e Usinagem | Corte, usinagem, dobra, solda, acabamento, setup, TPM | Ordenar a ficha de processo; checklist antes de ligar a máquina |
| 6 | 🔧 Montagem | Instrução de trabalho, torque, Poka-Yoke, ergonomia (NR-17) | Ordenar a montagem de um ventilador; quiz de boas práticas |
| 7 | 🔍 Controle de Qualidade | Tolerância, instrumentos, não conformidade, retrabalho × refugo, PDCA | Aprovar/reprovar peças pela leitura do micrômetro (valores sorteados) |
| 8 | 🚚 Embalagem e Expedição | Identificação, rastreabilidade, NF de saída, carregamento | Montar a carga do caminhão sem exceder 1000 kg e com os pedidos urgentes |

### 2. Simulador de Linha de Produção
O aprendiz é o **líder do turno** (06:00 às 14:00, ~2,5 minutos reais) de uma linha com 5 postos:
Corte → Usinagem → Montagem → Qualidade → Expedição. Meta: **50 peças boas**.

- Distribuir **10 operadores** entre os postos (mais operadores = posto mais rápido).
- Encontrar e atacar o **gargalo** (o app destaca o posto mais lento e mostra as filas entre os postos).
- **Chamar a manutenção** quando uma máquina quebrar e fazer **manutenção preventiva** quando o desgaste subir.
- **Pedir matéria-prima** antes de acabar (a entrega demora).
- Ao final: peças boas, atingimento da meta, índice de qualidade, quebras, ocupação de cada posto e **lições do turno**.

### 3. Jogos
| Jogo | O que treina |
|------|--------------|
| ⚡ Quiz Relâmpago de Segurança | NRs, CIPA, CAT, incêndio, mapa de riscos – com cronômetro |
| 🕵️ Caça aos Riscos | Identificar atos e condições inseguras no chão de fábrica |
| 🧹 Desafio 5S | Reconhecer Seiri, Seiton, Seiso, Seiketsu e Shitsuke em situações reais |
| 🧠 Memória das Ferramentas | Associar EPIs e ferramentas às suas funções |
| 🔩 Inspetor na Esteira | Atenção e tolerância dimensional: barrar peças fora da medida |

### 4. Ranking da Turma
Soma das **melhores notas** de cada atividade (14 atividades × 100 pontos). Filtro por turma, pódio,
detalhes por aprendiz e exportação para planilha.

---

## 👩‍🏫 Sugestão de roteiro para o instrutor

| Encontro | Atividade | Tempo |
|----------|-----------|-------|
| 1 | Setores 1 e 2 + jogo *Caça aos Riscos* + discussão sobre EPIs do laboratório | 50 min |
| 2 | Setores 3 e 4 + *Desafio 5S* | 50 min |
| 3 | Simulador de Linha (em duplas: um opera, o outro anota onde está o gargalo) | 50 min |
| 4 | Setores 5 e 6 + *Memória das Ferramentas* | 50 min |
| 5 | Setores 7 e 8 + *Inspetor na Esteira* + medição real com paquímetro | 50 min |
| 6 | Torneio: *Quiz Relâmpago* e melhor turno no simulador; entrega dos certificados | 50 min |

Dicas:
- Projete o **Simulador de Linha** no quadro e faça a turma decidir junta onde colocar os operadores.
- Após cada setor, peça que os aprendizes relacionem o conteúdo com a empresa onde fazem a prática.
- O ranking pode ser zerado em **Ranking → Apagar todos** para iniciar uma nova turma.

---

## 🛠️ Para quem quiser editar o conteúdo

Tudo é HTML, CSS e JavaScript puro, sem dependências:

```
index.html          Página principal
css/style.css       Visual
js/core.js          Armazenamento, navegação, utilidades
js/componentes.js   Tipos de desafio (quiz, múltipla seleção, ordenar, classificar)
js/etapas.js        Os 8 setores da jornada (teoria + perguntas)  ← edite aqui as perguntas
js/linha.js         Simulador de linha de produção (parâmetros em LinhaCfg)
js/jogos.js         Os 5 jogos e seus bancos de perguntas
js/app.js           Tela inicial e ranking
```

- Para mudar perguntas, edite os arrays `perguntas` em `js/etapas.js` ou `BancoSeguranca` em `js/jogos.js`
  (a alternativa correta é indicada por `c`, começando em 0; as opções são embaralhadas automaticamente).
- Para deixar o simulador mais fácil ou difícil, altere `meta`, `duracao` e `operadores` em `LinhaCfg` (`js/linha.js`).
- A nota mínima para avançar de setor é `NOTA_MINIMA` em `js/etapas.js`.
