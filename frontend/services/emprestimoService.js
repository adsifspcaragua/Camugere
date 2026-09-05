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
        console.error('Erro ao criar empréstimo:', errorJson);
        return { ok: false, message };
    }

    const data = await response.json();
    return { ok: true, data };
}

export async function getEmprestimoByIdExemplar(id) {
    const response = await fetch(`${API_BASE_URL}getbyexemplar/${id}`, {headers});

    if (!response.ok) {
        const errorJson = await response.json().catch(() => null);
        console.error('Erro ao buscar empréstimo:', errorJson);
        return
    }

    const data = await response.json()
    return data
}

export async function listEmprestimos() {
    const response = await fetch(`${API_BASE_URL}list`, {headers});

    if (!response.ok) {
        const errorJson = await response.json().catch(() => null);
        console.error('Erro ao buscar empréstimo:', errorJson);
        return
    }

    const data = await response.json()
    return data
}