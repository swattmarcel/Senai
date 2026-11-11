/* =========================================================
   Jogos para os jovens aprendizes
   ========================================================= */
'use strict';

const Jogos = [
  { id: 'quiz_seg', nome: 'Quiz Relâmpago de Segurança', icone: '⚡', desc: 'Responda rápido sobre NRs, EPIs, incêndio e mapa de riscos. Quanto mais rápido, mais pontos!', iniciar: jogoQuizSeg },
  { id: 'riscos', nome: 'Caça aos Riscos', icone: '🕵️', desc: 'Encontre todas as situações perigosas no chão de fábrica antes que o tempo acabe.', iniciar: jogoRiscos },
  { id: 'cinco_s', nome: 'Desafio 5S', icone: '🧹', desc: 'Identifique qual dos 5 sensos (Seiri, Seiton, Seiso, Seiketsu, Shitsuke) está sendo aplicado.', iniciar: jogo5S },
  { id: 'memoria', nome: 'Memória das Ferramentas', icone: '🧠', desc: 'Encontre os pares: cada ferramenta ou EPI com a sua função.', iniciar: jogoMemoria },
  { id: 'inspetor', nome: 'Inspetor na Esteira', icone: '🔩', desc: 'As peças passam na esteira. Clique nas que estão fora da tolerância antes que cheguem ao cliente!', iniciar: jogoInspetor }
];
Jogos.forEach(g => Atividades.registrar('jogo_' + g.id, g.nome, 'Jogos'));

App.rota('jogos', el => {
  const j = Store.jogador();
  el.innerHTML = `
    <section class="cabecalho-secao">
      <h1>🎮 Jogos da Fábrica</h1>
      <p>Aprenda brincando! Cada jogo vale até 100 pontos – a sua melhor pontuação vai para o ranking da turma.</p>
    </section>
    <div class="grade-cartoes">
      ${Jogos.map(g => {
        const p = j.pontos['jogo_' + g.id];
        return `<button class="cartao-modulo" data-jogo="${g.id}">
          <span class="modulo-icone">${g.icone}</span>
          <strong>${g.nome}</strong>
          <p>${g.desc}</p>
          <span class="setor-status">${p !== undefined ? `${estrelas(p)} Recorde: ${p} pts` : 'Ainda não jogado'}</span>
        </button>`;
      }).join('')}
    </div>`;
  $$('[data-jogo]', el).forEach(b => b.onclick = () => App.go('jogo', { id: b.dataset.jogo }));
});

App.rota('jogo', (el, { id }) => {
  const g = Jogos.find(x => x.id === id);
  if (!g) { App.go('jogos'); return; }
  el.innerHTML = `
    <section class="cabecalho-secao etapa-cab">
      <button class="btn sec pequeno" data-go="jogos">← Jogos</button>
      <div class="etapa-icone">${g.icone}</div>
      <div><h1>${g.nome}</h1><p>${g.desc}</p></div>
    </section>
    <div class="cartao" id="area"></div>`;
  g.iniciar($('#area', el), (pontos, detalhe) => fimDeJogo($('#area', el), g, pontos, detalhe));
});

function fimDeJogo(area, g, pontos, detalhe = '') {
  const recorde = Store.registrar('jogo_' + g.id, pontos);
  area.innerHTML = `
    <div class="resultado">
      <div class="resultado-icone">${pontos >= 70 ? '🏆' : pontos >= 40 ? '👍' : '💪'}</div>
      <h2>Fim de jogo!</h2>
      <div class="estrelas grande">${estrelas(pontos)}</div>
      <p class="nota">${Math.round(pontos)} pontos ${recorde ? '<span class="pilula verde">Novo recorde!</span>' : ''}</p>
      ${detalhe}
      <div class="acoes">
        <button class="btn sec" data-go="jogos">Outros jogos</button>
        <button class="btn" id="denovo">Jogar novamente</button>
      </div>
    </div>`;
  $('#denovo', area).onclick = () => App.go('jogo', { id: g.id });
}

/* ---------- 1. Quiz relâmpago ---------- */
const BancoSeguranca = [
  { p: 'A NR-6 trata de:', op: ['Equipamentos de Proteção Individual (EPI)', 'Trabalho em altura', 'Eletricidade', 'Caldeiras'], c: 0 },
  { p: 'A NR-12 trata de:', op: ['Segurança em máquinas e equipamentos', 'Ergonomia', 'Resíduos', 'Refeitório'], c: 0 },
  { p: 'A NR-10 trata de:', op: ['Segurança em instalações e serviços com eletricidade', 'EPI', 'Espaço confinado', 'Transporte de cargas'], c: 0 },
  { p: 'Pela NR-35, trabalho em altura é toda atividade acima de:', op: ['2 metros', '50 centímetros', '5 metros', '10 metros'], c: 0 },
  { p: 'A NR-17 trata de:', op: ['Ergonomia', 'Incêndio', 'Ruído apenas', 'Soldagem'], c: 0 },
  { p: 'Em um incêndio em painel elétrico energizado, NUNCA use:', op: ['Extintor de água', 'Extintor de CO₂', 'Extintor de pó químico', 'Desligar a energia, se possível'], c: 0, exp: 'Água conduz eletricidade e pode causar choque.' },
  { p: 'Fogo em madeira, papel e tecido (classe A) é melhor combatido com:', op: ['Água', 'CO₂ apenas', 'Areia molhada com óleo', 'Ventilador'], c: 0 },
  { p: 'O que significa CIPA?', op: ['Comissão Interna de Prevenção de Acidentes e de Assédio', 'Central de Inspeção de Peças e Acessórios', 'Controle Interno de Produção Automatizada', 'Comitê Industrial de Pintura'], c: 0 },
  { p: 'Qual documento comunica oficialmente um acidente de trabalho?', op: ['CAT – Comunicação de Acidente de Trabalho', 'Nota Fiscal', 'Ordem de Produção', 'Ficha de EPI'], c: 0 },
  { p: 'Antes de fazer manutenção em uma máquina, deve-se:', op: ['Desligar, bloquear e etiquetar a fonte de energia', 'Apenas apertar o botão de emergência', 'Avisar pelo celular e começar', 'Diminuir a velocidade'], c: 0, exp: 'Bloqueio e etiquetagem (LOTO) impedem que alguém ligue a máquina por engano.' },
  { p: 'Operar a máquina sem óculos de proteção é um exemplo de:', op: ['Ato inseguro', 'Condição insegura', 'Quase acidente', 'Ergonomia'], c: 0, exp: 'Ato inseguro depende do comportamento da pessoa.' },
  { p: 'Um piso escorregadio com óleo é um exemplo de:', op: ['Condição insegura', 'Ato inseguro', 'Poka-yoke', 'Kanban'], c: 0, exp: 'Condição insegura é um problema do ambiente.' },
  { p: 'Uma peça caiu e quase atingiu alguém, mas ninguém se feriu. Isso é:', op: ['Quase acidente – deve ser comunicado', 'Nada, pode ignorar', 'Acidente com afastamento', 'Brincadeira'], c: 0, exp: 'Comunicar quase acidentes ajuda a evitar acidentes reais.' },
  { p: 'No mapa de riscos, a cor VERDE representa riscos:', op: ['Físicos (ruído, calor, vibração)', 'Químicos', 'Biológicos', 'Ergonômicos'], c: 0 },
  { p: 'No mapa de riscos, a cor VERMELHA representa riscos:', op: ['Químicos (poeiras, fumos, vapores)', 'Físicos', 'De acidentes', 'Ergonômicos'], c: 0 },
  { p: 'No mapa de riscos, a cor AZUL representa riscos:', op: ['De acidentes (mecânicos)', 'Biológicos', 'Químicos', 'Físicos'], c: 0 },
  { p: 'No mapa de riscos, a cor AMARELA representa riscos:', op: ['Ergonômicos', 'Químicos', 'De acidentes', 'Biológicos'], c: 0 },
  { p: 'No mapa de riscos, o tamanho do círculo indica:', op: ['A gravidade do risco', 'A quantidade de funcionários', 'O horário do turno', 'Nada'], c: 0 },
  { p: 'Usar ar comprimido para limpar a roupa ou o corpo é:', op: ['Proibido – pode causar lesões graves', 'Recomendado', 'Permitido só no verão', 'Obrigatório'], c: 0 },
  { p: 'Qual o telefone do SAMU?', op: ['192', '193', '190', '199'], c: 0, exp: '192 SAMU · 193 Bombeiros · 190 Polícia.' },
  { p: 'Quem deve fornecer o EPI gratuitamente ao trabalhador?', op: ['A empresa', 'O próprio trabalhador', 'O sindicato', 'O cliente'], c: 0, exp: 'A NR-6 obriga o empregador a fornecer o EPI adequado e gratuito.' },
  { p: 'O protetor auricular é um EPI contra qual risco?', op: ['Ruído (físico)', 'Poeira (químico)', 'Vírus (biológico)', 'Postura (ergonômico)'], c: 0 }
];

function jogoQuizSeg(el, done) {
  Comp.quiz(el, { titulo: '⚡ Quiz Relâmpago', perguntas: BancoSeguranca, quantidade: 10, tempo: 15, semResumo: true },
    (pontos, acertos, total) => done(pontos, `<p>Acertos: <b>${acertos} de ${total}</b></p>`));
}

/* ---------- 2. Caça aos Riscos ---------- */
const SituacoesRisco = [
  { i: '💧', t: 'Óleo derramado no corredor', r: true, exp: 'Risco de escorregão e queda.' },
  { i: '🔌', t: 'Fio elétrico desencapado', r: true, exp: 'Risco de choque elétrico e incêndio.' },
  { i: '📦', t: 'Caixas empilhadas tortas até o teto', r: true, exp: 'Podem cair sobre as pessoas.' },
  { i: '🚪', t: 'Saída de emergência bloqueada por paletes', r: true, exp: 'Em uma emergência ninguém consegue sair.' },
  { i: '⚙️', t: 'Correia da máquina sem proteção', r: true, exp: 'Pode puxar mãos, roupas e cabelos (NR-12).' },
  { i: '🧯', t: 'Extintor escondido atrás de materiais', r: true, exp: 'O extintor deve estar sempre desobstruído.' },
  { i: '🪜', t: 'Escada com degrau quebrado', r: true, exp: 'Risco de queda.' },
  { i: '🚬', t: 'Pessoa fumando perto de tintas e solventes', r: true, exp: 'Risco de incêndio e explosão.' },
  { i: '📱', t: 'Operador usando celular na empilhadeira', r: true, exp: 'Distração causa atropelamentos e colisões.' },
  { i: '🙉', t: 'Operador sem protetor auricular ao lado da prensa', r: true, exp: 'Ruído alto causa perda auditiva irreversível.' },
  { i: '🦺', t: 'Operador com todos os EPIs do setor', r: false },
  { i: '🧹', t: 'Bancada limpa e organizada', r: false },
  { i: '🟨', t: 'Faixas de circulação pintadas no piso', r: false },
  { i: '🧯', t: 'Extintor sinalizado e com acesso livre', r: false },
  { i: '🚿', t: 'Lava-olhos sinalizado perto dos químicos', r: false },
  { i: '🛑', t: 'Botão de emergência ao alcance do operador', r: false },
  { i: '🗂️', t: 'Ferramentas no quadro de sombras', r: false },
  { i: '🧪', t: 'Produtos químicos rotulados', r: false },
  { i: '💡', t: 'Corredor bem iluminado', r: false },
  { i: '🚧', t: 'Área de manutenção isolada e sinalizada', r: false }
];

function jogoRiscos(el, done) {
  const TEMPO = 60;
  const riscos = embaralhar(SituacoesRisco.filter(s => s.r)).slice(0, 8);
  const seguras = embaralhar(SituacoesRisco.filter(s => !s.r)).slice(0, 8);
  const cenas = embaralhar([...riscos, ...seguras]);
  let achados = 0, erros = 0, restante = TEMPO, fim = false;
  el.innerHTML = `
    <div class="jogo-topo">
      <span class="pilula">🎯 Riscos: <b id="r-achados">0</b>/${riscos.length}</span>
      <span class="pilula vermelho">❌ Erros: <b id="r-erros">0</b></span>
      <span class="pilula">⏱️ <b id="r-tempo">${TEMPO}</b>s</span>
    </div>
    <p class="enunciado">Clique em todas as situações de <b>RISCO</b>. Cuidado: clicar em uma situação segura conta como erro!</p>
    <div class="grade-riscos">
      ${cenas.map((c, k) => `<button class="cena" data-k="${k}"><span class="cena-icone">${c.i}</span><span>${c.t}</span></button>`).join('')}
    </div>
    <div class="feedback" id="r-fb"></div>`;
  const terminar = () => {
    if (fim) return;
    fim = true; clearInterval(timer);
    $$('.cena', el).forEach(b => {
      const c = cenas[+b.dataset.k];
      b.disabled = true;
      if (c.r && !b.classList.contains('certo')) b.classList.add('faltou');
    });
    const bonus = achados === riscos.length ? restante / TEMPO * 15 : 0;
    const pontos = limitar(achados / riscos.length * 85 + bonus - erros * 10, 0, 100);
    const perdidos = riscos.filter((c, k) => !$$('.cena', el).find(b => cenas[+b.dataset.k] === c && b.classList.contains('certo')));
    setTimeout(() => done(pontos, `<p>Você encontrou <b>${achados} de ${riscos.length}</b> riscos com ${erros} erro(s).</p>
      ${perdidos.length ? '<div class="msg aviso"><b>Riscos que passaram despercebidos:</b><ul>' +
        perdidos.map(c => `<li>${c.i} ${c.t} – ${c.exp}</li>`).join('') + '</ul></div>' : ''}`), 1200);
  };
  $$('.cena', el).forEach(b => b.onclick = () => {
    if (fim || b.disabled) return;
    const c = cenas[+b.dataset.k];
    b.disabled = true;
    if (c.r) {
      achados++; b.classList.add('certo');
      $('#r-fb', el).innerHTML = `<div class="msg ok">✅ <b>${c.t}:</b> ${c.exp}</div>`;
    } else {
      erros++; b.classList.add('errado');
      $('#r-fb', el).innerHTML = `<div class="msg erro">❌ <b>${c.t}</b> é uma situação segura!</div>`;
    }
    $('#r-achados', el).textContent = achados;
    $('#r-erros', el).textContent = erros;
    if (achados === riscos.length) terminar();
  });
  const timer = setInterval(() => {
    restante--;
    $('#r-tempo', el).textContent = restante;
    if (restante <= 0) terminar();
  }, 1000);
  App.aoSair(() => clearInterval(timer));
}

/* ---------- 3. Desafio 5S ---------- */
function jogo5S(el, done) {
  const S = ['Seiri – Utilização', 'Seiton – Organização', 'Seiso – Limpeza', 'Seiketsu – Padronização', 'Shitsuke – Disciplina'];
  const sit = [
    ['Retirar da bancada ferramentas quebradas que ninguém usa há meses.', 0, 'Seiri: separar o necessário do desnecessário.'],
    ['Descartar papéis e peças velhas acumulados no armário.', 0, 'Seiri: manter só o que é útil.'],
    ['Pendurar as ferramentas no quadro com o contorno desenhado de cada uma.', 1, 'Seiton: um lugar para cada coisa e cada coisa em seu lugar.'],
    ['Etiquetar as caixas e endereçar as prateleiras do almoxarifado.', 1, 'Seiton: facilitar encontrar e guardar.'],
    ['Remover cavacos e óleo da máquina ao final do turno.', 2, 'Seiso: limpar e, ao limpar, inspecionar.'],
    ['Ao limpar a prensa, encontrar e avisar um vazamento de óleo.', 2, 'Seiso: limpeza também é inspeção.'],
    ['Criar um checklist padrão de organização para todos os turnos.', 3, 'Seiketsu: padronizar para manter os três primeiros sensos.'],
    ['Definir cores padrão para as lixeiras de toda a fábrica.', 3, 'Seiketsu: padronização visual.'],
    ['Cumprir os padrões mesmo sem ninguém cobrando.', 4, 'Shitsuke: autodisciplina e hábito.'],
    ['Participar das auditorias de 5S e sugerir melhorias.', 4, 'Shitsuke: comprometimento contínuo.']
  ];
  Comp.quiz(el, {
    titulo: '🧹 Desafio 5S', tempo: 20, semResumo: true,
    perguntas: sit.map(([p, c, exp]) => ({ p: `<span class="tag">Qual senso?</span> ${p}`, op: S, c, exp, fixo: true }))
  }, (pontos, acertos, total) => done(pontos, `<p>Acertos: <b>${acertos} de ${total}</b></p>
    <div class="msg info"><b>Os 5 sensos:</b><ol>${S.map(s => `<li>${s}</li>`).join('')}</ol></div>`));
}

/* ---------- 4. Memória ---------- */
function jogoMemoria(el, done) {
  const pares = embaralhar([
    ['🥽', 'Protege os olhos'], ['🎧', 'Protege a audição'], ['🥾', 'Protege os pés'], ['📏', 'Paquímetro: mede peças'],
    ['🔧', 'Chave: aperta parafusos'], ['🪚', 'Serra: corta material'], ['🧯', 'Combate princípio de incêndio'],
    ['⛑️', 'Capacete: protege a cabeça'], ['🗜️', 'Morsa: prende a peça'], ['🔥', 'Solda: une metais']
  ]).slice(0, 8);
  const cartas = embaralhar(pares.flatMap(([ic, txt], k) => [{ k, v: ic, tipo: 'icone' }, { k, v: txt, tipo: 'texto' }]));
  let abertas = [], jogadas = 0, achados = 0, travado = false;
  const inicio = Date.now();
  el.innerHTML = `
    <div class="jogo-topo">
      <span class="pilula">🔁 Jogadas: <b id="m-jog">0</b></span>
      <span class="pilula">✅ Pares: <b id="m-par">0</b>/${pares.length}</span>
    </div>
    <p class="enunciado">Vire duas cartas: encontre cada símbolo com a sua função.</p>
    <div class="grade-memoria">
      ${cartas.map((c, i) => `<button class="carta" data-i="${i}"><span class="frente ${c.tipo}">${c.v}</span><span class="verso">🏭</span></button>`).join('')}
    </div>`;
  $$('.carta', el).forEach(b => b.onclick = () => {
    if (travado || b.classList.contains('virada')) return;
    b.classList.add('virada');
    abertas.push(b);
    if (abertas.length < 2) return;
    jogadas++;
    $('#m-jog', el).textContent = jogadas;
    const [a, c] = abertas.map(x => cartas[+x.dataset.i]);
    if (a.k === c.k && a.tipo !== c.tipo) {
      abertas.forEach(x => x.classList.add('par'));
      abertas = []; achados++;
      $('#m-par', el).textContent = achados;
      if (achados === pares.length) {
        const seg = Math.round((Date.now() - inicio) / 1000);
        const pontos = limitar(100 - Math.max(0, jogadas - pares.length - 4) * 4, 20, 100);
        setTimeout(() => done(pontos, `<p>Você completou em <b>${jogadas} jogadas</b> e ${seg} segundos.</p>`), 700);
      }
    } else {
      travado = true;
      setTimeout(() => { abertas.forEach(x => x.classList.remove('virada')); abertas = []; travado = false; }, 900);
    }
  });
}

/* ---------- 5. Inspetor na Esteira ---------- */
function jogoInspetor(el, done) {
  const TEMPO = 45, NOM = 10.00, TOL = 0.10;
  let restante = TEMPO, pecas = [], idSeq = 0, fim = false;
  let rejeitouCerto = 0, rejeitouErrado = 0, passouDefeito = 0, passouBoa = 0, totalDefeitos = 0;
  let proxSpawn = 0, decorrido = 0;
  el.innerHTML = `
    <div class="jogo-topo">
      <span class="pilula">📐 Tolerância: <b>Ø ${fmt(NOM)} ± ${fmt(TOL)} mm</b> (${fmt(NOM - TOL)} a ${fmt(NOM + TOL)})</span>
      <span class="pilula">⏱️ <b id="i-tempo">${TEMPO}</b>s</span>
    </div>
    <div class="jogo-topo">
      <span class="pilula verde">✅ Defeitos barrados: <b id="i-ok">0</b></span>
      <span class="pilula vermelho">⚠️ Peças boas descartadas: <b id="i-err">0</b></span>
      <span class="pilula vermelho">🚚 Defeitos que escaparam: <b id="i-esc">0</b></span>
    </div>
    <p class="enunciado">Clique nas peças <b>fora da tolerância</b> para retirá-las da esteira. Deixe as boas passarem!</p>
    <div class="esteira-jogo" id="esteira">
      <div class="esteira-faixa"></div>
      <div class="esteira-fim">🚚 Cliente</div>
    </div>`;
  const esteira = $('#esteira', el);

  const criar = () => {
    const defeito = Math.random() < 0.4;
    let v;
    if (defeito) v = NOM + (Math.random() < .5 ? -1 : 1) * aleatorio(TOL + 0.01, TOL + 0.15);
    else v = NOM + aleatorio(-TOL, TOL);
    v = +v.toFixed(2);
    const ok = Math.abs(v - NOM) <= TOL + 1e-9;
    if (!ok) totalDefeitos++;
    const d = document.createElement('button');
    d.className = 'peca-esteira';
    d.innerHTML = `<span>🔩</span><b>${fmt(v)}</b>`;
    d.style.left = '-90px';
    d.style.top = (10 + Math.floor(Math.random() * 3) * 52) + 'px';
    esteira.appendChild(d);
    const p = { id: idSeq++, ok, x: -90, el: d, vel: 90 + decorrido * 2.2 };
    d.onclick = () => {
      if (fim || p.saiu) return;
      p.saiu = true;
      if (!p.ok) { rejeitouCerto++; d.classList.add('acerto'); }
      else { rejeitouErrado++; d.classList.add('erro'); toast(`Ø ${fmt(v)} estava dentro da tolerância!`, 'aviso', 1500); }
      atualizar();
      setTimeout(() => d.remove(), 400);
    };
    pecas.push(p);
  };
  const atualizar = () => {
    $('#i-ok', el).textContent = rejeitouCerto;
    $('#i-err', el).textContent = rejeitouErrado;
    $('#i-esc', el).textContent = passouDefeito;
  };

  let ultimo = performance.now();
  const loop = setInterval(() => {
    const agora = performance.now();
    const dt = Math.min(0.1, (agora - ultimo) / 1000);
    ultimo = agora;
    if (fim) return;
    decorrido += dt;
    proxSpawn -= dt;
    if (proxSpawn <= 0 && decorrido < TEMPO - 3) {
      criar();
      proxSpawn = Math.max(0.55, 1.5 - decorrido * 0.022);
    }
    const largura = esteira.clientWidth;
    pecas.forEach(p => {
      if (p.saiu) return;
      p.x += p.vel * dt;
      p.el.style.left = p.x + 'px';
      if (p.x > largura - 80) {
        p.saiu = true;
        if (!p.ok) { passouDefeito++; p.el.classList.add('escapou'); }
        else passouBoa++;
        atualizar();
        setTimeout(() => p.el.remove(), 300);
      }
    });
    pecas = pecas.filter(p => !p.saiu);
    restante = Math.max(0, TEMPO - decorrido);
    $('#i-tempo', el).textContent = Math.ceil(restante);
    if (restante <= 0) terminar();
  }, 30);
  App.aoSair(() => clearInterval(loop));

  function terminar() {
    fim = true; clearInterval(loop);
    // peças ainda na esteira contam como escapadas se defeituosas
    pecas.forEach(p => { if (!p.saiu && !p.ok) passouDefeito++; });
    const pontos = totalDefeitos ? limitar((rejeitouCerto - rejeitouErrado * 0.5) / totalDefeitos * 100, 0, 100) : 0;
    done(pontos, `
      <div class="kpis-final">
        <div><b>${rejeitouCerto}</b><small>defeitos barrados</small></div>
        <div><b>${passouDefeito}</b><small>defeitos que chegaram ao cliente</small></div>
        <div><b>${rejeitouErrado}</b><small>peças boas descartadas</small></div>
        <div><b>${passouBoa}</b><small>peças boas entregues</small></div>
      </div>
      <p class="dica">💡 Descartar peça boa gera custo; deixar passar peça ruim gera reclamação do cliente. O inspetor precisa de atenção e precisão!</p>`);
  }
}
