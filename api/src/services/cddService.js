import { prisma } from "../lib/prisma.js";
import { notFound } from "../lib/httpError.js";

const select = { id: true, descricao: true };

export const listar = () => prisma.cdd.findMany({ select, orderBy: { id: "asc" } });

export async function buscarPorId(id) {
  const cdd = await prisma.cdd.findUnique({ where: { id }, select });
  if (!cdd) throw notFound("CDD não encontrado.");
  return cdd;
}

export const criar = (dados) => prisma.cdd.create({ data: dados, select });
export const atualizar = (id, dados) => prisma.cdd.update({ where: { id }, data: dados, select });
export const remover = (id) => prisma.cdd.delete({ where: { id }, select });
