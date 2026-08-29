const token = localStorage.getItem("biblioteca-auth-token")
const API_BASE_URL = import.meta.env.VITE_API_URL + '/emprestimo/';

const headers = token ? { "Content-Type": "application/json", "jwt_token": token } : { "Content-Type": "application/json" };

export async function createEmprestimo(emprestimo) {
    const response = await fetch(`${API_BASE_URL}create`, {
        method: 'POST',
        headers,
        body: JSON.stringify(emprestimo)
    });

    if (!response.ok) {
        const errorJson = await response.json().catch(() => null);
        const message = errorJson?.message || "Falha ao registrar empréstimo";
        console.error('Erro ao criar empréstimo:', message);
        return { ok: false, message };
    }

    const data = await response.json();
    return { ok: true, data };
} 