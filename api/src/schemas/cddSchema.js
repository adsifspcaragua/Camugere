import z from "zod";
import { texto } from "./common.js";
import { normalizarCodigo } from "../lib/cdd.js";

export const codigoCdd = z
  .string()
  .transform(normalizarCodigo)
  .pipe(z.string().min(1, "informe o código").max(15, "deve ter no máximo 15 caracteres").regex(/^\d[\dA-Za-z.\-/]*$/, "deve começar com número (ex.: 869.3)"));

export const createCddSchema = z.object({ id: codigoCdd, descricao: texto(150) });
export const updateCddSchema = z.object({ descricao: texto(150) });
