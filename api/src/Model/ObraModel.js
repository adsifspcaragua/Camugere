import { PrismaClient } from "@prisma/client";
import z from "zod";

const prisma = new PrismaClient();

const obraSchema = z.object({
  isbn: z.string().optional().nullable(),
  titulo: z.string({
    invalid_type_error: "O título deve ser um valor tipo texto",
    required_error: "O título é obrigatório",
  }).min(1, "O título não pode estar vazio"),
  subtitulo: z.string().optional().nullable(),
  editora: z.string().optional().nullable(),
  localPublicacao: z.string().optional().nullable(),
  anoPublicacao: z.coerce.number().int().optional().nullable(),
  edicao: z.string().optional().nullable(),
  numeroPaginas: z.coerce.number().int().min(0).default(0),
  resumo: z.string().optional().nullable(),
  capa: z.string().optional().default("📕"),
  capaUrl: z.string().optional().nullable(),
  ativa: z.boolean().default(true),
  // Campos relacionais enviados pelo ObraDrawer
  cdd: z.string().optional().nullable(),
  cddDescricao: z.string().optional().nullable(),
  autor: z.string().optional().nullable(),
  numExemplares: z.coerce.number().int().min(0).default(1),
});

export const obraValidator = (obra, partial = null) => {
  if (partial) {
    return obraSchema.partial().safeParse(obra);
  }
  return obraSchema.safeParse(obra);
};

// Função auxiliar para dividir "Machado de Assis" em { nome: "Machado", sobrenome: "de Assis" }
function parseAutores(autorString = "") {
  return autorString
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean)
    .map((nomeCompleto) => {
      const partes = nomeCompleto.split(/\s+/);
      const nome = partes[0]?.slice(0, 80) || "Autor";
      const sobrenome = partes.slice(1).join(" ").slice(0, 80) || "";
      return { nome, sobrenome };
    });
}

// Objeto padrão de retorno para manter a listagem do AcervoPage sempre completa
const obraInclude = {
  cdd: true,
  autores: {
    include: { autor: true },
  },
  exemplares: {
    select: {
      id: true,
      numeroInventario: true,
      disponivel: true,
    },
  },
};

// Encaixe logo abaixo de `const obraInclude = { ... };` (linha 62)
function formatarObra(obra) {
  if (!obra) return null;

  const nomesAutores = obra.autores
    ?.map((oa) => `${oa.autor?.nome || ""} ${oa.autor?.sobrenome || ""}`.trim())
    .filter(Boolean)
    .join(", ") || "Autor desconhecido";

  return {
    ...obra,
    idObra: obra.id,
    autor: nomesAutores,
    cdd: obra.cdd?.id || obra.id_cdd || "",
    cddDescricao: obra.cdd?.descricao || "",
    anoPublicacao: obra.anoPublicacao ? String(obra.anoPublicacao) : "",
    exemplaresFormatados: obra.exemplares?.map((ex) => ({
      id: ex.id,
      idExemplar: ex.id,
      idObra: obra.id,
      numeroInventario: ex.numeroInventario,
      disponivel: ex.disponivel,
    })) || [],
  };
}

export async function createObra(dados) {
  const {
    cdd,
    cddDescricao,
    autor,
    numExemplares = 1,
    isbn,
    anoPublicacao,
    numeroPaginas,
    ...camposObra
  } = dados;

  const listaAutores = parseAutores(autor);
  const cddCodigo = cdd?.trim();

  // Gera exemplares automaticamente com número de inventário único de 6 dígitos
  const exemplaresData = Array.from({ length: Math.max(0, Number(numExemplares)) }, (_, i) => ({
    numeroInventario: `${Date.now().toString().slice(-4)}${String(i + 1).padStart(2, "0")}`,
    disponivel: true,
  }));

  const criada = await prisma.obra.create({
    data: {
      ...camposObra,
      isbn: isbn ? isbn.replace(/\D/g, "") : null,
      anoPublicacao: anoPublicacao ? Number(anoPublicacao) : null,
      numeroPaginas: numeroPaginas ? Number(numeroPaginas) : 0,

      // 1. Conecta ao CDD existente ou cria um novo se não existir
      ...(cddCodigo && {
        cdd: {
          connectOrCreate: {
            where: { id: cddCodigo },
            create: {
              id: cddCodigo,
              descricao: cddDescricao?.trim() || "Geral",
            },
          },
        },
      }),

      // 2. Conecta ou cria cada autor na tabela Autor e vincula em ObraAutor
      ...(listaAutores.length > 0 && {
        autores: {
          create: listaAutores.map(({ nome, sobrenome }) => ({
            autor: {
              connectOrCreate: {
                where: { nome_sobrenome: { nome, sobrenome } },
                create: { nome, sobrenome },
              },
            },
          })),
        },
      }),

      // 3. Cria todos os exemplares físicos de uma vez
      ...(exemplaresData.length > 0 && {
        exemplares: {
          createMany: { data: exemplaresData },
        },
      }),
    },
    include: obraInclude,
  });
  return formatarObra(criada);
}

export async function listObra() {
  const obras = await prisma.obra.findMany({
    where: { ativa: true },
    include: obraInclude,
    orderBy: { id: "desc" },
  });
  return obras.map(formatarObra);
}

export async function getObraById(id) {
  const obra = await prisma.obra.findUnique({
    where: { id: Number(id) },
    include: obraInclude,
  });
  return formatarObra(obra);
}

export async function updateObra(id, dados) {
  const {
    cdd,
    cddDescricao,
    autor,
    numExemplares,
    idObra,
    isbn,
    anoPublicacao,
    numeroPaginas,
    ...camposObra
  } = dados;

  const listaAutores = autor ? parseAutores(autor) : null;
  const cddCodigo = cdd?.trim();

  const atualizada = await prisma.obra.update({
    where: { id: Number(id) },
    data: {
      ...camposObra,
      ...(isbn !== undefined && { isbn: isbn ? isbn.replace(/\D/g, "") : null }),
      ...(anoPublicacao !== undefined && { anoPublicacao: anoPublicacao ? Number(anoPublicacao) : null }),
      ...(numeroPaginas !== undefined && { numeroPaginas: Number(numeroPaginas) || 0 }),

      ...(cddCodigo && {
        cdd: {
          connectOrCreate: {
            where: { id: cddCodigo },
            create: {
              id: cddCodigo,
              descricao: cddDescricao?.trim() || "Geral",
            },
          },
        },
      }),

      // Atualiza a lista de autores substituindo os vínculos antigos
      ...(listaAutores && {
        autores: {
          deleteMany: {},
          create: listaAutores.map(({ nome, sobrenome }) => ({
            autor: {
              connectOrCreate: {
                where: { nome_sobrenome: { nome, sobrenome } },
                create: { nome, sobrenome },
              },
            },
          })),
        },
      }),
    },
    include: obraInclude,
  });
  return formatarObra(atualizada);
}

export async function deleteObra(id) {
  return await prisma.obra.delete({
    where: { id: Number(id) },
  });
}