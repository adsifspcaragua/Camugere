const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");
export const TOKEN_KEY = "camugere:token";

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => (token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY));

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (handler) => (onUnauthorized = handler);

// Estado da conexão com a API, observável pela interface (faixa "sem conexão").
let online = true;
const listeners = new Set();
function setOnline(value) {
  if (online === value) return;
  online = value;
  listeners.forEach((fn) => fn(value));
}
export const isOnline = () => online;
export function subscribeConnection(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Faz a requisição, injeta o token e devolve o JSON — ou lança ApiError com a mensagem da API. */
export async function request(path, { method = "GET", body, headers = {}, auth = true } = {}) {
  const isForm = body instanceof FormData;
  const token = auth ? getToken() : null;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        ...(!isForm && body !== undefined && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers,
      },
      body: isForm ? body : body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    setOnline(false);
    throw new ApiError(0, "Sem conexão com o servidor.");
  }
  setOnline(true);

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && auth) onUnauthorized();
    throw new ApiError(response.status, payload?.message || `Erro ${response.status}`, payload?.details);
  }
  return payload;
}

export const api = {
  get: (path, opts) => request(path, opts),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  put: (path, body, opts) => request(path, { ...opts, method: "PUT", body }),
  patch: (path, body, opts) => request(path, { ...opts, method: "PATCH", body }),
  delete: (path, opts) => request(path, { ...opts, method: "DELETE" }),
};

export const apiUrl = (path) => `${BASE_URL}${path}`;
