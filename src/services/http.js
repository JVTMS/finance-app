// Camada HTTP: base /api, token JWT em localStorage, 401 → sessão expirada.

const TOKEN_KEY = 'finance.token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const token = getToken();
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor FINANCE.', 0);
  }

  if (res.status === 401 && token) {
    // token inválido/expirado: encerra a sessão no app inteiro
    clearToken();
    window.dispatchEvent(new CustomEvent('finance:unauthorized'));
  }

  if (!res.ok) {
    let message = `Erro ${res.status}`;
    try {
      const text = await res.text();
      if (text) {
        try {
          const data = JSON.parse(text);
          message = data.error || data.title || (typeof data === 'string' ? data : message);
        } catch {
          message = text.slice(0, 200);
        }
      }
    } catch {
      /* mantém a mensagem padrão */
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const http = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),
};
