import { prisma } from "../lib/prisma.js";
import { conflict, notFound } from "../lib/httpError.js";
import { normalizarCodigo } from "../lib/cdd.js";

const select = { id: true, descricao: true };
const comContagem = { ...select, _count: { select: { obras: true } } };

const formatar = ({ _count, ...cdd }) => ({ ...cdd, obras: _count.obras });

export async function listar() {
  const cdds = await prisma.cdd.findMany({ select: comContagem, orderBy: { id: "asc" } });
  return cdds.map(formatar);
}

export async function buscarPorId(id) {
  const cdd = await prisma.cdd.findUnique({ where: { id: normalizarCodigo(id) }, select: comContagem });
  if (!cdd) throw notFound("CDD não encontrado.");
  return formatar(cdd);
}

export async function criar(dados) {
  const existente = await prisma.cdd.findUnique({ where: { id: dados.id }, select });
  if (existente) throw conflict(`O CDD ${existente.id} já está cadastrado como “${existente.descricao}”.`);
  return prisma.cdd.create({ data: dados, select });
}

export async function atualizar(id, dados) {
  await buscarPorId(id);
  return prisma.cdd.update({ where: { id: normalizarCodigo(id) }, data: dados, select });
}

export async function remover(id) {
  const cdd = await buscarPorId(id);
  if (cdd.obras > 0) {
    throw conflict(`O CDD ${cdd.id} está em uso por ${cdd.obras} ${cdd.obras === 1 ? "obra" : "obras"}. Troque a classificação delas antes de excluir.`);
  }
  return prisma.cdd.delete({ where: { id: cdd.id }, select });
}
