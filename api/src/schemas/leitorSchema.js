import z from "zod";
import { digitos, texto, textoOpcional, withAlias } from "./common.js";
import { isValidCpf } from "../utils/cpf.js";

const base = z.object({
  nome: texto(80, 2),
  email: z.string().trim().toLowerCase().email("e-mail inválido").max(100),
  cpf: digitos.refine(isValidCpf, "CPF inválido"),
  telefone: digitos
    .refine((v) => v === "" || (v.length >= 10 && v.length <= 11), "telefone deve ter 10 ou 11 dígitos")
    .nullish()
    .transform((v) => (v === undefined ? undefined : v || null)),
  cep: digitos
    .refine((v) => v === "" || v.length === 8, "CEP deve ter 8 dígitos")
    .nullish()
    .transform((v) => (v === undefined ? undefined : v || null)),
  logradouro: textoOpcional(150),
  numero: textoOpcional(20),
  complemento: textoOpcional(80),
  bairro: textoOpcional(80),
  cidade: textoOpcional(80),
  uf: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => v === "" || /^[A-Z]{2}$/.test(v), "UF deve ter 2 letras")
    .nullish()
    .transform((v) => (v === undefined ? undefined : v || null)),
});

export const createLeitorSchema = withAlias(base, { contato: "email" });
export const updateLeitorSchema = withAlias(base.partial(), { contato: "email" });

export const suspensaoSchema = z.object({
  motivo: texto(500, 3),
  // null/ausente = por tempo indeterminado
  dias: z.coerce.number().int().min(1).max(365).nullish(),
});
