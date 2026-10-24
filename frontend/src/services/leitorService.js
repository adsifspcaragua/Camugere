import { api } from "../lib/api.js";

export const listLeitores = async () => (await api.get("/leitor/list")).data;
export const createLeitor = async (leitor) => (await api.post("/leitor/create", leitor)).data;
export const updateLeitor = async (id, leitor) => (await api.put(`/leitor/update/${id}`, leitor)).data;
export const deleteLeitor = (id) => api.delete(`/leitor/delete/${id}`);
export const listEmprestimosDoLeitor = async (id) => (await api.get(`/leitor/${id}/emprestimos`)).data;
export const listSuspensoes = async (id) => (await api.get(`/leitor/${id}/suspensoes`)).data;
export const suspenderLeitor = async (id, dados) => (await api.post(`/leitor/${id}/suspender`, dados)).data;
export const encerrarSuspensao = async (idSuspensao) => (await api.patch(`/leitor/suspensao/${idSuspensao}/encerrar`)).data;
