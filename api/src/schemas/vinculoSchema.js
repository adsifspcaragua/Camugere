import z from "zod";
import { idSchema } from "./common.js";

export const bibliotecarioSchema = z.object({ id_usuario: idSchema });
export const obraAutorSchema = z.object({ id_obra: idSchema, id_autor: idSchema });
