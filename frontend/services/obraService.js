import { apiFetch } from "../src/utils/api.js";

export async function listObra(token) {
  const res = await apiFetch("/obra/list", { method: "GET" }, token);
  return res.data;
}

export async function getObraById(id, token) {
  const res = await apiFetch(`/obra/get/${id}`, { method: "GET" }, token);
  return res.data;
}

export async function createObra(dadosObra, token) {
  const res = await apiFetch(
    "/obra/create",
    {
      method: "POST",
      body: JSON.stringify(dadosObra),
    },
    token
  );
  return res.data;
}

export async function updateObra(id, dadosObra, token) {
  const res = await apiFetch(
    `/obra/update/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(dadosObra),
    },
    token
  );
  return res.data;
}

export async function deleteObra(id, token) {
  const res = await apiFetch(
    `/obra/delete/${id}`,
    {
      method: "DELETE",
    },
    token
  );
  return res.data;
}

export const obraService = {
  listar: listObra,
  buscarPorId: getObraById,
  getObraById,
  criar: createObra,
  atualizar: updateObra,
  deletar: deleteObra,
};

export default obraService;