const API_BASE_URL = import.meta.env.VITE_API_URL;

export function getAuthHeaders(token) {
  const actualToken = token || localStorage.getItem("biblioteca-auth-token");
  
  return actualToken 
    ? { "Content-Type": "application/json", "jwt_token": actualToken } 
    : { "Content-Type": "application/json" };
}

export async function apiFetch(path, options = {}, token) {
  const headers = { ...getAuthHeaders(token), ...(options.headers || {}) };
  
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    
    // AQUI ESTÁ A MAGIA: Vamos buscar o errorBody.error que o seu colega programou!
    const message = errorBody?.error || errorBody?.message || response.statusText || "Erro na requisição";
    throw new Error(message);
  }
  
  return response.json();
}