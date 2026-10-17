import { apiFetch } from "../src/utils/api.js"

export async function registerBibliotecario(dados, token) {
  return apiFetch(
    "/bibliotecario/register",
    {
      method: "POST",
      body: JSON.stringify(dados),
    },
    token,
  )
}
