import { api } from "../lib/api.js";

export const listBibliotecarios = async () => (await api.get("/bibliotecario/list")).data;
export const cadastrarBibliotecario = async (dados) => (await api.post("/bibliotecario/cadastrar", dados)).data;
export const removerBibliotecario = (id) => api.delete(`/bibliotecario/delete/${id}`);
export const redefinirSenhaColega = (id, novaSenha) => api.patch(`/bibliotecario/${id}/senha`, { novaSenha });
