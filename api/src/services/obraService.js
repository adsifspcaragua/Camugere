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

export async function importarEmLote(itens) {
  let criadas = 0;
  let atualizadas = 0;
  let exemplaresCriados = 0;
  const erros = [];

  for (let i = 0; i < itens.length; i++) {
    const item = itens[i];
    const { autor, cdd, cddDescricao, numExemplares = 1, ...dados } = item;
    const qtdExemplares = Math.max(1, parseInt(numExemplares, 10) || 1);

    if (!dados.titulo || typeof dados.titulo !== 'string' || !dados.titulo.trim()) {
      erros.push({ linha: i + 1, erro: 'Título não informado ou inválido.' });
      continue;
    }

    try {
      let obraExistente = null;
      if (dados.isbn) {
        obraExistente = await prisma.obra.findFirst({
          where: { isbn: dados.isbn },
          include: { cdd: true, autores: { include: { autor: true } } },
        });
      }
      if (!obraExistente && dados.titulo) {
        obraExistente = await prisma.obra.findFirst({
          where: { titulo: dados.titulo.trim() },
          include: { cdd: true, autores: { include: { autor: true } } },
        });
      }

      if (obraExistente) {
        await prisma.$transaction(async (tx) => {
          await criarParaObra(tx, obraExistente.id, qtdExemplares);

          const atualizacao = {};
          if (!obraExistente.isbn && dados.isbn) atualizacao.isbn = dados.isbn;
          if (!obraExistente.editora && dados.editora) atualizacao.editora = dados.editora;
          if (!obraExistente.anoPublicacao && dados.anoPublicacao) atualizacao.anoPublicacao = dados.anoPublicacao;
          if (!obraExistente.numeroPaginas && dados.numeroPaginas) atualizacao.numeroPaginas = dados.numeroPaginas;
          if (!obraExistente.subtitulo && dados.subtitulo) atualizacao.subtitulo = dados.subtitulo;
          if (!obraExistente.resumo && dados.resumo) atualizacao.resumo = dados.resumo;
          if (!obraExistente.capaUrl && dados.capaUrl) atualizacao.capaUrl = dados.capaUrl;

          const vinculosAutores = (!obraExistente.autores.length && autor) ? await garantirAutores(tx, autor) : undefined;
          const vinculoCdd = (!obraExistente.id_cdd && cdd) ? vincularCdd(cdd, cddDescricao) : undefined;

          if (Object.keys(atualizacao).length > 0 || vinculosAutores || vinculoCdd) {
            await tx.obra.update({
              where: { id: obraExistente.id },
              data: {
                ...atualizacao,
                ...(vinculoCdd ? vinculoCdd : {}),
                ...(vinculosAutores ? { autores: { create: vinculosAutores } } : {}),
              },
            });
          }
        });

        atualizadas++;
        exemplaresCriados += qtdExemplares;
      } else {
        await prisma.$transaction(async (tx) => {
          const vinculosAutores = await garantirAutores(tx, autor);
          const criada = await tx.obra.create({
            data: {
              ...dados,
              titulo: dados.titulo.trim(),
              ...vincularCdd(cdd, cddDescricao),
              autores: { create: vinculosAutores },
            },
          });
          await criarParaObra(tx, criada.id, qtdExemplares);
        });

        criadas++;
        exemplaresCriados += qtdExemplares;
      }
    } catch (err) {
      erros.push({ linha: i + 1, titulo: dados.titulo, erro: err.message });
    }
  }

  return {
    criadas,
    atualizadas,
    exemplaresCriados,
    totalProcessadas: criadas + atualizadas,
    erros,
  };
}
