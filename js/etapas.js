/* =========================================================
   Jornada na Fábrica – as etapas do processo produtivo
   ========================================================= */
'use strict';

const NOTA_MINIMA = 50; // nota para liberar a próxima etapa

/* ---------- Desafios especiais ---------- */

// Controle de qualidade: medições geradas aleatoriamente
function desafioMedicoes(el, done) {
  const nominal = 25.00, tol = 0.05;
  const valores = new Set();
  const dentro = () => +(nominal + aleatorio(-tol, tol)).toFixed(2);
  const fora = () => +(nominal + (Math.random() < .5 ? -1 : 1) * aleatorio(tol + 0.01, tol + 0.08)).toFixed(2);
  valores.add(+(nominal + tol).toFixed(2)); // um valor exatamente no limite
  while (valores.size < 4) valores.add(dentro());
  while (valores.size < 8) valores.add(fora());
  const itens = [...valores].map((v, k) => {
    const ok = Math.abs(v - nominal) <= tol + 1e-9;
    return {
      html: `<span class="medida">🔩 Peça ${String(k + 1).padStart(2, '0')}</span> <b class="leitura">Ø ${fmt(v)} mm</b>`,
      resp: ok ? 'a' : 'r',
      exp: ok ? `Dentro da faixa 24,95 a 25,05 mm${Math.abs(v - 25.05) < 1e-9 ? ' (no limite ainda é aprovada!)' : ''}.`
              : `Fora da faixa: desvio de ${fmt(Math.abs(v - nominal))} mm (máx. 0,05).`
    };
  });
  Comp.classificar(el, {
    titulo: '📏 Inspeção dimensional',
    enunciado: 'Desenho: <b>eixo Ø 25,00 ± 0,05 mm</b>. As leituras do micrômetro estão abaixo. Aprove ou reprove cada peça.',
    opcoes: [{ v: 'a', t: '✅ Aprovada', cls: 'verde' }, { v: 'r', t: '⛔ Reprovada', cls: 'vermelho' }],
    itens
  }, done);
}

// Expedição: montar a carga do caminhão
function desafioCaminhao(el, done) {
  const CAP = 1000;
  const pedidos = embaralhar([
    { id: 'A', cli: 'Metalúrgica Alfa', kg: 300, prazo: 'Hoje', urg: true },
    { id: 'B', cli: 'Auto Peças Beta', kg: 250, prazo: 'Hoje', urg: true },
    { id: 'C', cli: 'Construtora Gama', kg: 400, prazo: 'Amanhã' },
    { id: 'D', cli: 'Indústria Delta', kg: 200, prazo: 'Amanhã' },
    { id: 'E', cli: 'Comércio Épsilon', kg: 150, prazo: '3 dias' },
    { id: 'F', cli: 'Usina Zeta', kg: 500, prazo: '3 dias' },
    { id: 'G', cli: 'Oficina Eta', kg: 100, prazo: '5 dias' }
  ]);
  const sel = new Set();
  let fim = false;
  const render = () => {
    const carga = pedidos.filter(p => sel.has(p.id)).reduce((s, p) => s + p.kg, 0);
    const pct = carga / CAP * 100;
    el.innerHTML = `
      <h3>🚚 Montagem da carga</h3>
      <p class="enunciado">O caminhão suporta <b>${CAP} kg</b>. Selecione os pedidos que vão sair hoje.
        Regra: <b>os pedidos com prazo "Hoje" são obrigatórios</b> e o caminhão deve sair o mais cheio possível, <b>sem exceder o limite</b>.</p>
      <div class="caminhao">
        <div class="caminhao-bau"><div class="caminhao-carga ${carga > CAP ? 'excesso' : ''}" style="width:${Math.min(pct, 100)}%"></div>
          <span>${carga} / ${CAP} kg</span></div>
        <div class="caminhao-cabine">🚛</div>
      </div>
      <table class="tabela">
        <thead><tr><th></th><th>Pedido</th><th>Cliente</th><th>Peso</th><th>Prazo</th></tr></thead>
        <tbody>${pedidos.map(p => `
          <tr class="${sel.has(p.id) ? 'sel' : ''}" data-id="${p.id}">
            <td><input type="checkbox" ${sel.has(p.id) ? 'checked' : ''} ${fim ? 'disabled' : ''} aria-label="Pedido ${p.id}"></td>
            <td>#${p.id}</td><td>${p.cli}</td><td>${p.kg} kg</td>
            <td>${p.urg ? '<span class="pilula vermelho">Hoje</span>' : p.prazo}</td></tr>`).join('')}
        </tbody>
      </table>
      <div class="feedback">${el._fb || ''}</div>
      <div class="acoes">${fim ? '<button class="btn" id="cont">Continuar ➜</button>'
        : '<button class="btn" id="despachar">Despachar caminhão</button>'}</div>`;
    if (fim) { $('#cont', el).onclick = () => done(el._pontos); return; }
    $$('tbody tr', el).forEach(tr => tr.onclick = () => {
      const id = tr.dataset.id;
      sel.has(id) ? sel.delete(id) : sel.add(id);
      render();
    });
    $('#despachar', el).onclick = () => {
      if (!sel.size) { toast('Selecione ao menos um pedido.', 'aviso'); return; }
      fim = true;
      const urgTot = pedidos.filter(p => p.urg).length;
      const urgSel = pedidos.filter(p => p.urg && sel.has(p.id)).length;
      let pontos, texto;
      if (carga > CAP) {
        pontos = 0;
        texto = `Excesso de ${carga - CAP} kg! Sobrecarga é infração de trânsito, danifica o veículo e causa acidentes. O caminhão foi barrado na balança.`;
      } else {
        pontos = 50 * (urgSel / urgTot) + 50 * (carga / CAP);
        texto = `Carga de ${carga} kg (${Math.round(pct)}% de ocupação). Pedidos urgentes embarcados: ${urgSel} de ${urgTot}.`;
      }
      el._pontos = pontos;
      el._fb = Comp._resumo(pontos, texto, [],
        'Uma das soluções ótimas: A + B + D + E + G = 1000 kg. Priorize prazos e aproveite a capacidade para reduzir o custo do frete.');
      render();
    };
  };
  render();
}

/* ---------- Definição das etapas ---------- */
const Etapas = [
  {
    id: 'seguranca', titulo: 'Portaria e Segurança', icone: '🦺', setor: 'Entrada da fábrica',
    objetivo: 'Conhecer os EPIs e a sinalização de segurança antes de entrar na área produtiva.',
    teoria: `
      <p>Antes de qualquer atividade, todo trabalhador passa pela <b>integração de segurança</b>. Nenhuma produção vale mais do que a vida.</p>
      <ul>
        <li><b>EPI (Equipamento de Proteção Individual)</b> – regulamentado pela <b>NR-6</b>. Deve ter <b>CA (Certificado de Aprovação)</b>, ser usado corretamente e conservado.</li>
        <li><b>EPC (Equipamento de Proteção Coletiva)</b> – protege todos: guarda-corpos, proteções de máquinas, exaustores, sinalização.</li>
        <li><b>NR-12</b> – segurança em máquinas: proteções fixas, botão de emergência, nunca remover proteções.</li>
        <li>Perto de máquinas rotativas (torno, furadeira) <b>não use anéis, relógios, correntes, cabelo solto nem luvas</b>: podem ser puxados pela máquina.</li>
      </ul>
      <div class="cores-seg">
        <span style="background:#d32f2f">Vermelho: combate a incêndio</span>
        <span style="background:#f9a825;color:#222">Amarelo: atenção / cuidado</span>
        <span style="background:#2e7d32">Verde: segurança / primeiros socorros</span>
        <span style="background:#1565c0">Azul: ação obrigatória</span>
      </div>`,
    partes: [
      {
        tipo: 'multiSelect', titulo: '⚙️ Setor de Usinagem (torno)',
        enunciado: 'Você vai operar um <b>torno mecânico</b>. Selecione <b>tudo</b> que é obrigatório ou adequado:',
        itens: [
          { t: 'Óculos de proteção', i: '🥽', ok: true, exp: 'Cavacos e fluido de corte podem atingir os olhos.' },
          { t: 'Protetor auricular', i: '🎧', ok: true, exp: 'O ruído da usinagem pode causar perda auditiva.' },
          { t: 'Calçado de segurança', i: '🥾', ok: true, exp: 'Protege contra queda de peças e cavacos.' },
          { t: 'Uniforme justo, mangas fechadas', i: '👕', ok: true, exp: 'Roupas soltas podem enroscar nas partes giratórias.' },
          { t: 'Luvas', i: '🧤', ok: false, exp: 'Em máquinas rotativas a luva pode ser puxada junto com a mão!' },
          { t: 'Relógio e anel', i: '⌚', ok: false, exp: 'Adornos podem enroscar na máquina (NR-12).' },
          { t: 'Fone de música', i: '🎵', ok: false, exp: 'Tira a atenção e impede ouvir alarmes.' },
          { t: 'Chinelo', i: '🩴', ok: false, exp: 'Nunca! O pé fica totalmente exposto.' }
        ]
      },
      {
        tipo: 'multiSelect', titulo: '🔥 Setor de Soldagem',
        enunciado: 'Agora você vai <b>soldar</b> uma estrutura. Selecione os EPIs necessários:',
        itens: [
          { t: 'Máscara de solda', i: '😷', ok: true, exp: 'Protege olhos e rosto da radiação UV/IR e respingos.' },
          { t: 'Luva de raspa', i: '🧤', ok: true, exp: 'Na solda a luva de raspa é obrigatória contra calor e respingos.' },
          { t: 'Avental de raspa', i: '🥼', ok: true, exp: 'Protege o tronco de respingos e radiação.' },
          { t: 'Perneira / mangote', i: '🦵', ok: true, exp: 'Protege pernas e braços das fagulhas.' },
          { t: 'Calçado de segurança', i: '🥾', ok: true, exp: 'Protege os pés de peças quentes e quedas.' },
          { t: 'Camiseta sintética', i: '👚', ok: false, exp: 'Tecido sintético derrete com fagulhas e gruda na pele.' },
          { t: 'Óculos escuros comuns', i: '🕶️', ok: false, exp: 'Não filtram a radiação do arco elétrico.' }
        ]
      },
      {
        tipo: 'quiz', titulo: '🚦 Sinalização de segurança', quantidade: 4,
        perguntas: [
          { p: 'Qual cor indica equipamentos de combate a incêndio (extintores, hidrantes)?', op: ['Vermelho', 'Verde', 'Azul', 'Amarelo'], c: 0 },
          { p: 'Uma placa azul com o desenho de um protetor auricular significa:', op: ['Uso obrigatório de protetor auricular', 'Proibido fazer barulho', 'Local de primeiros socorros', 'Risco de choque'], c: 0, exp: 'Azul = ação obrigatória.' },
          { p: 'Você percebeu que a proteção de uma máquina foi retirada. O que fazer?', op: ['Parar, não operar e avisar o supervisor', 'Operar com mais cuidado', 'Colocar luvas e continuar', 'Esperar o fim do turno para avisar'], c: 0, exp: 'A NR-12 proíbe operar máquinas sem as proteções. Comunique imediatamente.' },
          { p: 'O que significa CA em um EPI?', op: ['Certificado de Aprovação', 'Controle de Acesso', 'Carga Admissível', 'Código do Almoxarifado'], c: 0, exp: 'Todo EPI vendido no Brasil precisa ter CA emitido pelo Ministério do Trabalho (NR-6).' },
          { p: 'Faixas amarelas e pretas pintadas no piso ou em obstáculos indicam:', op: ['Atenção, risco de batida ou queda', 'Área de descanso', 'Saída de emergência', 'Área de primeiros socorros'], c: 0 }
        ]
      }
    ]
  },

  {
    id: 'recebimento', titulo: 'Recebimento de Matéria-Prima', icone: '📥', setor: 'Doca de recebimento',
    objetivo: 'Conferir o material que chega dos fornecedores e decidir se pode entrar na fábrica.',
    teoria: `
      <p>Tudo começa com a <b>matéria-prima</b>. Se um material errado entrar, todo o resto do processo será perdido.</p>
      <ul>
        <li>Confira a <b>Nota Fiscal (NF)</b> com o <b>Pedido de Compra</b>: material, quantidade, dimensões e preço.</li>
        <li>Faça a <b>inspeção de recebimento</b>: embalagem, avarias, identificação e medição por amostragem.</li>
        <li>Exija o <b>certificado de qualidade</b> do fornecedor (composição química, propriedades mecânicas).</li>
        <li>Material com problema é <b>recusado</b> ou fica <b>segregado</b> (área de quarentena) até decisão.</li>
      </ul>
      <div class="cartao-doc">
        <b>📄 Pedido de Compra nº 4521</b><br>
        Material: <b>Barra redonda de aço SAE 1020</b> · Diâmetro: <b>Ø 25 mm</b> · Comprimento: <b>6 m</b><br>
        Quantidade: 250 barras (5 lotes de 50) · Exigência: <b>certificado de qualidade</b> em todos os lotes
      </div>`,
    partes: [
      {
        tipo: 'classificar', titulo: '📦 Inspeção dos lotes recebidos',
        enunciado: 'Compare cada lote com o <b>Pedido de Compra nº 4521</b> (aço SAE 1020, Ø 25 mm, 6 m, com certificado).',
        opcoes: [{ v: 'a', t: '✅ Aceitar', cls: 'verde' }, { v: 'r', t: '⛔ Recusar', cls: 'vermelho' }],
        itens: [
          { html: '<b>Lote 01</b> · SAE 1020 · Ø 25 mm · 6 m · 50 barras · Certificado ✔', resp: 'a', exp: 'Tudo conforme o pedido.' },
          { html: '<b>Lote 02</b> · SAE <b>1045</b> · Ø 25 mm · 6 m · 50 barras · Certificado ✔', resp: 'r', exp: 'Material diferente do pedido (1045 em vez de 1020).' },
          { html: '<b>Lote 03</b> · SAE 1020 · Ø <b>20 mm</b> · 6 m · 50 barras · Certificado ✔', resp: 'r', exp: 'Diâmetro errado: 20 mm em vez de 25 mm.' },
          { html: '<b>Lote 04</b> · SAE 1020 · Ø 25 mm · 6 m · 50 barras · Certificado <b>✘ ausente</b>', resp: 'r', exp: 'Sem certificado não há garantia da composição do aço.' },
          { html: '<b>Lote 05</b> · SAE 1020 · Ø 25 mm · 6 m · 50 barras · Certificado ✔', resp: 'a', exp: 'Conforme.' },
          { html: '<b>Lote 06</b> · SAE 1020 · Ø 25 mm · 6 m · <b>50 barras, várias tortas e oxidadas</b> · Certificado ✔', resp: 'r', exp: 'Avaria visível: material danificado no transporte.' }
        ]
      },
      {
        tipo: 'quiz', titulo: '📋 Procedimentos de recebimento', quantidade: 3,
        perguntas: [
          { p: 'Qual documento deve ser comparado com a Nota Fiscal no recebimento?', op: ['Pedido de Compra', 'Folha de ponto', 'Ordem de Expedição', 'Cardápio do refeitório'], c: 0 },
          { p: 'Um lote chegou com dúvida sobre a qualidade. O que fazer enquanto se aguarda a análise?', op: ['Segregar em área de quarentena identificada', 'Mandar direto para a produção', 'Misturar com o estoque bom', 'Jogar fora'], c: 0, exp: 'Material suspeito deve ser identificado e segregado para não ser usado por engano.' },
          { p: 'Por que se faz inspeção por amostragem?', op: ['Porque é inviável medir 100% das peças em grandes lotes', 'Porque é proibido medir tudo', 'Para não precisar de NF', 'Para aumentar o estoque'], c: 0 },
          { p: 'Ao descarregar a carga com empilhadeira, quem pode operá-la?', op: ['Somente operador treinado e autorizado', 'Qualquer funcionário', 'O motorista do caminhão sempre', 'O jovem aprendiz sem treinamento'], c: 0, exp: 'A operação de empilhadeiras exige capacitação e autorização (NR-11).' }
        ]
      }
    ]
  },

  {
    id: 'almoxarifado', titulo: 'Almoxarifado e Estoque', icone: '🗄️', setor: 'Almoxarifado',
    objetivo: 'Organizar o estoque, aplicar o PEPS e calcular quando comprar mais material.',
    teoria: `
      <p>O almoxarifado guarda, controla e entrega materiais para a produção na hora certa.</p>
      <ul>
        <li><b>PEPS (Primeiro que Entra, Primeiro que Sai)</b> – em inglês FIFO. Evita que o material envelheça, oxide ou vença.</li>
        <li><b>Endereçamento</b> – cada item tem um lugar: Rua, Prateleira, Nível (ex.: R2-P3-N1).</li>
        <li><b>Estoque de segurança</b> – quantidade extra para imprevistos.</li>
        <li><b>Ponto de pedido</b> = (consumo diário × tempo de reposição) + estoque de segurança.</li>
        <li><b>Inventário</b> – contagem física para conferir se o sistema bate com o real.</li>
        <li><b>Kanban</b> – cartões visuais que avisam quando é preciso repor.</li>
      </ul>`,
    partes: [
      {
        tipo: 'ordenar', titulo: '📅 Liberação pelo PEPS',
        enunciado: 'A produção pediu chapas de aço. Clique nos lotes na <b>ordem em que devem ser liberados</b>, aplicando o PEPS.',
        passos: [
          'Lote 112 – entrada em 03/02',
          'Lote 118 – entrada em 17/02',
          'Lote 121 – entrada em 02/03',
          'Lote 125 – entrada em 20/03',
          'Lote 130 – entrada em 08/04'
        ],
        explicacao: 'No PEPS o lote mais antigo sai primeiro, independentemente do número ou da posição na prateleira.'
      },
      {
        tipo: 'quiz', titulo: '🧮 Gestão de estoque', quantidade: 3,
        perguntas: [
          { p: 'Consumo diário: 20 barras. Tempo de reposição: 5 dias. Estoque de segurança: 30 barras. Qual o ponto de pedido?', op: ['130 barras', '100 barras', '150 barras', '25 barras'], c: 0, exp: '(20 × 5) + 30 = 130 barras.' },
          { p: 'O sistema mostra 80 parafusos, mas a contagem física encontrou 72. Como se chama essa verificação?', op: ['Inventário', 'Setup', 'Kaizen', 'Expedição'], c: 0, exp: 'A diferença de 8 unidades deve ser investigada e corrigida no sistema.' },
          { p: 'Para que serve o cartão Kanban?', op: ['Sinalizar visualmente a necessidade de reposição', 'Registrar a presença do funcionário', 'Pagar o fornecedor', 'Medir peças'], c: 0 },
          { p: 'O endereço "R3-P2-N4" indica:', op: ['Rua 3, Prateleira 2, Nível 4', 'Refugo 3, Peça 2, Nota 4', 'Turno 3, dia 2, mês 4', 'Lote vencido'], c: 0 }
        ]
      }
    ]
  },

  {
    id: 'pcp', titulo: 'Planejamento (PCP)', icone: '📊', setor: 'Planejamento e Controle da Produção',
    objetivo: 'Calcular capacidade, prazos e identificar o gargalo antes de liberar a ordem de produção.',
    teoria: `
      <p>O <b>PCP</b> decide <b>o que</b>, <b>quanto</b>, <b>quando</b> e <b>onde</b> produzir.</p>
      <ul>
        <li><b>Ordem de Produção (OP)</b> – documento que autoriza a fabricação de um lote.</li>
        <li><b>Capacidade</b> – quantas peças por hora um posto consegue fazer.</li>
        <li><b>Eficiência</b> – a capacidade real é menor que a teórica (paradas, setups, ajustes).</li>
        <li><b>Gargalo</b> – o posto mais lento. <b>Ele define a velocidade de toda a linha.</b></li>
        <li><b>Lead time</b> – tempo total desde o pedido até a entrega.</li>
      </ul>
      <div class="cartao-doc">
        <b>Roteiro do Suporte Metálico (tempo por peça):</b><br>
        Corte 2 min → Furação <b>5 min</b> → Dobra 3 min → Pintura 4 min
      </div>`,
    partes: [
      {
        tipo: 'quiz', titulo: '🧮 Cálculos de produção',
        perguntas: [
          { p: 'No roteiro do Suporte Metálico, qual posto é o gargalo?', op: ['Furação (5 min)', 'Corte (2 min)', 'Dobra (3 min)', 'Pintura (4 min)'], c: 0, exp: 'O posto com maior tempo por peça limita toda a linha.' },
          { p: 'Se o gargalo leva 5 min por peça, quantas peças a linha produz por hora?', op: ['12 peças', '20 peças', '30 peças', '6 peças'], c: 0, exp: '60 min ÷ 5 min = 12 peças por hora.' },
          { p: 'Uma máquina produz 60 peças/h com 80% de eficiência. Quantas peças ela faz de verdade por hora?', op: ['48 peças', '60 peças', '80 peças', '52 peças'], c: 0, exp: '60 × 0,80 = 48 peças/h.' },
          { p: 'Pedido de 480 peças a 48 peças/h. Quantas horas de produção são necessárias?', op: ['10 horas', '8 horas', '12 horas', '4,8 horas'], c: 0, exp: '480 ÷ 48 = 10 horas.' },
          { p: 'Para aumentar a produção da linha, onde devemos melhorar primeiro?', op: ['No gargalo', 'No posto mais rápido', 'Na expedição', 'Em todos igualmente, sem análise'], c: 0, exp: 'Melhorar outro posto que não seja o gargalo não aumenta a produção total.' }
        ]
      }
    ]
  },

  {
    id: 'producao', titulo: 'Produção e Usinagem', icone: '⚙️', setor: 'Chão de fábrica',
    objetivo: 'Executar a sequência de fabricação com segurança e preparar a máquina corretamente.',
    teoria: `
      <p>No chão de fábrica a matéria-prima é transformada em peças, seguindo a <b>ficha de processo</b>.</p>
      <ul>
        <li><b>Corte</b> – serra ou guilhotina deixa a barra/chapa no tamanho.</li>
        <li><b>Usinagem</b> – torno, fresa e furadeira dão forma e furos com precisão.</li>
        <li><b>Conformação</b> – dobra e estampagem.</li>
        <li><b>Soldagem</b> – une as partes.</li>
        <li><b>Acabamento</b> – rebarbação, lixamento e pintura.</li>
        <li><b>Setup</b> – preparação da máquina para um novo produto. Quanto menor, melhor (SMED).</li>
        <li><b>TPM / manutenção autônoma</b> – o operador limpa, inspeciona e lubrifica sua máquina.</li>
      </ul>`,
    partes: [
      {
        tipo: 'ordenar', titulo: '🛠️ Sequência de fabricação do Suporte Metálico',
        enunciado: 'Coloque as operações na ordem correta da ficha de processo:',
        passos: [
          'Cortar a chapa no tamanho',
          'Furar os pontos de fixação',
          'Dobrar a chapa em "L"',
          'Soldar o reforço',
          'Rebarbar e lixar as arestas',
          'Pintar a peça'
        ],
        explicacao: 'Furar antes de dobrar é mais fácil e preciso; a pintura vem por último para não ser danificada.'
      },
      {
        tipo: 'multiSelect', titulo: '✅ Checklist antes de ligar a máquina',
        enunciado: 'Antes de iniciar o turno na furadeira de coluna, o que você deve verificar?',
        itens: [
          { t: 'Proteções instaladas e fixas', i: '🛡️', ok: true },
          { t: 'Botão de emergência funcionando', i: '🛑', ok: true },
          { t: 'Nível de óleo / lubrificação', i: '🛢️', ok: true },
          { t: 'Área limpa e organizada', i: '🧹', ok: true },
          { t: 'Peça bem presa na morsa', i: '🗜️', ok: true },
          { t: 'Retirar a proteção para ganhar tempo', i: '⏩', ok: false, exp: 'Jamais! Proteções salvam mãos e vidas.' },
          { t: 'Segurar a peça com a mão durante a furação', i: '✋', ok: false, exp: 'A broca pode prender e girar a peça. Use morsa ou dispositivo.' },
          { t: 'Deixar a chave no mandril', i: '🔑', ok: false, exp: 'Ao ligar, a chave é arremessada. Retire sempre!' }
        ]
      }
    ]
  },

  {
    id: 'montagem', titulo: 'Montagem', icone: '🔧', setor: 'Linha de montagem',
    objetivo: 'Montar o produto seguindo a instrução de trabalho, com torque correto e ergonomia.',
    teoria: `
      <p>Na montagem os componentes viram um produto final. Aqui vamos montar um <b>ventilador industrial</b>.</p>
      <ul>
        <li><b>Instrução de Trabalho (IT)</b> – passo a passo padronizado com fotos e pontos de atenção.</li>
        <li><b>Torque</b> – força de aperto especificada. Pouco torque solta; torque demais quebra a rosca.</li>
        <li><b>Poka-Yoke</b> – dispositivo "à prova de erros" (ex.: peça que só encaixa na posição certa).</li>
        <li><b>Ergonomia (NR-17)</b> – postura correta, altura da bancada, pausas, levantar peso com as pernas.</li>
      </ul>`,
    partes: [
      {
        tipo: 'ordenar', titulo: '🌀 Montagem do ventilador industrial',
        enunciado: 'Siga a instrução de trabalho: coloque os passos na ordem correta.',
        passos: [
          'Fixar a base na bancada',
          'Montar a coluna sobre a base',
          'Instalar o motor no topo da coluna',
          'Encaixar a hélice no eixo do motor',
          'Apertar a porca da hélice com o torquímetro',
          'Montar a grade de proteção',
          'Fazer o teste de funcionamento'
        ],
        explicacao: 'O teste sempre é feito com a grade de proteção já instalada.'
      },
      {
        tipo: 'quiz', titulo: '🧠 Boas práticas de montagem', quantidade: 3,
        perguntas: [
          { p: 'Um conector que só encaixa em uma posição, impedindo a montagem invertida, é um exemplo de:', op: ['Poka-Yoke', 'Kanban', 'Inventário', 'Setup'], c: 0 },
          { p: 'A IT pede torque de 25 N·m. Qual ferramenta garante esse valor?', op: ['Torquímetro', 'Martelo', 'Alicate universal', 'Chave de fenda'], c: 0 },
          { p: 'Qual é a forma correta de levantar uma caixa pesada do chão?', op: ['Dobrar os joelhos e manter a coluna reta', 'Curvar as costas com as pernas esticadas', 'Girar o tronco enquanto levanta', 'Puxar com um braço só'], c: 0, exp: 'A força deve vir das pernas, mantendo a carga perto do corpo (NR-17).' },
          { p: 'Você encontrou uma peça faltando no kit de montagem. O que fazer?', op: ['Parar e comunicar o líder', 'Montar sem a peça', 'Pegar uma peça de outro produto', 'Improvisar com fita'], c: 0 }
        ]
      }
    ]
  },

  {
    id: 'qualidade', titulo: 'Controle de Qualidade', icone: '🔍', setor: 'Laboratório de metrologia',
    objetivo: 'Medir peças, comparar com a tolerância e tratar as não conformidades.',
    teoria: `
      <p>Qualidade é fazer certo da primeira vez. O inspetor compara a peça com o <b>desenho técnico</b>.</p>
      <ul>
        <li><b>Medida nominal</b> – valor ideal (ex.: 25,00 mm).</li>
        <li><b>Tolerância</b> – variação permitida (ex.: ± 0,05 mm). Faixa aceitável: <b>24,95 a 25,05 mm</b>.</li>
        <li><b>Instrumentos</b> – paquímetro (0,02 mm), micrômetro (0,01 mm), relógio comparador, calibradores passa/não-passa.</li>
        <li><b>Não conformidade</b> – peça fora do especificado: identificar, segregar, registrar e investigar a causa.</li>
        <li><b>Retrabalho</b> recupera a peça; <b>refugo</b> é a peça perdida.</li>
        <li><b>PDCA</b> – Planejar, Fazer (Do), Checar, Agir: ciclo de melhoria contínua.</li>
      </ul>`,
    partes: [
      desafioMedicoes,
      {
        tipo: 'quiz', titulo: '📐 Qualidade na prática', quantidade: 3,
        perguntas: [
          { p: 'Qual a sequência do ciclo PDCA?', op: ['Planejar, Fazer, Checar, Agir', 'Produzir, Descartar, Comprar, Armazenar', 'Pintar, Dobrar, Cortar, Afiar', 'Pedir, Despachar, Cobrar, Arquivar'], c: 0, fixo: true },
          { p: 'Uma peça reprovada deve ser:', op: ['Identificada, segregada e registrada', 'Misturada com as boas', 'Enviada ao cliente com desconto', 'Escondida'], c: 0 },
          { p: 'Qual instrumento tem maior resolução para medir um eixo?', op: ['Micrômetro (0,01 mm)', 'Régua (1 mm)', 'Trena (1 mm)', 'Esquadro'], c: 0 },
          { p: 'Uma peça com medida acima do máximo, mas que pode ser usinada de novo até a faixa, vai para:', op: ['Retrabalho', 'Refugo', 'Expedição', 'Almoxarifado de produtos bons'], c: 0, exp: 'Se ainda há material para remover, ela pode ser recuperada (retrabalho).' }
        ]
      }
    ]
  },

  {
    id: 'expedicao', titulo: 'Embalagem e Expedição', icone: '🚚', setor: 'Expedição',
    objetivo: 'Embalar, identificar e despachar os pedidos dentro do prazo e com segurança.',
    teoria: `
      <p>A última etapa leva o produto ao cliente. Atrasos e avarias aqui estragam todo o trabalho anterior.</p>
      <ul>
        <li><b>Embalagem</b> – protege contra choque, umidade e oxidação.</li>
        <li><b>Identificação</b> – etiqueta com produto, quantidade, lote e cliente (rastreabilidade).</li>
        <li><b>Nota Fiscal de saída</b> – acompanha a mercadoria durante o transporte.</li>
        <li><b>Carregamento</b> – respeitar a capacidade do veículo, distribuir o peso e amarrar a carga.</li>
        <li><b>Priorização</b> – pedidos com prazo mais curto saem primeiro.</li>
      </ul>`,
    partes: [
      desafioCaminhao,
      {
        tipo: 'quiz', titulo: '📦 Expedição', quantidade: 3,
        perguntas: [
          { p: 'Qual documento acompanha a mercadoria no transporte?', op: ['Nota Fiscal', 'Ordem de Produção', 'Ficha de EPI', 'Cartão de ponto'], c: 0 },
          { p: 'Por que a etiqueta da embalagem traz o número do lote?', op: ['Para garantir a rastreabilidade', 'Por decoração', 'Para aumentar o peso', 'Não tem função'], c: 0, exp: 'Se houver problema, é possível saber quando e como o lote foi produzido.' },
          { p: 'Como distribuir a carga no caminhão?', op: ['Itens pesados embaixo e peso bem distribuído e amarrado', 'Itens pesados em cima', 'Tudo solto para descarregar rápido', 'Tudo de um lado só'], c: 0 },
          { p: 'Peças de aço sem pintura que vão viajar por vários dias precisam de:', op: ['Proteção contra oxidação (óleo protetivo/embalagem)', 'Nada', 'Água para resfriar', 'Ficar ao sol'], c: 0 }
        ]
      }
    ]
  }
];

Etapas.forEach((e, k) => Atividades.registrar('etapa_' + e.id, `${k + 1}. ${e.titulo}`, 'Jornada'));

function etapaLiberada(j, k) {
  if (k === 0) return true;
  const ant = j.pontos['etapa_' + Etapas[k - 1].id];
  return ant !== undefined && ant >= NOTA_MINIMA;
}

/* ---------- Tela: mapa da fábrica ---------- */
App.rota('fabrica', el => {
  const j = Store.jogador();
  const concluidas = Etapas.filter(e => (j.pontos['etapa_' + e.id] ?? -1) >= NOTA_MINIMA).length;
  el.innerHTML = `
    <section class="cabecalho-secao">
      <h1>🏭 Jornada na Fábrica</h1>
      <p>Percorra todos os setores, do portão de entrada até o caminhão de entrega. Tire pelo menos <b>${NOTA_MINIMA} pontos</b> para liberar o próximo setor.</p>
      <div class="progresso"><div style="width:${concluidas / Etapas.length * 100}%"></div></div>
      <small>${concluidas} de ${Etapas.length} setores concluídos</small>
    </section>
    <div class="planta">
      ${Etapas.map((e, k) => {
        const p = j.pontos['etapa_' + e.id];
        const lib = etapaLiberada(j, k);
        const ok = p !== undefined && p >= NOTA_MINIMA;
        return `<button class="setor ${ok ? 'concluido' : lib ? 'liberado' : 'bloqueado'}" data-etapa="${e.id}" ${lib ? '' : 'disabled'}>
          <span class="setor-num">${k + 1}</span>
          <span class="setor-icone">${lib ? e.icone : '🔒'}</span>
          <strong>${e.titulo}</strong>
          <small>${e.setor}</small>
          <span class="setor-status">${p !== undefined ? `${estrelas(p)} ${p} pts` : lib ? 'Disponível' : 'Bloqueado'}</span>
        </button>`;
      }).join('<span class="seta" aria-hidden="true">➜</span>')}
    </div>
    ${concluidas === Etapas.length ? `<div class="msg ok centro">🎓 Parabéns! Você concluiu toda a jornada.
        <div class="acoes"><button class="btn" id="cert">Ver certificado</button></div></div>` : ''}`;
  $$('[data-etapa]', el).forEach(b => b.onclick = () => App.go('etapa', { id: b.dataset.etapa }));
  const c = $('#cert', el); if (c) c.onclick = () => App.go('certificado');
});

/* ---------- Tela: uma etapa ---------- */
App.rota('etapa', (el, { id }) => {
  const k = Etapas.findIndex(e => e.id === id);
  const e = Etapas[k];
  const j = Store.jogador();
  if (!e || !etapaLiberada(j, k)) { App.go('fabrica'); return; }
  el.innerHTML = `
    <section class="cabecalho-secao etapa-cab">
      <button class="btn sec pequeno" data-go="fabrica">← Mapa</button>
      <div class="etapa-icone">${e.icone}</div>
      <div>
        <small>Setor ${k + 1} de ${Etapas.length} · ${e.setor}</small>
        <h1>${e.titulo}</h1>
        <p>🎯 ${e.objetivo}</p>
      </div>
    </section>
    <div class="cartao" id="area">
      <h2>📘 O que você precisa saber</h2>
      <div class="teoria">${e.teoria}</div>
      <div class="acoes"><button class="btn grande" id="iniciar">Iniciar desafio ▶</button></div>
    </div>`;
  $('#iniciar', el).onclick = () => {
    const area = $('#area', el);
    area.innerHTML = '';
    Comp.sequencia(area, e.partes, nota => {
      const recorde = Store.registrar('etapa_' + e.id, nota);
      const prox = Etapas[k + 1];
      const passou = nota >= NOTA_MINIMA;
      area.innerHTML = `
        <div class="resultado">
          <div class="resultado-icone">${passou ? '🏅' : '🔁'}</div>
          <h2>${passou ? 'Setor concluído!' : 'Quase lá!'}</h2>
          <div class="estrelas grande">${estrelas(nota)}</div>
          <p class="nota">${Math.round(nota)} pontos ${recorde ? '<span class="pilula verde">Novo recorde!</span>' : ''}</p>
          <p>${passou ? (prox ? `O setor <b>${prox.titulo}</b> foi liberado.` : 'Você completou todos os setores da fábrica!')
            : `Você precisa de ${NOTA_MINIMA} pontos para avançar. Revise o conteúdo e tente novamente.`}</p>
          <div class="acoes">
            <button class="btn sec" id="repetir">Refazer setor</button>
            <button class="btn sec" data-go="fabrica">Mapa da fábrica</button>
            ${passou && prox ? `<button class="btn" id="prox">Próximo: ${prox.titulo} ➜</button>` : ''}
            ${passou && !prox ? '<button class="btn" id="cert">🎓 Ver certificado</button>' : ''}
          </div>
        </div>`;
      $('#repetir', area).onclick = () => App.go('etapa', { id });
      const p = $('#prox', area); if (p) p.onclick = () => App.go('etapa', { id: prox.id });
      const c = $('#cert', area); if (c) c.onclick = () => App.go('certificado');
    });
  };
});

/* ---------- Tela: certificado ---------- */
App.rota('certificado', el => {
  const j = Store.jogador();
  const notas = Etapas.map(e => j.pontos['etapa_' + e.id]);
  if (notas.some(n => n === undefined || n < NOTA_MINIMA)) { App.go('fabrica'); return; }
  const media = notas.reduce((s, v) => s + v, 0) / notas.length;
  const data = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  el.innerHTML = `
    <div class="certificado" id="cert-area">
      <div class="cert-borda">
        <div class="cert-icone">🏭🎓</div>
        <h1>Certificado</h1>
        <p>Certificamos que</p>
        <h2>${esc(j.nome)}</h2>
        <p>${j.turma ? 'da turma <b>' + esc(j.turma) + '</b>, ' : ''}concluiu a <b>Jornada na Fábrica Escola</b>,
          percorrendo todas as etapas do processo produtivo industrial com média de <b>${Math.round(media)} pontos</b>.</p>
        <table class="tabela cert-tabela">
          ${Etapas.map((e, k) => `<tr><td>${e.icone} ${k + 1}. ${e.titulo}</td><td>${notas[k]} pts</td></tr>`).join('')}
        </table>
        <p class="cert-data">${data}</p>
        <div class="cert-assin"><span>Instrutor(a)</span><span>Aprendiz</span></div>
      </div>
    </div>
    <div class="acoes nao-imprimir">
      <button class="btn sec" data-go="fabrica">← Voltar</button>
      <button class="btn" onclick="window.print()">🖨️ Imprimir / salvar PDF</button>
    </div>`;
});
