import z from "zod";
import { texto, textoOpcional } from "./common.js";

const base = z.object({
  isbn: z
    .string()
    .nullish()
    .transform((v) => (v === undefined ? undefined : v?.replace(/[^0-9Xx]/g, "") || null)),
  titulo: texto(200),
  subtitulo: textoOpcional(200),
  editora: textoOpcional(100),
  localPublicacao: textoOpcional(100),
  anoPublicacao: z.coerce.number().int().min(0).max(9999).nullish(),
  edicao: textoOpcional(20),
  numeroPaginas: z.coerce.number().int().min(0).default(0),
  resumo: textoOpcional(10000),
  capaUrl: textoOpcional(2000),
  ativa: z.boolean().default(true),
  // Relacionamentos resolvidos no service
  autor: z.string().trim().nullish(),
  cdd: textoOpcional(15),
  cddDescricao: textoOpcional(150),
});

export const createObraSchema = base.extend({
  numExemplares: z.coerce.number().int().min(0).max(50).default(1),
});

// No update, campos ausentes não devem receber defaults.
export const updateObraSchema = base
  .extend({ numeroPaginas: z.coerce.number().int().min(0), ativa: z.boolean() })
  .partial();
