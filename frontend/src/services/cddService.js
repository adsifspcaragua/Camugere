import { api } from "../lib/api.js";

export const listCdds = async () => (await api.get("/cdd/list")).data;
export const createCdd = (cdd) => api.post("/cdd/create", cdd);
export const updateCdd = (id, dados) => api.put(`/cdd/update/${encodeURIComponent(id)}`, dados);
export const deleteCdd = (id) => api.delete(`/cdd/delete/${encodeURIComponent(id)}`);
