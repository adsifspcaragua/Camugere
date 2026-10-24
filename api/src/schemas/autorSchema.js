import z from "zod";
import { texto } from "./common.js";

export const autorSchema = z.object({
  nome: texto(80),
  sobrenome: z.string().trim().max(80).default(""),
});
export const updateAutorSchema = autorSchema.partial();
