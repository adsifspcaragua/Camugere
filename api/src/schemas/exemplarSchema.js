import z from "zod";
import { idSchema, texto } from "./common.js";

export const createExemplarSchema = z.object({
  id_obra: idSchema,
  numeroInventario: texto(20).optional(),
  disponivel: z.boolean().default(true),
});
export const updateExemplarSchema = z.object({
  numeroInventario: texto(20).optional(),
  disponivel: z.boolean().optional(),
});
