import { api } from "../lib/api.js";

export const login = async (email, senha) => (await api.post("/login", { email, senha }, { auth: false })).data;
export const fetchProfile = async () => (await api.get("/me")).data;

// Primeiro acesso: o sistema ainda não tem nenhum bibliotecário.
export const statusPrimeiroAcesso = async () => (await api.get("/primeiro-acesso", { auth: false })).data;
export const configurarPrimeiroAcesso = async (dados) => (await api.post("/primeiro-acesso", dados, { auth: false })).data;

// Senha
export const alterarSenha = async (senhaAtual, novaSenha) => (await api.patch("/me/senha", { senhaAtual, novaSenha })).data;
export const esqueciSenha = async (email) => (await api.post("/senha/esqueci", { email }, { auth: false })).data;
export const validarLinkRedefinicao = async (token) => (await api.post("/senha/validar-link", { token }, { auth: false })).data;
export const redefinirSenha = async (token, novaSenha) => (await api.post("/senha/redefinir", { token, novaSenha }, { auth: false })).data;
