import { api } from "../lib/api.js";

export const listEmprestimos = async () => (await api.get("/emprestimo/list")).data;
export const createEmprestimo = async (dados) => (await api.post("/emprestimo/create", dados)).data;
export const devolverEmprestimo = async (id) => (await api.patch(`/emprestimo/devolver/${id}`)).data;
export const renovarEmprestimo = async (id, dias) => (await api.patch(`/emprestimo/renovar/${id}`, { dias })).data;
export const deleteEmprestimo = (id) => api.delete(`/emprestimo/delete/${id}`);
export const statusLembretes = async () => (await api.get("/emprestimo/lembretes")).data;
export const enviarLembretes = async () => (await api.post("/emprestimo/lembretes/enviar")).data;
export const desfazerDevolucao = async (id) => (await api.patch(`/emprestimo/desfazer-devolucao/${id}`)).data;
export const definirPrazo = async (id, diasLocacao) => (await api.put(`/emprestimo/update/${id}`, { diasLocacao })).data;
