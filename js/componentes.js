/* =========================================================
   Componentes reutilizáveis de desafio
   Cada componente: Comp.tipo(el, cfg, done(pontos 0-100))
   ========================================================= */
'use strict';

const Comp = {

  /* ---- Selecionar vários itens corretos ---- */
  multiSelect(el, cfg, done) {
    delete el.dataset.fim;
    const itens = embaralhar(cfg.itens);
    const totalCorretos = itens.filter(i => i.ok).length;
    el.innerHTML = `
      <h3>${cfg.titulo}</h3>
      <p class="enunciado">${cfg.enunciado}</p>
      <div class="grade-itens">
        ${itens.map((it, k) => `
          <button class="item-sel" data-k="${k}">
            <span class="item-icone">${it.i || '•'}</span>
            <span>${esc(it.t)}</span>
          </button>`).join('')}
      </div>
      <div class="feedback"></div>
      <div class="acoes"><button class="btn" id="verificar">Verificar</button></div>`;
    $$('.item-sel', el).forEach(b => b.onclick = () => {
      if (el.dataset.fim) return;
      b.classList.toggle('marcado');
    });
    $('#verificar', el).onclick = () => {
      if (el.dataset.fim) { done(el._pontos); return; }
      el.dataset.fim = '1';
      let certos = 0, errados = 0;
      const exps = [];
      $$('.item-sel', el).forEach(b => {
        const it = itens[+b.dataset.k];
        const marcado = b.classList.contains('marcado');
        if (marcado && it.ok) { certos++; b.classList.add('certo'); }
        else if (marcado && !it.ok) { errados++; b.classList.add('errado'); if (it.exp) exps.push('❌ <b>' + esc(it.t) + ':</b> ' + it.exp); }
        else if (!marcado && it.ok) { b.classList.add('faltou'); if (it.exp) exps.push('⚠️ <b>' + esc(it.t) + ':</b> ' + it.exp); }
        b.disabled = true;
      });
      const pontos = Math.max(0, (certos - errados) / totalCorretos) * 100;
      el._pontos = pontos;
      $('.feedback', el).innerHTML = Comp._resumo(pontos,
        `Você marcou ${certos} de ${totalCorretos} itens corretos${errados ? ` e ${errados} incorreto(s)` : ''}.`, exps);
      $('#verificar', el).textContent = 'Continuar ➜';
    };
  },

  /* ---- Perguntas de múltipla escolha ---- */
  quiz(el, cfg, done) {
    delete el.dataset.respondido;
    const perguntas = cfg.embaralhar === false ? cfg.perguntas : embaralhar(cfg.perguntas);
    const lista = cfg.quantidade ? perguntas.slice(0, cfg.quantidade) : perguntas;
    let idx = 0, soma = 0, acertos = 0, timer = null;

    const mostrar = () => {
      clearInterval(timer);
      const q = lista[idx];
      const ops = q.op.map((t, k) => ({ t, k }));
      const opsMostradas = q.fixo ? ops : embaralhar(ops);
      el.innerHTML = `
        <div class="quiz-topo">
          <h3>${cfg.titulo}</h3>
          <span class="pilula">Pergunta ${idx + 1}/${lista.length}</span>
        </div>
        ${cfg.tempo ? '<div class="barra-tempo"><div></div></div>' : ''}
        <p class="pergunta">${q.p}</p>
        <div class="opcoes">
          ${opsMostradas.map(o => `<button class="opcao" data-k="${o.k}">${esc(o.t)}</button>`).join('')}
        </div>
        <div class="feedback"></div>
        <div class="acoes"></div>`;
      let restante = cfg.tempo || 0;
      if (cfg.tempo) {
        const barra = $('.barra-tempo div', el);
        const inicio = performance.now();
        timer = setInterval(() => {
          restante = Math.max(0, cfg.tempo - (performance.now() - inicio) / 1000);
          barra.style.width = (restante / cfg.tempo * 100) + '%';
          barra.classList.toggle('urgente', restante < cfg.tempo * 0.3);
          if (restante <= 0) responder(-1);
        }, 100);
        App.aoSair(() => clearInterval(timer));
      }
      const responder = k => {
        clearInterval(timer);
        if (el.dataset.respondido === String(idx)) return;
        el.dataset.respondido = String(idx);
        const certo = k === q.c;
        if (certo) {
          acertos++;
          soma += cfg.tempo ? 60 + 40 * (restante / cfg.tempo) : 100;
        }
        $$('.opcao', el).forEach(b => {
          b.disabled = true;
          if (+b.dataset.k === q.c) b.classList.add('certo');
          else if (+b.dataset.k === k) b.classList.add('errado');
        });
        $('.feedback', el).innerHTML = `<div class="msg ${certo ? 'ok' : 'erro'}">
          ${k === -1 ? '⏰ Tempo esgotado!' : certo ? '✅ Correto!' : '❌ Não foi dessa vez.'}
          ${q.exp ? `<p>${q.exp}</p>` : ''}</div>`;
        const ultima = idx === lista.length - 1;
        $('.acoes', el).innerHTML = `<button class="btn">${ultima ? 'Ver resultado' : 'Próxima ➜'}</button>`;
        $('.acoes .btn', el).onclick = () => {
          if (ultima) {
            const pontos = soma / lista.length;
            if (cfg.semResumo) { done(pontos, acertos, lista.length); return; }
            el.innerHTML = `<h3>${cfg.titulo}</h3>` + Comp._resumo(pontos, `Você acertou ${acertos} de ${lista.length}.`) +
              '<div class="acoes"><button class="btn">Continuar ➜</button></div>';
            $('.acoes .btn', el).onclick = () => done(pontos, acertos, lista.length);
          } else { idx++; mostrar(); }
        };
        $('.acoes .btn', el).focus();
      };
      $$('.opcao', el).forEach(b => b.onclick = () => responder(+b.dataset.k));
    };
    mostrar();
  },

  /* ---- Colocar etapas na ordem correta ---- */
  ordenar(el, cfg, done) {
    el._fb = '';
    const corretos = cfg.passos;
    const embar = embaralhar(corretos.map((t, k) => ({ t, k })));
    let escolhidos = [];
    let fim = false;

    const render = () => {
      el.innerHTML = `
        <h3>${cfg.titulo}</h3>
        <p class="enunciado">${cfg.enunciado}</p>
        <div class="ordem-colunas">
          <div>
            <h4>Etapas disponíveis</h4>
            <div class="ordem-lista disp">
              ${embar.filter(p => !escolhidos.includes(p)).map(p =>
                `<button class="ordem-item" data-k="${p.k}">${esc(p.t)}</button>`).join('') || '<p class="dica">Todas escolhidas!</p>'}
            </div>
          </div>
          <div>
            <h4>Sua sequência</h4>
            <ol class="ordem-lista seq">
              ${escolhidos.map((p, pos) => {
                const cls = fim ? (p.k === pos ? 'certo' : 'errado') : '';
                return `<li><button class="ordem-item ${cls}" data-rem="${pos}">${esc(p.t)}</button></li>`;
              }).join('') || '<p class="dica">Clique nas etapas à esquerda na ordem certa.</p>'}
            </ol>
          </div>
        </div>
        <div class="feedback">${el._fb || ''}</div>
        <div class="acoes">
          ${fim ? '<button class="btn" id="cont">Continuar ➜</button>' :
            `<button class="btn sec" id="limpar">Limpar</button>
             <button class="btn" id="verificar" ${escolhidos.length < corretos.length ? 'disabled' : ''}>Verificar</button>`}
        </div>`;
      if (fim) { $('#cont', el).onclick = () => done(el._pontos); return; }
      $$('.disp .ordem-item', el).forEach(b => b.onclick = () => {
        escolhidos.push(embar.find(p => p.k === +b.dataset.k)); render();
      });
      $$('[data-rem]', el).forEach(b => b.onclick = () => { escolhidos.splice(+b.dataset.rem, 1); render(); });
      $('#limpar', el).onclick = () => { escolhidos = []; render(); };
      $('#verificar', el).onclick = () => {
        fim = true;
        const certos = escolhidos.filter((p, pos) => p.k === pos).length;
        el._pontos = certos / corretos.length * 100;
        el._fb = Comp._resumo(el._pontos, `${certos} de ${corretos.length} etapas na posição correta.`,
          certos < corretos.length ? ['<b>Ordem correta:</b><ol>' + corretos.map(t => `<li>${esc(t)}</li>`).join('') + '</ol>'] : [],
          cfg.explicacao);
        render();
      };
    };
    render();
  },

  /* ---- Classificar cada item em uma categoria ---- */
  classificar(el, cfg, done) {
    delete el.dataset.fim;
    const itens = cfg.embaralhar === false ? cfg.itens : embaralhar(cfg.itens);
    const resp = {};
    el.innerHTML = `
      <h3>${cfg.titulo}</h3>
      <p class="enunciado">${cfg.enunciado}</p>
      <div class="class-lista">
        ${itens.map((it, k) => `
          <div class="class-item" data-k="${k}">
            <div class="class-desc">${it.html}</div>
            <div class="class-ops">
              ${cfg.opcoes.map(o => `<button class="class-op ${o.cls || ''}" data-v="${o.v}">${o.t}</button>`).join('')}
            </div>
            <div class="class-exp"></div>
          </div>`).join('')}
      </div>
      <div class="feedback"></div>
      <div class="acoes"><button class="btn" id="verificar" disabled>Verificar</button></div>`;
    const btn = $('#verificar', el);
    $$('.class-item', el).forEach(linha => {
      $$('.class-op', linha).forEach(b => b.onclick = () => {
        if (el.dataset.fim) return;
        $$('.class-op', linha).forEach(x => x.classList.remove('marcado'));
        b.classList.add('marcado');
        resp[linha.dataset.k] = b.dataset.v;
        btn.disabled = Object.keys(resp).length < itens.length;
      });
    });
    btn.onclick = () => {
      if (el.dataset.fim) { done(el._pontos); return; }
      el.dataset.fim = '1';
      let certos = 0;
      $$('.class-item', el).forEach(linha => {
        const it = itens[+linha.dataset.k];
        const ok = String(it.resp) === resp[linha.dataset.k];
        if (ok) certos++;
        linha.classList.add(ok ? 'certo' : 'errado');
        $('.class-exp', linha).innerHTML = (ok ? '✅ ' : '❌ ') + (it.exp || '');
      });
      el._pontos = certos / itens.length * 100;
      $('.feedback', el).innerHTML = Comp._resumo(el._pontos, `${certos} de ${itens.length} classificações corretas.`);
      btn.textContent = 'Continuar ➜';
    };
  },

  /* ---- Executa várias partes em sequência e tira a média ---- */
  sequencia(el, partes, done) {
    const notas = [];
    const rodar = i => {
      if (i >= partes.length) { done(notas.reduce((s, v) => s + v, 0) / notas.length, notas); return; }
      const p = partes[i];
      el.innerHTML = `<div class="passos">${partes.map((_, k) =>
        `<span class="${k < i ? 'feito' : k === i ? 'atual' : ''}">${k + 1}</span>`).join('')}</div><div class="parte"></div>`;
      const alvo = $('.parte', el);
      const fn = typeof p === 'function' ? p : (alvoEl, cb) => Comp[p.tipo](alvoEl, p, cb);
      fn(alvo, nota => { notas.push(nota); rodar(i + 1); });
    };
    rodar(0);
  },

  _resumo(pontos, texto, extras = [], explicacao = '') {
    const cls = pontos >= 70 ? 'ok' : pontos >= 40 ? 'medio' : 'erro';
    return `<div class="msg ${cls}">
      <div class="resumo-topo"><span class="estrelas">${estrelas(pontos)}</span><b>${Math.round(pontos)} pontos</b></div>
      <p>${texto}</p>
      ${extras.length ? '<div class="exps">' + extras.map(x => `<div>${x}</div>`).join('') + '</div>' : ''}
      ${explicacao ? `<p class="dica">💡 ${explicacao}</p>` : ''}
    </div>`;
  }
};
