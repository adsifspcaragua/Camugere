import { apiFetch } from "../src/utils/api.js";

export const emprestimoService = {
  criar: async (dados, token) => {
    return await apiFetch("/emprestimo/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dados),
    }, token);
  },

  listar: async (token) => {
    return await apiFetch("/emprestimo/list", {}, token);
  },

  atualizar: async (id, dados, token) => {
    return await apiFetch(`/emprestimo/update/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dados),
    }, token);
  },
};