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

async function garantirAutores(tx, texto) {
  const lista = parseAutores(texto);
  const ids = [];
  for (const { nome, sobrenome } of lista) {
    const existente = await tx.autor.findFirst({ where: { nome, sobrenome }, select: { id: true } });
    if (existente) {
      ids.push(existente.id);
    } else {
      const criado = await tx.autor.create({ data: { nome, sobrenome }, select: { id: true } });
      ids.push(criado.id);
    }
  }
  return [...new Set(ids)].map((id_autor) => ({ id_autor }));
}

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
  if (dados.isbn) {
    const existente = await prisma.obra.findFirst({ where: { isbn: dados.isbn }, select: { id: true, titulo: true } });
    if (existente) throw conflict(`Já existe uma obra cadastrada com este ISBN (${existente.titulo}).`);
  }
  const obra = await prisma.$transaction(async (tx) => {
    const vinculosAutores = await garantirAutores(tx, autor);
    const criada = await tx.obra.create({
      data: {
        ...dados,
        ...vincularCdd(cdd, cddDescricao),
        autores: { create: vinculosAutores },
      },
    });
    await criarParaObra(tx, criada.id, numExemplares);
    return tx.obra.findUnique({ where: { id: criada.id }, include });
  });
  return formatarObra(obra);
}

export async function atualizar(id, { autor, cdd, cddDescricao, ...dados }) {
  if (dados.isbn) {
    const existente = await prisma.obra.findFirst({ where: { isbn: dados.isbn, NOT: { id } }, select: { id: true, titulo: true } });
    if (existente) throw conflict(`Este ISBN já pertence à obra “${existente.titulo}”.`);
  }
  const obra = await prisma.$transaction(async (tx) => {
    const vinculosAutores = autor !== undefined ? await garantirAutores(tx, autor) : undefined;
    return tx.obra.update({
      where: { id },
      data: {
        ...dados,
        ...vincularCdd(cdd, cddDescricao),
        ...(cdd === null && { cdd: { disconnect: true } }),
        ...(vinculosAutores !== undefined && { autores: { deleteMany: {}, create: vinculosAutores } }),
      },
      include,
    });
  });
  return formatarObra(obra);
}

export async function remover(id) {
  const emprestados = await prisma.exemplar.count({ where: { id_obra: id, disponivel: false } });
  if (emprestados > 0) throw conflict("Não é possível excluir uma obra com exemplares emprestados.");
  return prisma.obra.delete({ where: { id }, select: { id: true, titulo: true } });
}
