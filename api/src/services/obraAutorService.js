import { prisma } from "../lib/prisma.js";

const select = { id_obra: true, id_autor: true };

export const listar = () => prisma.obraAutor.findMany({ select });
export const listarPorObra = (id_obra) => prisma.obraAutor.findMany({ where: { id_obra }, select });
export const listarPorAutor = (id_autor) => prisma.obraAutor.findMany({ where: { id_autor }, select });
export const criar = (dados) => prisma.obraAutor.create({ data: dados, select });
export const remover = (id_obra, id_autor) =>
  prisma.obraAutor.delete({ where: { id_obra_id_autor: { id_obra, id_autor } }, select });
