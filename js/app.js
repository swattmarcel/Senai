/* =========================================================
   Telas de início e ranking + inicialização
   ========================================================= */
'use strict';

App.rota('inicio', el => {
  const j = Store.jogador();
  const outros = Object.values(Store.dados.jogadores).sort((a, b) => a.nome.localeCompare(b.nome));

  const cadastro = `
    <div class="cartao cadastro">
      <h2>${j ? '👥 Trocar ou cadastrar aprendiz' : '👋 Bem-vindo(a)! Quem vai jogar?'}</h2>
      <form id="form-novo" class="form-linha">
        <label>Nome<input name="nome" required maxlength="40" placeholder="Ex.: Ana Souza" autocomplete="off"></label>
        <label>Turma<input name="turma" maxlength="30" placeholder="Ex.: Aprendizagem 2026-A" autocomplete="off"></label>
        <button class="btn" type="submit">Cadastrar e começar</button>
      </form>
      ${outros.length ? `
        <div class="lista-jogadores">
          <small>Ou escolha um aprendiz já cadastrado neste computador:</small>
          <div>${outros.map(o => `<button class="chip ${j && o.id === j.id ? 'ativo' : ''}" data-sel="${o.id}">${esc(o.nome)} <small>${Store.total(o)} pts</small></button>`).join('')}</div>
        </div>` : ''}
    </div>`;

  if (!j) {
    el.innerHTML = `
      <section class="hero">
        <div class="hero-texto">
          <h1>Bem-vindo(a) à <span>Fábrica Escola</span> 🏭</h1>
          <p>Uma fábrica virtual completa para você aprender como funciona a indústria:
          da segurança na portaria até o caminhão de entrega. Simule, jogue e dispute o ranking com a sua turma!</p>
        </div>
        <div class="hero-fluxo" aria-hidden="true">🦺 ➜ 📥 ➜ 🗄️ ➜ 📊 ➜ ⚙️ ➜ 🔧 ➜ 🔍 ➜ 🚚</div>
      </section>
      ${cadastro}`;
  } else {
    const etapasFeitas = Etapas.filter(e => (j.pontos['etapa_' + e.id] ?? -1) >= NOTA_MINIMA).length;
    const jogosFeitos = Jogos.filter(g => j.pontos['jogo_' + g.id] !== undefined).length;
    const proxima = Etapas.find((e, k) => etapaLiberada(j, k) && (j.pontos['etapa_' + e.id] ?? -1) < NOTA_MINIMA);
    el.innerHTML = `
      <section class="hero">
        <div class="hero-texto">
          <h1>Olá, <span>${esc(j.nome)}</span>! 👷</h1>
          <p>Seu turno está para começar. Escolha um módulo abaixo.</p>
          <div class="resumo-jogador">
            <div><b>${Store.total(j)}</b><small>pontos totais</small></div>
            <div><b>${etapasFeitas}/${Etapas.length}</b><small>setores concluídos</small></div>
            <div><b>${jogosFeitos}/${Jogos.length}</b><small>jogos jogados</small></div>
            <div><b>${j.pontos.linha ?? '–'}</b><small>recorde na linha</small></div>
          </div>
        </div>
        <div class="hero-fluxo" aria-hidden="true">🦺 ➜ 📥 ➜ 🗄️ ➜ 📊 ➜ ⚙️ ➜ 🔧 ➜ 🔍 ➜ 🚚</div>
      </section>
      <div class="grade-cartoes">
        <button class="cartao-modulo destaque" data-go="fabrica">
          <span class="modulo-icone">🏭</span>
          <strong>Jornada na Fábrica</strong>
          <p>Percorra os ${Etapas.length} setores: segurança, recebimento, almoxarifado, PCP, produção, montagem, qualidade e expedição.</p>
          <span class="setor-status">${proxima ? `Próximo: ${proxima.icone} ${proxima.titulo}` : '🎓 Jornada completa!'}</span>
        </button>
        <button class="cartao-modulo" data-go="linha">
          <span class="modulo-icone">⚙️</span>
          <strong>Simulador de Linha de Produção</strong>
          <p>Seja o líder do turno: balanceie operadores, encontre o gargalo, cuide da manutenção e bata a meta.</p>
          <span class="setor-status">${j.pontos.linha !== undefined ? `${estrelas(j.pontos.linha)} Recorde: ${j.pontos.linha} pts` : 'Ainda não jogado'}</span>
        </button>
        <button class="cartao-modulo" data-go="jogos">
          <span class="modulo-icone">🎮</span>
          <strong>Jogos</strong>
          <p>Quiz de segurança, caça aos riscos, 5S, memória das ferramentas e inspetor na esteira.</p>
          <span class="setor-status">${jogosFeitos}/${Jogos.length} jogados</span>
        </button>
        <button class="cartao-modulo" data-go="ranking">
          <span class="modulo-icone">🏆</span>
          <strong>Ranking da Turma</strong>
          <p>Veja quem está na liderança e exporte os resultados para planilha.</p>
          <span class="setor-status">${Object.keys(Store.dados.jogadores).length} aprendiz(es)</span>
        </button>
      </div>
      ${cadastro}`;
  }

  $('#form-novo', el).onsubmit = e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const nome = String(f.get('nome')).trim();
    if (!nome) return;
    Store.criarJogador(nome, String(f.get('turma') || '').trim());
    App.atualizarJogador();
    toast(`Bem-vindo(a), ${esc(nome)}! 🎉`, 'ok');
    App.go('inicio');
  };
  $$('[data-sel]', el).forEach(b => b.onclick = () => {
    Store.selecionar(b.dataset.sel);
    App.atualizarJogador();
    toast(`Aprendiz selecionado: ${esc(Store.jogador().nome)}`, 'ok');
    App.go('inicio');
  });
});

App.rota('ranking', el => {
  const jogadores = Object.values(Store.dados.jogadores).sort((a, b) => Store.total(b) - Store.total(a));
  const turmas = [...new Set(jogadores.map(j => j.turma).filter(Boolean))].sort();
  let filtro = '';

  const render = () => {
    const lista = jogadores.filter(j => !filtro || j.turma === filtro);
    const medalha = i => ['🥇', '🥈', '🥉'][i] || (i + 1) + 'º';
    el.innerHTML = `
      <section class="cabecalho-secao">
        <h1>🏆 Ranking da Turma</h1>
        <p>Pontuação total = soma das melhores notas em cada atividade (máximo ${Atividades.lista.length * 100} pontos).</p>
      </section>
      <div class="cartao">
        <div class="ranking-topo">
          ${turmas.length ? `<label>Turma: <select id="filtro"><option value="">Todas</option>
            ${turmas.map(t => `<option ${t === filtro ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>` : '<span></span>'}
          <div class="acoes">
            <button class="btn sec pequeno" id="csv" ${lista.length ? '' : 'disabled'}>⬇️ Exportar planilha (CSV)</button>
            <button class="btn perigo pequeno" id="zerar" ${jogadores.length ? '' : 'disabled'}>🗑️ Apagar todos</button>
          </div>
        </div>
        ${lista.length ? `
        <div class="podio">
          ${lista.slice(0, 3).map((j, i) => `<div class="podio-${i + 1}"><span>${medalha(i)}</span><b>${esc(j.nome)}</b><small>${Store.total(j)} pts</small></div>`).join('')}
        </div>
        <div class="tabela-rolagem">
          <table class="tabela ranking">
            <thead><tr><th>#</th><th>Aprendiz</th><th>Turma</th><th>Total</th>
              <th>Jornada</th><th>Linha</th><th>Jogos</th><th></th></tr></thead>
            <tbody>${lista.map((j, i) => {
              const soma = g => Atividades.lista.filter(a => a.grupo === g).reduce((s, a) => s + (j.pontos[a.id] || 0), 0);
              const atual = Store.dados.atual === j.id;
              return `<tr class="${atual ? 'sel' : ''}">
                <td>${medalha(i)}</td><td><b>${esc(j.nome)}</b>${atual ? ' <span class="pilula">você</span>' : ''}</td>
                <td>${esc(j.turma || '–')}</td><td><b>${Store.total(j)}</b></td>
                <td>${soma('Jornada')}</td><td>${j.pontos.linha ?? '–'}</td><td>${soma('Jogos')}</td>
                <td class="acoes-linha"><button class="btn sec mini" data-ver="${j.id}" title="Detalhes">🔎</button>
                  <button class="btn sec mini" data-del="${j.id}" title="Remover">✕</button></td></tr>`;
            }).join('')}</tbody>
          </table>
        </div>` : '<p class="dica centro">Nenhum aprendiz cadastrado ainda. Vá ao Início para se cadastrar.</p>'}
      </div>`;

    const f = $('#filtro', el); if (f) f.onchange = () => { filtro = f.value; render(); };
    $('#csv', el).onclick = () => exportarCSV(lista);
    $('#zerar', el).onclick = async () => {
      if (await confirmar('Apagar <b>todos</b> os aprendizes e pontuações deste computador? Esta ação não pode ser desfeita.')) {
        Store.dados = { jogadores: {}, atual: null }; Store.salvar(); App.atualizarJogador(); App.go('ranking');
      }
    };
    $$('[data-del]', el).forEach(b => b.onclick = async () => {
      const j = Store.dados.jogadores[b.dataset.del];
      if (await confirmar(`Remover <b>${esc(j.nome)}</b> e todas as suas pontuações?`)) {
        Store.removerJogador(j.id); App.atualizarJogador(); App.go('ranking');
      }
    });
    $$('[data-ver]', el).forEach(b => b.onclick = () => {
      const j = Store.dados.jogadores[b.dataset.ver];
      abrirModal(`<h2>${esc(j.nome)}</h2><p>${esc(j.turma || '')}</p>
        <table class="tabela">${Atividades.lista.map(a => `<tr><td>${a.nome}</td><td>${j.pontos[a.id] !== undefined ? estrelas(j.pontos[a.id]) + ' ' + j.pontos[a.id] : '–'}</td></tr>`).join('')}
        <tr><th>Total</th><th>${Store.total(j)}</th></tr></table>`);
    });
  };
  render();
});

function exportarCSV(lista) {
  const cab = ['Aprendiz', 'Turma', 'Total', ...Atividades.lista.map(a => a.nome)];
  const linhas = lista.map(j => [j.nome, j.turma || '', Store.total(j), ...Atividades.lista.map(a => j.pontos[a.id] ?? '')]);
  const csv = [cab, ...linhas].map(l => l.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ranking-fabrica-escola-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------- Inicialização ---------- */
Store.carregar();
App.atualizarJogador();
App.go('inicio');
