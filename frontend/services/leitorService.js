const API_BASE_URL = import.meta.env.VITE_API_URL
import { apiFetch } from "../src/utils/api.js"

function getHeaders() {
  const token = localStorage.getItem("biblioteca-auth-token")
  return { "Content-Type": "application/json", jwt_token: token }
}

export async function getLeitorById(id) {
  const headers = getHeaders()

  const response = await fetch(`${API_BASE_URL}/leitor/get/${id}`, { headers })
  const data = await response.json()

  if (!response.ok) {
    const errorJson = await response.json().catch(() => null)
    const message = errorJson?.message || "Falha ao autenticar"
    console.log(message)
  }

  return data
}

export async function listLeitores() {
  const headers = getHeaders()
  const response = await fetch(`${API_BASE_URL}/leitor/list`, { headers })

  if (!response.ok) {
    const errorJson = await response.json().catch(() => null)
    console.log(errorJson)
    return
  }

  const data = await response.json()
  return data
}

export async function listLeitorEmprestimos(id, token) {
  return apiFetch(`/emprestimo/leitor/${id}`, {}, token)
}

export async function listLeitorEmprestimosAtivos(id, token) {
  return apiFetch(`/emprestimo/leitor/${id}/ativos`, {}, token)
}

export async function listSuspensoesLeitor(id, token) {
  return apiFetch(`/leitor/${id}/suspensoes`, {}, token)
}

export async function createSuspensaoLeitor(id, dados, token) {
  return apiFetch(
    `/leitor/${id}/suspensoes`,
    {
      method: "POST",
      body: JSON.stringify(dados),
    },
    token,
  )
}

export async function reativarSuspensaoLeitor(id, suspensaoId, token) {
  return apiFetch(
    `/leitor/${id}/suspensoes/${suspensaoId}/reativar`,
    {
      method: "PATCH",
    },
    token,
  )
}
