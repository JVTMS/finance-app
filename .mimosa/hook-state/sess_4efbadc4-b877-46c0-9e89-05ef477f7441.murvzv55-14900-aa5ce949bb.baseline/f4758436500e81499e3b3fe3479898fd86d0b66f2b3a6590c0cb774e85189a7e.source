// "Banco de dados" local baseado em localStorage, com tabelas e escopo por usuário.
// Estrutura: users, sessions, accounts, transactions, investments, categories,
// settings (chave `${userId}:${key}`) e notifications.

const DB_KEY = 'finance.db.v1';

const EMPTY = {
  nextId: 1,
  users: [],
  sessions: [],
  accounts: [],
  transactions: [],
  investments: [],
  categories: [],
  settings: {},
  notifications: [],
};

let cache = null;

function load() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(DB_KEY);
    cache = raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY };
  } catch {
    cache = { ...EMPTY };
  }
  return cache;
}

function persist() {
  localStorage.setItem(DB_KEY, JSON.stringify(load()));
  listeners.forEach((fn) => fn());
}

const USER_SCOPED = new Set(['accounts', 'transactions', 'investments', 'categories', 'notifications']);

export function select(table, userId = null) {
  const data = load();
  const rows = data[table] || [];
  if (userId === null || !USER_SCOPED.has(table)) return rows;
  return rows.filter((r) => r.userId === userId);
}

export function insert(table, row, userId = null) {
  const data = load();
  const record = {
    id: data.nextId++,
    ...(userId !== null && USER_SCOPED.has(table) ? { userId } : {}),
    createdAt: Date.now(),
    ...row,
  };
  data[table].push(record);
  persist();
  return record;
}

export function update(table, id, patch) {
  const data = load();
  const row = data[table].find((r) => r.id === id);
  if (!row) return null;
  Object.assign(row, patch, { id: row.id });
  persist();
  return row;
}

export function remove(table, id) {
  const data = load();
  data[table] = data[table].filter((r) => r.id !== id);
  persist();
}

export function findBy(table, predicate) {
  return load()[table].find(predicate) || null;
}

export function getSetting(key, fallback = null) {
  const data = load();
  const v = data.settings[key];
  return v === undefined ? fallback : v;
}

export function setSetting(key, value) {
  const data = load();
  data.settings[key] = value;
  persist();
}

export function removeSetting(key) {
  const data = load();
  delete data.settings[key];
  persist();
}

export function wipeUser(userId) {
  const data = load();
  for (const table of USER_SCOPED) {
    data[table] = data[table].filter((r) => r.userId !== userId);
  }
  data.settings = Object.fromEntries(
    Object.entries(data.settings).filter(([k]) => !k.startsWith(`${userId}:`))
  );
  persist();
}

export function exportAll() {
  return JSON.stringify(load(), null, 2);
}

export function resetAll() {
  cache = { ...EMPTY, nextId: 1 };
  persist();
}

/** Recria o banco a partir de um payload (usado pelo seed). */
export function replaceAll(payload) {
  cache = { ...EMPTY, ...payload };
  persist();
}

/** Assina mudanças (janelas múltiplas sincronizam via evento 'storage'). */
const listeners = new Set();
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
window.addEventListener('storage', (e) => {
  if (e.key === DB_KEY) {
    cache = null;
    listeners.forEach((fn) => fn());
  }
});
