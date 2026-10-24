import { prisma } from "../lib/prisma.js";
import { conflict, notFound } from "../lib/httpError.js";
import { exemplarSelect } from "./selects.js";
import { gerarInventarios } from "./inventario.js";

export function listar({ disponivel } = {}) {
  return prisma.exemplar.findMany({
    where: disponivel === undefined ? undefined : { disponivel },
    select: exemplarSelect,
    orderBy: { numeroInventario: "asc" },
  });
}

export async function buscarPorId(id) {
  const exemplar = await prisma.exemplar.findUnique({ where: { id }, select: exemplarSelect });
  if (!exemplar) throw notFound("Exemplar não encontrado.");
  return exemplar;
}

export async function criarParaObra(tx, idObra, quantidade) {
  if (quantidade <= 0) return;
  const existentes = await tx.exemplar.findMany({ where: { id_obra: idObra }, select: { numeroInventario: true } });
  const numeros = gerarInventarios(idObra, quantidade, existentes.map((e) => e.numeroInventario));
  await tx.exemplar.createMany({ data: numeros.map((numeroInventario) => ({ id_obra: idObra, numeroInventario })) });
}

export async function criar({ id_obra, numeroInventario, disponivel }) {
  const obra = await prisma.obra.findUnique({ where: { id: id_obra }, select: { id: true } });
  if (!obra) throw notFound("Obra não encontrada.");

  if (numeroInventario) {
    return prisma.exemplar.create({ data: { id_obra, numeroInventario, disponivel }, select: exemplarSelect });
  }

  return prisma.$transaction(async (tx) => {
    await criarParaObra(tx, id_obra, 1);
    return tx.exemplar.findFirst({ where: { id_obra }, orderBy: { id: "desc" }, select: exemplarSelect });
  });
}

export const atualizar = (id, dados) => prisma.exemplar.update({ where: { id }, data: dados, select: exemplarSelect });

export async function remover(id) {
  const exemplar = await buscarPorId(id);
  if (!exemplar.disponivel) throw conflict("Não é possível excluir um exemplar emprestado.");
  return prisma.exemplar.delete({ where: { id }, select: exemplarSelect });
}
