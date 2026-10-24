import { api } from "../lib/api.js";

export const createExemplar = async (idObra) => (await api.post("/exemplar/create", { id_obra: idObra })).data;
export const deleteExemplar = (id) => api.delete(`/exemplar/delete/${id}`);
