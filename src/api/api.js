// Camada de acesso a dados — agora sobre a API REST .NET (mesmas assinaturas
// públicas da versão localStorage, então contexts e componentes não mudam).

import { http, getToken, setToken, clearToken } from '../services/http';
import { todayISO } from '../utils/format';

// ---------- Sessão ----------

export async function fetchCurrentUser() {
  if (!getToken()) return null;
  try {
    const me = await http.get('/auth/me');
    return { id: me.userId, name: me.name, email: me.email };
  } catch (e) {
    if (e.status === 401) return null;
    throw e;
  }
}

export async function register({ name, email, password }) {
  const res = await http.post('/auth/register', { name, email, password });
  setToken(res.token);
  return { id: res.userId, name: res.name, email: res.email };
}

export async function login({ email, password }) {
  const res = await http.post('/auth/login', { email, password });
  setToken(res.token);
  return { id: res.userId, name: res.name, email: res.email };
}

export async function loginDemo() {
  const res = await http.post('/auth/demo');
  setToken(res.token);
  return { id: res.userId, name: res.name, email: res.email };
}

export function logout() {
  clearToken();
}

/** Apaga todos os dados do usuário autenticado no servidor. */
export async function deleteMyData() {
  await http.del('/auth/data');
}

// ---------- Carga inicial ----------

export async function loadUserData(_userId) {
  return http.get('/overview');
}

/** Os dados padrão (conta + categorias) são criados pelo servidor no registro. */
export function createDefaultUserData(_userId) {
  /* no-op — mantido por compatibilidade de assinatura */
}

// ---------- Contas ----------

export async function addAccount(_userId, data) {
  return http.post('/accounts', {
    name: data.name,
    institution: data.institution || '',
    type: data.type || 'conta',
    color: data.color || '#7c8ba1',
    initialBalance: Number(data.initialBalance) || 0,
  });
}

export async function updateAccount(_userId, id, patch) {
  return http.put(`/accounts/${id}`, {
    name: patch.name,
    institution: patch.institution || '',
    type: patch.type || 'conta',
    color: patch.color || '#7c8ba1',
    initialBalance: Number(patch.initialBalance) || 0,
  });
}

export async function deleteAccount(_userId, id) {
  try {
    await http.del(`/accounts/${id}`);
    return { ok: true };
  } catch (e) {
    if (e.status === 409) return { error: e.message };
    throw e;
  }
}

// ---------- Transações ----------

export async function addTransaction(_userId, data) {
  const tx = await http.post('/transactions', {
    type: data.type,
    name: data.name,
    amount: data.amount,
    date: data.date || todayISO(),
    categoryId: data.categoryId ?? null,
    accountId: data.accountId,
    toAccountId: data.toAccountId ?? null,
    description: data.description || '',
    investmentId: data.investmentId ?? null,
    investment: data.investment
      ? {
          name: data.investment.name || '',
          type: data.investment.type || 'CDB',
          institution: data.investment.institution || '',
          note: data.investment.note || '',
        }
      : null,
  });
  return tx;
}

export async function deleteTransaction(_userId, id) {
  await http.del(`/transactions/${id}`);
}

// ---------- Investimentos ----------

export async function addInvestment(_userId, data) {
  return http.post('/investments', {
    name: data.name,
    type: data.type || 'CDB',
    institution: data.institution || '',
    note: data.note || '',
    startedAt: data.startedAt || todayISO(),
    initialAmount: Number(data.initialAmount) || 0,
  });
}

export async function updateInvestmentValue(_userId, id, newValue) {
  return http.patch(`/investments/${id}/value`, { value: Number(newValue) });
}

export async function deleteInvestment(_userId, id) {
  await http.del(`/investments/${id}`);
}

// ---------- Notificações ----------

export async function pushNotification(_userId, { type = 'info', title, message = '' }) {
  try {
    await http.post('/notifications', { type, title, message });
  } catch {
    /* histórico é best-effort — o toast já foi exibido */
  }
}

export async function markNotificationsRead(_userId) {
  await http.post('/notifications/mark-read');
}

// ---------- Preferências (tema, modos, som) ----------

export async function getAllPreferences() {
  if (!getToken()) return {};
  try {
    return (await http.get('/preferences')) || {};
  } catch {
    return {};
  }
}

export async function setPreference(key, value) {
  await http.put(`/preferences/${encodeURIComponent(key)}`, value);
}
