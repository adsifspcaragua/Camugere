import { prisma } from "../lib/prisma.js";
import { notFound } from "../lib/httpError.js";

const select = { id: true, nome: true, sobrenome: true };

export const listar = () => prisma.autor.findMany({ select, orderBy: [{ nome: "asc" }, { sobrenome: "asc" }] });

export async function buscarPorId(id) {
  const autor = await prisma.autor.findUnique({ where: { id }, select });
  if (!autor) throw notFound("Autor não encontrado.");
  return autor;
}

export const criar = (dados) => prisma.autor.create({ data: dados, select });
export const atualizar = (id, dados) => prisma.autor.update({ where: { id }, data: dados, select });
export const remover = (id) => prisma.autor.delete({ where: { id }, select });

// "Machado de Assis, Clarice Lispector" -> [{ nome: "Machado", sobrenome: "de Assis" }, ...]
export function parseAutores(texto = "") {
  return texto
    .split(",")
    .map((nome) => nome.trim())
    .filter(Boolean)
    .map((nomeCompleto) => {
      const [nome, ...resto] = nomeCompleto.split(/\s+/);
      return { nome: nome.slice(0, 80), sobrenome: resto.join(" ").slice(0, 80) };
    });
}

export const formatarNomeAutor = ({ nome, sobrenome }) => `${nome} ${sobrenome}`.trim();
