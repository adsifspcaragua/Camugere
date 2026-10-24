import z from "zod";
import { idSchema } from "./common.js";

const dias = z.coerce.number().int().min(1, "mínimo de 1 dia").max(365, "máximo de 365 dias");

export const createEmprestimoSchema = z.object({
  id_leitor: idSchema,
  id_exemplar: idSchema,
  diasLocacao: dias.default(14),
  enviarNotificacao: z.boolean().default(true),
});
export const updateEmprestimoSchema = z.object({ diasLocacao: dias });
export const renovarEmprestimoSchema = z.object({ dias: dias.default(14) });
