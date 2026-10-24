import { api } from "../lib/api.js";

export const listObras = async () => (await api.get("/obra/list")).data;
export const createObra = (obra) => api.post("/obra/create", obra);
export const updateObra = (id, obra) => api.put(`/obra/update/${id}`, obra);
export const deleteObra = (id) => api.delete(`/obra/delete/${id}`);
