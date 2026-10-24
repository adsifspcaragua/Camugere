import { prisma } from "../lib/prisma.js";
import { conflict, notFound } from "../lib/httpError.js";
import { exemplarSelect } from "./selects.js";
import { formatarNomeAutor, parseAutores } from "./autorService.js";
import { criarParaObra } from "./exemplarService.js";

const include = {
  cdd: true,
  autores: { include: { autor: true } },
  exemplares: { select: exemplarSelect, orderBy: { numeroInventario: "asc" } },
};

// Achata os relacionamentos para o formato consumido pelo frontend.
export function formatarObra(obra) {
  if (!obra) return null;
  const { autores, cdd, ...resto } = obra;
  return {
    ...resto,
    autor: autores.map(({ autor }) => formatarNomeAutor(autor)).join(", "),
    cdd: cdd?.id ?? null,
    cddDescricao: cdd?.descricao ?? null,
  };
}

const vincularCdd = (codigo, descricao) =>
  codigo && {
    cdd: {
      connectOrCreate: {
        where: { id: codigo },
        create: { id: codigo, descricao: descricao || "Geral" },
      },
    },
  };

const criarVinculosAutores = (texto) =>
  parseAutores(texto).map(({ nome, sobrenome }) => ({
    autor: {
      connectOrCreate: {
        where: { nome_sobrenome: { nome, sobrenome } },
        create: { nome, sobrenome },
      },
    },
  }));

export async function listar() {
  const obras = await prisma.obra.findMany({ where: { ativa: true }, include, orderBy: { titulo: "asc" } });
  return obras.map(formatarObra);
}

export async function buscarPorId(id) {
  const obra = await prisma.obra.findUnique({ where: { id }, include });
  if (!obra) throw notFound("Obra não encontrada.");
  return formatarObra(obra);
}

export async function criar({ autor, cdd, cddDescricao, numExemplares, ...dados }) {
  const obra = await prisma.$transaction(async (tx) => {
    const criada = await tx.obra.create({
      data: {
        ...dados,
        ...vincularCdd(cdd, cddDescricao),
        autores: { create: criarVinculosAutores(autor) },
      },
    });
    await criarParaObra(tx, criada.id, numExemplares);
    return tx.obra.findUnique({ where: { id: criada.id }, include });
  });
  return formatarObra(obra);
}

export async function atualizar(id, { autor, cdd, cddDescricao, ...dados }) {
  const obra = await prisma.obra.update({
    where: { id },
    data: {
      ...dados,
      ...vincularCdd(cdd, cddDescricao),
      ...(cdd === null && { cdd: { disconnect: true } }),
      ...(autor !== undefined && { autores: { deleteMany: {}, create: criarVinculosAutores(autor) } }),
    },
    include,
  });
  return formatarObra(obra);
}

export async function remover(id) {
  const emprestados = await prisma.exemplar.count({ where: { id_obra: id, disponivel: false } });
  if (emprestados > 0) throw conflict("Não é possível excluir uma obra com exemplares emprestados.");
  return prisma.obra.delete({ where: { id }, select: { id: true, titulo: true } });
}
