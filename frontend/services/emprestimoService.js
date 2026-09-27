const API_BASE_URL = import.meta.env.VITE_API_URL + '/emprestimo/';

function getHeaders() {
    const token = localStorage.getItem("biblioteca-auth-token")
    return { "Content-Type": "application/json", "jwt_token": token } 
}

export async function createEmprestimo(emprestimo) {
    const headers = getHeaders()
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
    const headers = getHeaders()
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
    const headers = getHeaders()
    const response = await fetch(`${API_BASE_URL}list`, {headers});

    if (!response.ok) {
        const errorJson = await response.json().catch(() => null);
        console.error('Erro ao buscar empréstimo:', errorJson);
        return
    }

    const data = await response.json()
    return data
}

export async function listEmprestimosAtivos() {
    const headers = getHeaders()
    const response = await fetch(`${API_BASE_URL}list/ativos`, {headers});

    if (!response.ok) {
        const errorJson = await response.json().catch(() => null);
        console.error('Erro ao buscar empréstimo:', errorJson);
        return
    }

    const data = await response.json()
    return data
}

export async function changeStatusDevolucaoEmprestimo(id, status) {
    const headers = getHeaders()
    const body = { statusDevolucao: status };
    const response = await fetch(`${API_BASE_URL}change-status-devolucao/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorJson = await response.json().catch(() => null);
        console.error('Erro ao atualizar status de devolução do empréstimo:', errorJson);
        return { ok: false, message: errorJson?.message || 'Erro desconhecido' };
    }

    const data = await response.json();
    return data
}