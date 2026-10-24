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

// "Machado de Assis, Clarice Lispector" -> [{ nome: "Machado", sobrenome: "de Assis" }, ...] sem duplicatas
export function parseAutores(texto = "") {
  const vistos = new Set();
  const resultado = [];
  for (const parte of texto.split(",")) {
    const nomeCompleto = parte.trim();
    if (!nomeCompleto) continue;
    const [nomeRaw, ...resto] = nomeCompleto.split(/\s+/);
    const nome = nomeRaw.slice(0, 80);
    const sobrenome = resto.join(" ").slice(0, 80);
    const chave = `${nome.toLowerCase()}|${sobrenome.toLowerCase()}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    resultado.push({ nome, sobrenome });
  }
  return resultado;
}

export const formatarNomeAutor = ({ nome, sobrenome }) => `${nome} ${sobrenome}`.trim();
