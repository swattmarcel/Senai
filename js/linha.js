/* =========================================================
   Simulador de Linha de Produção (tempo real)
   ========================================================= */
'use strict';

Atividades.registrar('linha', 'Linha de Produção', 'Simulador');

const LinhaCfg = {
  duracao: 150,          // segundos reais de um turno (no ritmo 1x)
  meta: 50,              // peças boas a entregar
  operadores: 10,        // total de operadores disponíveis
  maxPorPosto: 4,
  capBuffer: 6,
  estoqueInicial: 20,
  loteMaterial: 20,
  tempoEntregaMaterial: 8,
  tempoReparo: 5,
  postos: [
    { id: 'corte', nome: 'Corte', icone: '🪚', base: 3.0 },
    { id: 'usinagem', nome: 'Usinagem', icone: '⚙️', base: 6.0 },
    { id: 'montagem', nome: 'Montagem', icone: '🔧', base: 5.0 },
    { id: 'qualidade', nome: 'Qualidade', icone: '🔍', base: 2.0 },
    { id: 'expedicao', nome: 'Expedição', icone: '📦', base: 1.5 }
  ]
};

App.rota('linha', el => {
  el.innerHTML = `
    <section class="cabecalho-secao">
      <h1>⚙️ Simulador de Linha de Produção</h1>
      <p>Você é o(a) <b>líder do turno</b>! Distribua os operadores, mantenha as máquinas funcionando, peça material
      antes que acabe e entregue a meta de <b>${LinhaCfg.meta} peças boas</b> até o fim do turno.</p>
    </section>
    <div class="cartao">
      <h2>📋 Como funciona</h2>
      <div class="regras">
        <div><span>👷</span><p><b>Operadores:</b> você tem ${LinhaCfg.operadores}. Mais operadores em um posto = posto mais rápido. Use <b>+</b> e <b>−</b> a qualquer momento.</p></div>
        <div><span>🐢</span><p><b>Gargalo:</b> o posto mais lento define a produção. Observe onde as peças se acumulam (estoque intermediário).</p></div>
        <div><span>🔧</span><p><b>Quebras:</b> máquinas podem parar. Clique em <b>Chamar manutenção</b> rapidamente.</p></div>
        <div><span>📦</span><p><b>Material:</b> o corte consome barras. Peça reposição antes de acabar – a entrega demora.</p></div>
        <div><span>❌</span><p><b>Defeitos:</b> máquinas sem manutenção preventiva geram mais refugo. A qualidade separa as peças ruins.</p></div>
        <div><span>⏱️</span><p><b>Turno:</b> 06:00 às 14:00 (${LinhaCfg.duracao} segundos). Use 2× para acelerar.</p></div>
      </div>
      <div class="acoes"><button class="btn grande" id="comecar">Iniciar turno ▶</button></div>
    </div>`;
  $('#comecar', el).onclick = () => iniciarLinha(el);
});

function iniciarLinha(el) {
  const C = LinhaCfg;
  const S = {
    t: 0, velocidade: 1, pausado: false, fim: false,
    estoque: C.estoqueInicial, pedidoMaterial: null, pedidosMaterial: 0,
    boas: 0, refugo: 0, quebras: 0, tempoParado: 0, faltaMaterial: 0,
    livres: C.operadores - C.postos.length,
    buffers: C.postos.slice(0, -1).map(() => []), // fila entre posto i e i+1
    postos: C.postos.map(p => ({
      ...p, ops: 1, peca: null, progresso: 0, estado: 'ocioso',
      quebrado: false, reparo: 0, desgaste: 0, feitas: 0, tempoOcupado: 0, tempoBloqueado: 0
    })),
    log: []
  };

  el.innerHTML = `
    <div class="linha-painel">
      <div class="kpi"><small>Relógio</small><b id="k-hora">06:00</b></div>
      <div class="kpi"><small>Peças boas</small><b id="k-boas">0</b><span>meta ${C.meta}</span></div>
      <div class="kpi"><small>Refugo</small><b id="k-refugo">0</b></div>
      <div class="kpi"><small>Matéria-prima</small><b id="k-estoque">0</b><span id="k-pedido"></span></div>
      <div class="kpi"><small>Operadores livres</small><b id="k-livres">0</b></div>
      <div class="kpi controles">
        <button class="btn sec pequeno" id="pausa">⏸ Pausar</button>
        <button class="btn sec pequeno" id="vel">⏩ 2×</button>
      </div>
    </div>
    <div class="progresso turno"><div id="k-turno"></div></div>
    <div class="linha" id="linha">
      <div class="posto-mp">
        <div class="mp-icone">🧱</div>
        <small>Matéria-prima</small>
        <b id="mp-qtd">0</b>
        <button class="btn pequeno" id="pedir">Pedir material</button>
      </div>
      ${S.postos.map((p, i) => `
        <span class="esteira" aria-hidden="true">➜</span>
        <div class="posto" id="p-${i}">
          <div class="posto-topo"><span class="posto-icone">${p.icone}</span><strong>${p.nome}</strong></div>
          <div class="posto-estado" id="pe-${i}">Ocioso</div>
          <div class="progresso mini"><div id="pp-${i}"></div></div>
          <div class="posto-ops">
            <button class="btn sec mini" data-menos="${i}" aria-label="Remover operador">−</button>
            <span id="po-${i}">👷</span>
            <button class="btn sec mini" data-mais="${i}" aria-label="Adicionar operador">+</button>
          </div>
          <small class="posto-info" id="pi-${i}"></small>
          <div class="posto-desgaste" title="Desgaste da máquina"><div id="pd-${i}"></div></div>
          <div class="posto-acoes" id="pa-${i}"></div>
        </div>
        ${i < S.postos.length - 1 ? `<div class="buffer" id="b-${i}" title="Estoque intermediário"></div>` : ''}`).join('')}
      <span class="esteira" aria-hidden="true">➜</span>
      <div class="posto-mp saida"><div class="mp-icone">🚚</div><small>Entregues</small><b id="saida">0</b></div>
    </div>
    <div class="linha-rodape">
      <div class="cartao log"><h3>📢 Ocorrências</h3><ul id="log"></ul></div>
      <div class="cartao dica-box" id="dica"><h3>💡 Dica do supervisor</h3><p>Observe qual posto tem fila acumulada antes dele. Esse é o gargalo!</p></div>
    </div>`;

  const registrar = (msg, tipo = '') => {
    const hora = $('#k-hora').textContent;
    S.log.unshift(`<li class="${tipo}"><b>${hora}</b> ${msg}</li>`);
    S.log = S.log.slice(0, 8);
    $('#log').innerHTML = S.log.join('');
  };

  /* ----- Controles ----- */
  $$('[data-mais]', el).forEach(b => b.onclick = () => {
    const p = S.postos[+b.dataset.mais];
    if (S.livres <= 0) { toast('Não há operadores livres. Retire de outro posto.', 'aviso'); return; }
    if (p.ops >= C.maxPorPosto) { toast(`Máximo de ${C.maxPorPosto} operadores por posto.`, 'aviso'); return; }
    p.ops++; S.livres--; desenhar();
  });
  $$('[data-menos]', el).forEach(b => b.onclick = () => {
    const p = S.postos[+b.dataset.menos];
    if (p.ops <= 1) { toast('Cada posto precisa de pelo menos 1 operador.', 'aviso'); return; }
    p.ops--; S.livres++; desenhar();
  });
  $('#pedir', el).onclick = () => {
    if (S.pedidoMaterial !== null) { toast('Já existe um pedido de material a caminho.', 'aviso'); return; }
    S.pedidoMaterial = C.tempoEntregaMaterial;
    S.pedidosMaterial++;
    registrar('📦 Pedido de material enviado ao almoxarifado.');
  };
  $('#pausa', el).onclick = () => {
    S.pausado = !S.pausado;
    $('#pausa', el).textContent = S.pausado ? '▶ Continuar' : '⏸ Pausar';
  };
  $('#vel', el).onclick = () => {
    S.velocidade = S.velocidade === 1 ? 2 : 1;
    $('#vel', el).textContent = S.velocidade === 1 ? '⏩ 2×' : '▶ 1×';
  };
  $('#linha', el).addEventListener('click', e => {
    const b = e.target.closest('[data-reparar]');
    if (!b) return;
    const p = S.postos[+b.dataset.reparar];
    if (p.quebrado && p.reparo <= 0) { p.reparo = C.tempoReparo; registrar(`🔧 Manutenção a caminho do posto ${p.nome}.`); }
  });
  $('#linha', el).addEventListener('click', e => {
    const b = e.target.closest('[data-preventiva]');
    if (!b) return;
    const p = S.postos[+b.dataset.preventiva];
    if (!p.quebrado && p.desgaste > 0.15) {
      p.quebrado = true; p.preventiva = true; p.reparo = 2.5;
      registrar(`🛠️ Manutenção preventiva no posto ${p.nome}.`);
    }
  });

  /* ----- Lógica da simulação ----- */
  const ultimo = S.postos.length - 1;
  const passo = dt => {
    S.t += dt;

    // chegada de material
    if (S.pedidoMaterial !== null) {
      S.pedidoMaterial -= dt;
      if (S.pedidoMaterial <= 0) {
        S.pedidoMaterial = null; S.estoque += C.loteMaterial;
        registrar(`✅ Chegaram ${C.loteMaterial} barras de matéria-prima.`, 'ok');
      }
    }

    for (let i = ultimo; i >= 0; i--) {
      const p = S.postos[i];
      // reparo
      if (p.quebrado) {
        S.tempoParado += dt;
        p.estado = 'quebrado';
        if (p.reparo > 0) {
          p.estado = 'reparo';
          p.reparo -= dt;
          if (p.reparo <= 0) {
            p.quebrado = false; p.desgaste = 0;
            registrar(`${p.preventiva ? '🛠️' : '✅'} Posto ${p.nome} ${p.preventiva ? 'revisado' : 'consertado'}.`, 'ok');
            p.preventiva = false;
          }
        }
        continue;
      }
      // quebras aleatórias (exceto expedição), mais prováveis com desgaste
      if (i < ultimo && p.peca && Math.random() < dt * (0.004 + p.desgaste * 0.03)) {
        p.quebrado = true; p.reparo = 0; S.quebras++;
        registrar(`🚨 Máquina do posto <b>${p.nome}</b> quebrou!`, 'erro');
        continue;
      }
      // pegar nova peça
      if (!p.peca) {
        if (i === 0) {
          if (S.estoque > 0) {
            S.estoque--; p.peca = { defeito: false }; p.progresso = 0;
            if (S.estoque === 3) registrar('⚠️ Matéria-prima acabando!', 'aviso');
          } else { p.estado = 'sem material'; S.faltaMaterial += dt; continue; }
        } else if (S.buffers[i - 1].length) {
          p.peca = S.buffers[i - 1].shift(); p.progresso = 0;
        } else { p.estado = 'ocioso'; continue; }
      }
      // trabalhar
      if (p.progresso < 1) {
        p.estado = 'produzindo';
        p.tempoOcupado += dt;
        p.progresso += dt * p.ops / p.base;
        if (i < 3) p.desgaste = Math.min(1, p.desgaste + dt * 0.006);
      }
      // terminar
      if (p.progresso >= 1) {
        p.progresso = 1;
        if (i === 1 && Math.random() < 0.03 + p.desgaste * 0.25) p.peca.defeito = true;
        if (i === 2 && Math.random() < 0.02 + p.desgaste * 0.15) p.peca.defeito = true;
        if (i === 3 && p.peca.defeito) {
          S.refugo++; p.feitas++; p.peca = null;
          if (S.refugo % 3 === 1) registrar('❌ Peça com defeito separada pela Qualidade.', 'aviso');
          continue;
        }
        if (i === ultimo) { S.boas++; p.feitas++; p.peca = null; continue; }
        if (S.buffers[i].length < C.capBuffer) {
          S.buffers[i].push(p.peca); p.feitas++; p.peca = null;
        } else { p.estado = 'bloqueado'; p.tempoBloqueado += dt; }
      }
    }
    if (S.t >= C.duracao) encerrar();
  };

  /* ----- Desenho ----- */
  const desenhar = () => {
    const minutos = Math.min(480, S.t / C.duracao * 480);
    const h = 6 + Math.floor(minutos / 60), m = Math.floor(minutos % 60);
    $('#k-hora').textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    $('#k-boas').textContent = S.boas;
    $('#k-boas').className = S.boas >= C.meta ? 'verde' : '';
    $('#k-refugo').textContent = S.refugo;
    $('#k-estoque').textContent = S.estoque;
    $('#k-estoque').className = S.estoque <= 3 ? 'vermelho' : '';
    $('#mp-qtd').textContent = S.estoque;
    $('#k-pedido').textContent = S.pedidoMaterial !== null ? `chega em ${Math.ceil(S.pedidoMaterial)}s` : '';
    $('#pedir').disabled = S.pedidoMaterial !== null;
    $('#k-livres').textContent = S.livres;
    $('#k-turno').style.width = (S.t / C.duracao * 100) + '%';
    $('#saida').textContent = S.boas;

    // gargalo: posto com maior tempo de ciclo efetivo
    const ciclos = S.postos.map(p => p.base / p.ops);
    const maxCiclo = Math.max(...ciclos);
    const nomesEstado = { produzindo: 'Produzindo', ocioso: 'Aguardando peça', bloqueado: 'Bloqueado (fila cheia)',
      'sem material': 'Sem material!', quebrado: 'QUEBRADO', reparo: 'Em manutenção' };
    S.postos.forEach((p, i) => {
      const card = $('#p-' + i);
      card.className = 'posto ' + p.estado.replace(' ', '-') + (ciclos[i] === maxCiclo ? ' gargalo' : '');
      $('#pe-' + i).textContent = nomesEstado[p.estado] || p.estado;
      $('#pp-' + i).style.width = (p.peca ? p.progresso * 100 : 0) + '%';
      $('#po-' + i).textContent = '👷'.repeat(p.ops);
      $('#pi-' + i).textContent = `${fmt(ciclos[i], 1)} s/peça · ${p.feitas} feitas`;
      const dz = $('#pd-' + i);
      dz.style.width = (p.desgaste * 100) + '%';
      dz.className = p.desgaste > 0.6 ? 'alto' : p.desgaste > 0.3 ? 'medio' : '';
      const acoes = $('#pa-' + i);
      let html = '';
      if (p.quebrado && p.reparo <= 0) html = `<button class="btn perigo pequeno pulsar" data-reparar="${i}">🔧 Chamar manutenção</button>`;
      else if (p.estado === 'reparo') html = `<small>⏳ ${Math.ceil(p.reparo)}s</small>`;
      else if (i < 3 && p.desgaste > 0.3) html = `<button class="btn sec pequeno" data-preventiva="${i}">🛠️ Preventiva</button>`;
      if (acoes.dataset.html !== html) { acoes.innerHTML = html; acoes.dataset.html = html; }
      if (i < S.buffers.length) {
        const b = $('#b-' + i);
        const n = S.buffers[i].length;
        b.innerHTML = Array.from({ length: C.capBuffer }, (_, k) => `<span class="${k < n ? 'cheio' : ''}"></span>`).join('');
        b.classList.toggle('lotado', n >= C.capBuffer);
      }
    });

    // dica dinâmica
    const g = S.postos[ciclos.indexOf(maxCiclo)];
    let dica = `O gargalo atual é <b>${g.nome}</b> (${fmt(maxCiclo, 1)} s/peça). Ritmo máximo da linha: ~${Math.floor((C.duracao - S.t) / maxCiclo)} peças no tempo restante.`;
    if (S.estoque <= 4 && S.pedidoMaterial === null) dica = '📦 A matéria-prima está acabando! Peça material agora.';
    else if (S.postos.some(p => p.quebrado && p.reparo <= 0)) dica = '🚨 Há uma máquina parada esperando manutenção!';
    else if (S.livres > 0) dica = `👷 Você tem ${S.livres} operador(es) sem posto. Coloque-os no gargalo!`;
    else if (S.postos.some(p => p.desgaste > 0.6)) dica = '🛠️ Uma máquina está muito desgastada. Manutenção preventiva evita quebras e defeitos.';
    $('#dica p').innerHTML = dica;
  };

  /* ----- Laço principal ----- */
  let ultimoT = performance.now();
  const timer = setInterval(() => {
    const agora = performance.now();
    let dt = Math.min(0.25, (agora - ultimoT) / 1000);
    ultimoT = agora;
    if (S.pausado || S.fim) return;
    dt *= S.velocidade;
    // subdivide para estabilidade
    const n = Math.ceil(dt / 0.05);
    for (let k = 0; k < n && !S.fim; k++) passo(dt / n);
    if (!S.fim) desenhar();
  }, 100);
  App.aoSair(() => clearInterval(timer));
  desenhar();
  registrar('🏁 Turno iniciado. Boa produção!');

  function encerrar() {
    S.fim = true;
    clearInterval(timer);
    desenhar();
    const total = S.boas + S.refugo;
    const atingimento = S.boas / C.meta;
    const qualidade = total ? S.boas / total : 0;
    const ciclos = S.postos.map(p => p.base / p.ops);
    const ocupacao = S.postos.map(p => p.tempoOcupado / C.duracao);
    let pontos = Math.min(1, atingimento) * 70 + qualidade * 30 - Math.max(0, S.quebras - 3) * 2;
    if (S.boas > C.meta) pontos += Math.min(10, (S.boas - C.meta));
    pontos = limitar(pontos, 0, 100);
    const recorde = Store.registrar('linha', pontos);
    const lic = [];
    if (atingimento < 1) lic.push('Você não atingiu a meta. Verifique se os operadores estavam concentrados no gargalo.');
    if (S.faltaMaterial > 5) lic.push(`A linha ficou ${Math.round(S.faltaMaterial)}s sem material. Use o <b>ponto de pedido</b>: peça antes de acabar!`);
    if (S.tempoParado > 10) lic.push(`As máquinas ficaram ${Math.round(S.tempoParado)}s paradas. Chame a manutenção rápido e faça preventivas.`);
    if (qualidade < 0.92) lic.push('Muito refugo! Máquinas desgastadas produzem mais defeitos. Manutenção preventiva melhora a qualidade.');
    if (!lic.length) lic.push('Excelente gestão do turno! Você equilibrou a linha, cuidou das máquinas e do material.');
    abrirModal(`
      <div class="resultado">
        <div class="resultado-icone">${atingimento >= 1 ? '🏆' : '📉'}</div>
        <h2>Fim do turno!</h2>
        <div class="estrelas grande">${estrelas(pontos)}</div>
        <p class="nota">${Math.round(pontos)} pontos ${recorde ? '<span class="pilula verde">Novo recorde!</span>' : ''}</p>
        <div class="kpis-final">
          <div><b>${S.boas}</b><small>peças boas (meta ${C.meta})</small></div>
          <div><b>${Math.round(atingimento * 100)}%</b><small>atingimento</small></div>
          <div><b>${Math.round(qualidade * 100)}%</b><small>índice de qualidade</small></div>
          <div><b>${S.quebras}</b><small>quebras</small></div>
        </div>
        <h3>Ocupação dos postos</h3>
        <div class="ocupacao">${S.postos.map((p, i) => `
          <div><span>${p.icone} ${p.nome}</span><div class="progresso mini"><div style="width:${Math.round(ocupacao[i] * 100)}%"></div></div><small>${Math.round(ocupacao[i] * 100)}% · ${fmt(ciclos[i], 1)} s/peça</small></div>`).join('')}
        </div>
        <div class="msg info"><b>Lições do turno:</b><ul>${lic.map(l => `<li>${l}</li>`).join('')}</ul></div>
        <div class="acoes">
          <button class="btn sec" id="sair">Voltar ao início</button>
          <button class="btn" id="denovo">Jogar novamente</button>
        </div>
      </div>`, { fechavel: false });
    $('#denovo').onclick = () => { fecharModal(); App.go('linha'); };
    $('#sair').onclick = () => { fecharModal(); App.go('inicio'); };
  }
}
