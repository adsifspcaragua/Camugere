import { api } from "../lib/api.js";

export const login = async (email, senha) => (await api.post("/login", { email, senha }, { auth: false })).data;
export const fetchProfile = async () => (await api.get("/me")).data;
