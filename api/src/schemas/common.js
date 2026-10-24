import z from "zod";
import { onlyDigits } from "../utils/cpf.js";

export const idSchema = z.coerce.number().int().positive();
export const texto = (max, min = 1) =>
  z.string().trim().min(min, `deve ter ao menos ${min} caractere(s)`).max(max, `deve ter no máximo ${max} caracteres`);
export const textoOpcional = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v === undefined ? undefined : v || null));
export const digitos = z.string().transform(onlyDigits);

// Copia um campo legado para o nome atual (ex.: "hash" -> "senha").
export const withAlias = (schema, aliases) =>
  z.preprocess((input) => {
    if (!input || typeof input !== "object") return input;
    const copy = { ...input };
    for (const [legado, atual] of Object.entries(aliases)) {
      if (copy[atual] === undefined && copy[legado] !== undefined) copy[atual] = copy[legado];
      delete copy[legado];
    }
    return copy;
  }, schema);
