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

// Mensagem em linguagem simples quando a API não explica o erro (ou responde algo que não é JSON).
const STATUS_MESSAGES = {
  400: "Alguns dados não foram aceitos. Confira os campos e tente de novo.",
  401: "Sua sessão expirou. Entre novamente.",
  403: "Você não tem permissão para fazer isso.",
  404: "Não encontramos o que você procurou. Atualize a página e tente de novo.",
  409: "Essa ação conflita com dados já existentes. Atualize a página e confira.",
  413: "O arquivo é grande demais. Envie um menor.",
  415: "Esse tipo de arquivo não é aceito.",
  422: "Alguns dados não foram aceitos. Confira os campos e tente de novo.",
  429: "Muitas tentativas seguidas. Aguarde um instante e tente de novo.",
};
export const friendlyStatusMessage = (status) =>
  STATUS_MESSAGES[status] ?? (status >= 500 ? "O servidor teve um problema. Tente de novo em instantes; se persistir, avise o responsável pelo sistema." : `Não foi possível concluir (erro ${status}). Tente de novo.`);

const TIMEOUT_MS = 30000;

/** Faz a requisição, injeta o token e devolve o JSON — ou lança ApiError com a mensagem da API. */
export async function request(path, { method = "GET", body, headers = {}, auth = true } = {}) {
  const isForm = body instanceof FormData;
  const token = auth ? getToken() : null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), isForm ? TIMEOUT_MS * 4 : TIMEOUT_MS);
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      signal: controller.signal,
      method,
      headers: {
        ...(!isForm && body !== undefined && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers,
      },
      body: isForm ? body : body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error?.name === "AbortError") throw new ApiError(0, "O servidor demorou demais para responder. Tente de novo.");
    setOnline(false);
    throw new ApiError(0, "Sem conexão com o servidor. Verifique sua internet e tente de novo.");
  } finally {
    clearTimeout(timer);
  }
  setOnline(true);

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && auth) onUnauthorized();
    // Em 5xx a mensagem da API é genérica; em 4xx ela costuma dizer exatamente o que corrigir.
    throw new ApiError(response.status, payload?.message || friendlyStatusMessage(response.status), payload?.details);
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
