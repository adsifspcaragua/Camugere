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

const novaSenha = z.string().min(6, "a senha deve ter ao menos 6 caracteres").max(72, "a senha aceita no máximo 72 caracteres");

export const primeiroAcessoSchema = base;
export const alterarSenhaSchema = z.object({ senhaAtual: z.string().min(1, "informe a senha atual"), novaSenha });
export const novaSenhaSchema = z.object({ novaSenha });
export const esqueciSenhaSchema = z.object({ email });
export const redefinirSenhaSchema = z.object({ token: z.string().min(20, "link inválido").max(200), novaSenha });
export const tokenRedefinicaoSchema = z.object({ token: z.string().max(200) });
