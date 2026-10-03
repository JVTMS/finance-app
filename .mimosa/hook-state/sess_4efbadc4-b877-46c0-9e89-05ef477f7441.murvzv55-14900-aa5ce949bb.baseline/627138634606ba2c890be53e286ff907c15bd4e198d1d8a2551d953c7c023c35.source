// Gera a conta de demonstração com ~9 meses de histórico realista e determinístico.
// A conta demo não possui senha: o acesso é feito pelo botão "Entrar com conta demo"
// (login dedicado no auth), então nenhum segredo existe aqui ou no cliente.

import { replaceAll, findBy } from '../database/db';
import { hashPassword } from '../auth/auth';
import { DEFAULT_CATEGORIES, INVESTMENT_TYPES } from '../data/categories';
import { monthEndISO } from '../utils/dates';
import { uid } from '../utils/format';

export const DEMO_EMAIL = 'demo@finance.app';

const START_MONTH = '2026-02';
const END_MONTH = '2026-10';
const TODAY = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})();

function mulberry32(seed) {
  let a = seed;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function monthsBetween(from, to) {
  const keys = [];
  let [y, m] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  while (y < ty || (y === ty && m <= tm)) {
    keys.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return keys;
}

function dISO(key, day) {
  const [y, m] = key.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  const d = Math.min(day, last);
  return `${key}-${String(d).padStart(2, '0')}`;
}

export async function ensureDemoSeed() {
  if (findBy('users', (u) => u.email === DEMO_EMAIL)) return;

  const rng = mulberry32(20261003);
  const rint = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
  const rmoney = (min, max) => Math.round((min + rng() * (max - min)) * 100) / 100;
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];

  let id = 1;
  const nid = () => id++;
  const now = Date.now();

  const userId = nid();
  // Senha aleatória e descartada: o acesso demo usa caminho dedicado no auth.
  const user = {
    id: userId,
    name: 'Demonstração',
    email: DEMO_EMAIL,
    passHash: await hashPassword(uid()),
    createdAt: now,
  };

  const categories = DEFAULT_CATEGORIES.map((c) => ({ id: nid(), userId, createdAt: now, ...c }));
  const cat = (name) => categories.find((c) => c.name === name).id;

  const accNubank = { id: nid(), userId, createdAt: now, name: 'Nubank', institution: 'Nubank', type: 'conta', color: '#8b5cf6', initialBalance: 4200 };
  const accItau = { id: nid(), userId, createdAt: now, name: 'Itaú', institution: 'Itaú Unibanco', type: 'conta', color: '#f97316', initialBalance: 9800 };
  const accCarteira = { id: nid(), userId, createdAt: now, name: 'Carteira', institution: 'Dinheiro físico', type: 'carteira', color: '#94a3b8', initialBalance: 600 };
  const accounts = [accNubank, accItau, accCarteira];

  const months = monthsBetween(START_MONTH, END_MONTH);
  const transactions = [];
  let txSeq = 0;
  const addTx = (tx) => {
    if (tx.date > TODAY) return;
    transactions.push({ id: nid(), userId, createdAt: now + txSeq++, ...tx });
  };

  // Investimentos com aporte mensal e marcação de valor no fim de cada mês.
  const invDefs = [
    { name: 'CDB Banco Inter 115% CDI', type: 'CDB', institution: 'Banco Inter', rate: 0.0085, contribution: 400 },
    { name: 'Tesouro IPCA+ 2035', type: 'Tesouro', institution: 'XP Investimentos', rate: 0.008, contribution: 300 },
    { name: 'ETF IVVB11 — S&P 500', type: 'ETF', institution: 'Rico Investimentos', rate: 0.009, vol: 0.03, contribution: 200 },
    { name: 'FII MXRF11', type: 'FII', institution: 'XP Investimentos', rate: 0.0055, rate2: 0.0045, contribution: 100 },
  ];
  const invState = invDefs.map((d) => ({ ...d, value: 0, invested: 0, marks: [] }));
  const investments = [];

  for (const key of months) {
    const isCurrentMonth = key === END_MONTH;

    // ---- Entradas ----
    addTx({ type: 'receita', name: 'Salário', amount: 5800, date: dISO(key, isCurrentMonth ? 2 : 5), categoryId: cat('Salário'), accountId: accNubank.id, description: 'Salário mensal', toAccountId: null, investmentId: null });
    if (isCurrentMonth || rng() > 0.25) {
      addTx({ type: 'receita', name: pick(['Projeto de site', 'Consultoria', 'Design de marca', 'Aula particular']), amount: rmoney(320, 1250), date: dISO(key, isCurrentMonth ? 1 : rint(6, 26)), categoryId: cat('Freelance'), accountId: accNubank.id, description: '', toAccountId: null, investmentId: null });
    }

    // ---- Saídas fixas ----
    if (!isCurrentMonth) {
      addTx({ type: 'despesa', name: 'Aluguel', amount: 1900, date: dISO(key, 10), categoryId: cat('Moradia'), accountId: accItau.id, description: '', toAccountId: null, investmentId: null });
      addTx({ type: 'transferencia', name: 'Transferência para Itaú', amount: 2500, date: dISO(key, 8), categoryId: null, accountId: accNubank.id, toAccountId: accItau.id, description: 'Cobrir contas fixas', investmentId: null });
      addTx({ type: 'despesa', name: 'Netflix', amount: 49.9, date: dISO(key, 15), categoryId: cat('Assinaturas'), accountId: accNubank.id, description: '', toAccountId: null, investmentId: null });
      addTx({ type: 'despesa', name: 'Spotify', amount: 21.9, date: dISO(key, 18), categoryId: cat('Assinaturas'), accountId: accNubank.id, description: '', toAccountId: null, investmentId: null });
      addTx({ type: 'transferencia', name: 'Saque para carteira', amount: 300, date: dISO(key, 6), categoryId: null, accountId: accNubank.id, toAccountId: accCarteira.id, description: '', investmentId: null });
    }

    // ---- Saídas variáveis ----
    const mercadoDays = isCurrentMonth ? [1, 2] : [3, 10, 17, 24];
    mercadoDays.forEach((day) => {
      addTx({ type: 'despesa', name: pick(['Supermercado', 'Feira livre', 'Compras do mês', 'Hortifruti']), amount: rmoney(140, 380), date: dISO(key, day + rint(0, 1)), categoryId: cat('Mercado'), accountId: accNubank.id, description: '', toAccountId: null, investmentId: null });
    });
    (isCurrentMonth ? [2] : [rint(4, 12), rint(14, 22), rint(23, 27)]).forEach((day) => {
      addTx({ type: 'despesa', name: pick(['Uber', 'Combustível', 'Ônibus', 'Estacionamento']), amount: rmoney(28, 130), date: dISO(key, day), categoryId: cat('Transporte'), accountId: pick([accNubank, accCarteira]).id, description: '', toAccountId: null, investmentId: null });
    });
    if (!isCurrentMonth) {
      const foods = rint(1, 3);
      for (let i = 0; i < foods; i++) {
        addTx({ type: 'despesa', name: pick(['Restaurante', 'iFood', 'Padaria', 'Cafeteria']), amount: rmoney(24, 95), date: dISO(key, rint(2, 27)), categoryId: cat('Alimentação'), accountId: accNubank.id, description: '', toAccountId: null, investmentId: null });
      }
      if (rng() < 0.35) addTx({ type: 'despesa', name: pick(['Farmácia', 'Consulta médica', 'Exames']), amount: rmoney(75, 260), date: dISO(key, rint(5, 25)), categoryId: cat('Saúde'), accountId: accNubank.id, description: '', toAccountId: null, investmentId: null });
      if (rng() < 0.55) addTx({ type: 'despesa', name: pick(['Cinema', 'Bar com amigos', 'Show', 'Passeio de fim de semana']), amount: rmoney(40, 160), date: dISO(key, rint(8, 26)), categoryId: cat('Lazer'), accountId: accNubank.id, description: '', toAccountId: null, investmentId: null });
      if (rng() < 0.45) addTx({ type: 'despesa', name: pick(['Loja de roupas', 'Presente', 'Casa e utilidades', 'Eletrônico']), amount: rmoney(60, 420), date: dISO(key, rint(3, 27)), categoryId: cat('Compras'), accountId: accNubank.id, description: '', toAccountId: null, investmentId: null });
      if (rng() < 0.3) addTx({ type: 'despesa', name: pick(['Curso online', 'Livro', 'Material de estudo']), amount: rmoney(35, 180), date: dISO(key, rint(5, 24)), categoryId: cat('Educação'), accountId: accNubank.id, description: '', toAccountId: null, investmentId: null });

      // ---- Investimentos (aporte dia 20) ----
      for (const inv of invState) {
        inv.invested += inv.contribution;
        inv.value += inv.contribution;
        addTx({ type: 'investimento', name: `Aporte — ${inv.name}`, amount: inv.contribution, date: dISO(key, 20), categoryId: null, accountId: accItau.id, toAccountId: null, description: 'Aporte mensal', investmentId: null });
      }
    }

    // ---- Marcação de valor fim do mês ----
    for (const inv of invState) {
      if (inv.value <= 0) continue;
      const growth = inv.rate + (inv.vol ? (rng() - 0.5) * 2 * inv.vol : 0) + (inv.rate2 || 0);
      inv.value = Math.round(inv.value * (1 + growth * (isCurrentMonth ? 0.12 : 1)) * 100) / 100;
      inv.marks.push({ date: isCurrentMonth ? TODAY : monthEndISO(key), value: inv.value });
    }
  }

  investments.push(
    ...invState.map((inv, idx) => ({
      id: nid(),
      userId,
      createdAt: now,
      name: inv.name,
      type: inv.type,
      institution: inv.institution,
      note: '',
      startedAt: '2026-02-20',
      invested: Math.round(inv.invested * 100) / 100,
      current: inv.value,
      history: inv.marks,
      _slot: idx,
    }))
  );

  // Associa as transações de investimento aos registros por ordem de criação.
  const invTxs = transactions.filter((t) => t.type === 'investimento');
  const perInv = Math.max(1, Math.floor(invTxs.length / investments.length));
  invTxs.forEach((tx, i) => {
    const slot = Math.min(Math.floor(i / perInv), investments.length - 1);
    tx.investmentId = investments.find((inv) => inv._slot === slot).id;
  });
  investments.forEach((inv) => delete inv._slot);

  const notifications = [
    { id: nid(), userId, createdAt: now - 3600e3, type: 'success', title: 'Rendimento creditado', message: 'CDB Banco Inter atualizado com rendimento mensal.', read: true },
    { id: nid(), userId, createdAt: now - 86400e3 * 2, type: 'success', title: 'Salário recebido', message: 'R$ 5.800,00 em Nubank.', read: true },
    { id: nid(), userId, createdAt: now - 86400e3 * 5, type: 'info', title: 'Relatório disponível', message: 'O relatório de setembro está pronto para exportar.', read: true },
  ];

  replaceAll({
    nextId: id,
    users: [user],
    sessions: [],
    accounts,
    transactions,
    investments,
    categories,
    settings: {},
    notifications,
  });
}
