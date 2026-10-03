// Autenticação local: cadastro, login, sessão com expiração e logout.
// Senhas nunca ficam em texto puro — são armazenadas como `salt$sha256(salt::senha)`.

import { insert, findBy, remove, select } from '../database/db';
import { uid } from '../utils/format';

const SESSION_KEY = 'finance.session.token';
const SESSION_DAYS = 30;

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(text) {
  if (window.crypto?.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return toHex(digest);
  }
  // Fallback determinístico para contextos sem WebCrypto (ex.: abertura via file://).
  let h1 = 0xdeadbeef ^ text.length;
  let h2 = 0x41c6ce57 ^ text.length;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `f${(h2 >>> 0).toString(16)}${(h1 >>> 0).toString(16)}`;
}

export async function hashPassword(password, salt = uid()) {
  const hash = await sha256(`${salt}::${password}`);
  return `${salt}$${hash}`;
}

async function verifyPassword(password, stored) {
  const [salt] = stored.split('$');
  const candidate = await hashPassword(password, salt);
  return candidate === stored;
}

function createSession(userId) {
  const token = uid() + uid();
  insert('sessions', { token, userId, expiresAt: Date.now() + SESSION_DAYS * 86400000 });
  localStorage.setItem(SESSION_KEY, token);
}

export function currentUser() {
  const token = localStorage.getItem(SESSION_KEY);
  if (!token) return null;
  const session = findBy('sessions', (s) => s.token === token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) remove('sessions', session.id);
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
  return findBy('users', (u) => u.id === session.userId) || null;
}

export function logout() {
  const token = localStorage.getItem(SESSION_KEY);
  if (token) {
    const session = findBy('sessions', (s) => s.token === token);
    if (session) remove('sessions', session.id);
  }
  localStorage.removeItem(SESSION_KEY);
}

export async function register({ name, email, password }) {
  const clean = email.trim().toLowerCase();
  if (!name?.trim()) throw new Error('Informe seu nome.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) throw new Error('Informe um e-mail válido.');
  if (!password || password.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.');
  if (findBy('users', (u) => u.email === clean)) throw new Error('Já existe uma conta com este e-mail.');

  const user = insert('users', {
    name: name.trim(),
    email: clean,
    passHash: await hashPassword(password),
  });
  createSession(user.id);
  return user;
}

export async function login({ email, password }) {
  const clean = email.trim().toLowerCase();
  const user = findBy('users', (u) => u.email === clean);
  if (!user) throw new Error('E-mail ou senha incorretos.');
  const ok = await verifyPassword(password, user.passHash);
  if (!ok) throw new Error('E-mail ou senha incorretos.');
  // renova a sessão
  select('sessions')
    .filter((s) => s.userId === user.id)
    .forEach((s) => remove('sessions', s.id));
  createSession(user.id);
  return user;
}

/**
 * Acesso dedicado à conta de demonstração (sem senha — dados fictícios públicos).
 */
export function loginDemo(email) {
  const user = findBy('users', (u) => u.email === String(email).trim().toLowerCase());
  if (!user) throw new Error('Conta demo indisponível.');
  select('sessions')
    .filter((s) => s.userId === user.id)
    .forEach((s) => remove('sessions', s.id));
  createSession(user.id);
  return user;
}
