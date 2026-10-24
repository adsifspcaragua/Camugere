import z from "zod";
import { texto, withAlias } from "./common.js";

const email = z.string().trim().toLowerCase().email("e-mail inválido").max(100);

const base = z.object({
  nome: texto(80, 2),
  email,
  senha: z.string().min(6, "a senha deve ter ao menos 6 caracteres").max(72),
});

export const createUsuarioSchema = withAlias(base, { hash: "senha" });
export const updateUsuarioSchema = withAlias(base.partial(), { hash: "senha" });
export const loginSchema = withAlias(z.object({ email, senha: z.string().min(1, "informe a senha") }), {
  hash: "senha",
});
