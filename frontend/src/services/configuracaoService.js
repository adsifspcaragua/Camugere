import { api } from "../lib/api.js";

export const lerConfigEmail = async () => (await api.get("/configuracao/email")).data;
export const salvarConfigEmail = async (dados) => (await api.put("/configuracao/email", dados)).data;
export const removerConfigEmail = async () => (await api.delete("/configuracao/email")).data;
/** Envia um e-mail de teste para quem está logado; devolve a mensagem de confirmação. */
export const enviarEmailTeste = async () => (await api.post("/configuracao/email/teste")).message;

export const lerConfigBackup = async () => (await api.get("/configuracao/backup")).data;
export const salvarConfigBackup = async (dados) => (await api.put("/configuracao/backup", dados)).data;
/** Faz o backup agora; devolve { message, data } com a situação atualizada. */
export const fazerBackupAgora = async () => api.post("/configuracao/backup/executar");
