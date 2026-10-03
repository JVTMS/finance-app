// Camada de acesso a dados: carrega o universo do usuário e aplica mutações
// com os efeitos colaterais corretos (ex.: investimento reduz saldo da conta).

import * as db from '../database/db';
import { DEFAULT_CATEGORIES } from '../data/categories';
import { todayISO } from '../utils/format';

const byDateDesc = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt);
const byCreatedDesc = (a, b) => b.createdAt - a.createdAt;

export function loadUserData(userId) {
  return {
    accounts: db.select('accounts', userId).sort((a, b) => a.id - b.id),
    transactions: db.select('transactions', userId).sort(byDateDesc),
    investments: db.select('investments', userId).sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1)),
    categories: db.select('categories', userId).sort((a, b) => a.id - b.id),
    notifications: db.select('notifications', userId).sort(byCreatedDesc).slice(0, 40),
  };
}

export function createDefaultUserData(userId) {
  if (db.select('categories', userId).length === 0) {
    DEFAULT_CATEGORIES.forEach((cat) => db.insert('categories', cat, userId));
  }
  if (db.select('accounts', userId).length === 0) {
    db.insert(
      'accounts',
      { name: 'Conta principal', institution: 'Meu banco', type: 'conta', color: '#7c8ba1', initialBalance: 0 },
      userId
    );
  }
}

// ---------- Contas ----------

export function addAccount(userId, data) {
  return db.insert(
    'accounts',
    {
      name: data.name.trim(),
      institution: (data.institution || '').trim(),
      type: data.type || 'conta',
      color: data.color || '#7c8ba1',
      initialBalance: Number(data.initialBalance) || 0,
    },
    userId
  );
}

export function updateAccount(userId, id, patch) {
  return db.update('accounts', id, patch);
}

export function deleteAccount(userId, id) {
  const linked = db.select('transactions', userId).filter(
    (t) => t.accountId === id || t.toAccountId === id
  );
  if (linked.length > 0) {
    return { error: `Esta conta possui ${linked.length} movimentação(ões). Exclua ou mova o histórico antes.` };
  }
  db.remove('accounts', id);
  return { ok: true };
}

// ---------- Transações ----------

/**
 * data: { type, name, amount, date, categoryId, accountId, toAccountId,
 *         description, investment: {name,type,institution,note} | investmentId }
 */
export function addTransaction(userId, data) {
  const amount = Math.round(Number(data.amount) * 100) / 100;
  const tx = db.insert(
    'transactions',
    {
      type: data.type,
      name: (data.name || '').trim(),
      amount,
      date: data.date || todayISO(),
      categoryId: data.categoryId || null,
      accountId: data.accountId,
      toAccountId: data.type === 'transferencia' ? data.toAccountId : null,
      description: (data.description || '').trim(),
      investmentId: null,
    },
    userId
  );

  if (data.type === 'investimento') {
    let inv = data.investmentId
      ? db.findBy('investments', (i) => i.id === data.investmentId && i.userId === userId)
      : null;
    if (!inv) {
      inv = db.insert(
        'investments',
        {
          name: (data.investment?.name || data.name || 'Investimento').trim(),
          type: data.investment?.type || 'CDB',
          institution: (data.investment?.institution || '').trim(),
          note: (data.investment?.note || '').trim(),
          startedAt: tx.date,
          invested: 0,
          current: 0,
          history: [],
        },
        userId
      );
    }
    db.update('investments', inv.id, {
      invested: Math.round((inv.invested + amount) * 100) / 100,
      current: Math.round((inv.current + amount) * 100) / 100,
      history: [...inv.history, { date: tx.date, value: Math.round((inv.current + amount) * 100) / 100 }],
    });
    db.update('transactions', tx.id, { investmentId: inv.id });
  }
  return tx;
}

export function deleteTransaction(userId, id) {
  const tx = db.findBy('transactions', (t) => t.id === id && t.userId === userId);
  if (!tx) return;
  if (tx.type === 'investimento' && tx.investmentId) {
    const inv = db.findBy('investments', (i) => i.id === tx.investmentId);
    if (inv) {
      db.update('investments', inv.id, {
        invested: Math.max(0, Math.round((inv.invested - tx.amount) * 100) / 100),
        current: Math.max(0, Math.round((inv.current - tx.amount) * 100) / 100),
      });
    }
  }
  db.remove('transactions', id);
}

// ---------- Investimentos ----------

export function addInvestment(userId, data) {
  const startedAt = data.startedAt || todayISO();
  const value = Math.round(Number(data.initialAmount || 0) * 100) / 100;
  return db.insert(
    'investments',
    {
      name: data.name.trim(),
      type: data.type || 'CDB',
      institution: (data.institution || '').trim(),
      note: (data.note || '').trim(),
      startedAt,
      invested: value,
      current: value,
      history: value > 0 ? [{ date: startedAt, value }] : [],
    },
    userId
  );
}

export function updateInvestmentValue(userId, id, newValue) {
  const inv = db.findBy('investments', (i) => i.id === id && i.userId === userId);
  if (!inv) return null;
  const value = Math.round(Number(newValue) * 100) / 100;
  return db.update('investments', id, {
    current: value,
    history: [...inv.history, { date: todayISO(), value }].slice(-80),
  });
}

export function deleteInvestment(userId, id) {
  db.remove('investments', id);
}

// ---------- Notificações ----------

export function pushNotification(userId, { type = 'info', title, message = '' }) {
  return db.insert('notifications', { type, title, message, read: false }, userId);
}

export function markNotificationsRead(userId) {
  db.select('notifications', userId).forEach((n) => {
    if (!n.read) db.update('notifications', n.id, { read: true });
  });
}

// ---------- Preferências ----------

export function getPref(userId, key, fallback = null) {
  const scope = userId ?? 'global';
  // getSetting devolve null quando a chave não existe; null nunca é um valor armazenado.
  const v = db.getSetting(`${scope}:${key}`);
  return v === null ? fallback : v;
}

export function setPref(userId, key, value) {
  const scope = userId ?? 'global';
  db.setSetting(`${scope}:${key}`, value);
}
