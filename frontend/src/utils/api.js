const API_BASE_URL = import.meta.env.VITE_API_URL;

export function getAuthHeaders(token) {
  return token ? { "Content-Type": "application/json", "jwt_token": token } : { "Content-Type": "application/json" };
}

export async function apiFetch(path, options = {}, token) {
  const headers = { ...getAuthHeaders(token), ...(options.headers || {}) };
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message = errorBody?.message || response.statusText || "Erro na requisição";
    throw new Error(message);
  }
  return response.json();
}
