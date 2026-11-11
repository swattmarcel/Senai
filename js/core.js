/* =========================================================
   Fábrica Escola – núcleo: estado, armazenamento, navegação
   ========================================================= */
'use strict';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function embaralhar(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function aleatorio(min, max) { return Math.random() * (max - min) + min; }
function limitar(v, min, max) { return Math.max(min, Math.min(max, v)); }
function fmt(n, casas = 2) { return Number(n).toFixed(casas).replace('.', ','); }

/* ---------- Armazenamento local ---------- */
const Store = {
  chave: 'fabrica_escola_v1',
  dados: { jogadores: {}, atual: null },

  carregar() {
    try {
      const bruto = localStorage.getItem(this.chave);
      if (bruto) this.dados = Object.assign({ jogadores: {}, atual: null }, JSON.parse(bruto));
    } catch (e) { /* navegador sem armazenamento: segue em memória */ }
  },
  salvar() {
    try { localStorage.setItem(this.chave, JSON.stringify(this.dados)); } catch (e) { /* ignora */ }
  },

  jogador() { return this.dados.jogadores[this.dados.atual] || null; },

  criarJogador(nome, turma) {
    const id = 'j' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    this.dados.jogadores[id] = { id, nome, turma, pontos: {}, etapas: {}, criado: new Date().toISOString() };
    this.dados.atual = id;
    this.salvar();
    return this.dados.jogadores[id];
  },

  selecionar(id) { if (this.dados.jogadores[id]) { this.dados.atual = id; this.salvar(); } },

  removerJogador(id) {
    delete this.dados.jogadores[id];
    if (this.dados.atual === id) this.dados.atual = null;
    this.salvar();
  },

  /** Registra a pontuação de uma atividade guardando a melhor. Retorna true se for recorde. */
  registrar(atividade, pontos) {
    const j = this.jogador();
    if (!j) return false;
    pontos = Math.round(limitar(pontos, 0, 100));
    const anterior = j.pontos[atividade];
    const recorde = anterior === undefined || pontos > anterior;
    if (recorde) j.pontos[atividade] = pontos;
    this.salvar();
    App.atualizarJogador();
    return recorde;
  },

  total(j = this.jogador()) {
    if (!j) return 0;
    return Object.values(j.pontos).reduce((s, v) => s + v, 0);
  }
};

/* ---------- Catálogo de atividades (para ranking) ---------- */
const Atividades = {
  lista: [], // {id, nome, grupo}
  registrar(id, nome, grupo) { this.lista.push({ id, nome, grupo }); },
  nome(id) { const a = this.lista.find(x => x.id === id); return a ? a.nome : id; }
};

/* ---------- Interface: toasts e modal ---------- */
function toast(msg, tipo = 'info', ms = 2600) {
  const t = document.createElement('div');
  t.className = 'toast ' + tipo;
  t.innerHTML = msg;
  $('#toasts').appendChild(t);
  setTimeout(() => t.classList.add('sair'), ms);
  setTimeout(() => t.remove(), ms + 400);
}

function abrirModal(html, { fechavel = true } = {}) {
  const m = $('#modal');
  m.innerHTML = `<div class="modal-caixa">${fechavel ? '<button class="modal-x" aria-label="Fechar">✕</button>' : ''}${html}</div>`;
  m.classList.remove('oculto');
  if (fechavel) {
    $('.modal-x', m).onclick = fecharModal;
    m.onclick = e => { if (e.target === m) fecharModal(); };
  } else m.onclick = null;
  return m;
}
function fecharModal() { $('#modal').classList.add('oculto'); $('#modal').innerHTML = ''; }

function confirmar(msg) {
  return new Promise(res => {
    const m = abrirModal(`<p>${msg}</p><div class="acoes"><button class="btn sec" data-r="0">Cancelar</button><button class="btn perigo" data-r="1">Confirmar</button></div>`);
    $$('[data-r]', m).forEach(b => b.onclick = () => { fecharModal(); res(b.dataset.r === '1'); });
  });
}

function estrelas(p) {
  const n = p >= 90 ? 3 : p >= 70 ? 2 : p >= 40 ? 1 : 0;
  return '★'.repeat(n) + '☆'.repeat(3 - n);
}

/* ---------- Navegação ---------- */
const App = {
  rotas: {},
  limpeza: [],
  rotaAtual: null,

  rota(nome, fn) { this.rotas[nome] = fn; },

  /** Registra função de limpeza (timers, listeners) executada ao sair da tela. */
  aoSair(fn) { this.limpeza.push(fn); },

  go(nome, params = {}) {
    this.limpeza.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
    this.limpeza = [];
    fecharModal();
    const precisaJogador = !['inicio', 'ranking'].includes(nome);
    if (precisaJogador && !Store.jogador()) {
      toast('Cadastre-se ou escolha um aprendiz para começar!', 'aviso');
      nome = 'inicio';
    }
    const fn = this.rotas[nome] || this.rotas.inicio;
    this.rotaAtual = nome;
    $$('#menu button').forEach(b => b.classList.toggle('ativo', b.dataset.go === nome));
    const el = $('#app');
    el.innerHTML = '';
    el.scrollTop = 0;
    window.scrollTo(0, 0);
    fn(el, params);
  },

  atualizarJogador() {
    const j = Store.jogador();
    const el = $('#jogador');
    if (!j) { el.innerHTML = '<span class="sem-jogador">Nenhum aprendiz</span>'; return; }
    el.innerHTML = `<span class="avatar">${esc(j.nome.charAt(0).toUpperCase())}</span>
      <div><strong>${esc(j.nome)}</strong><small>${esc(j.turma || '')} · ${Store.total(j)} pts</small></div>`;
  }
};

document.addEventListener('click', e => {
  const alvo = e.target.closest('[data-go]');
  if (alvo) { e.preventDefault(); App.go(alvo.dataset.go); }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') fecharModal();
  if (e.key === 'Enter' && e.target.matches('[data-go][role=button]')) App.go(e.target.dataset.go);
});
