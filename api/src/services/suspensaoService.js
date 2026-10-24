import { prisma } from "../lib/prisma.js";
import { conflict, notFound } from "../lib/httpError.js";
import { suspensaoSelect } from "./selects.js";
import { addDays } from "../utils/dates.js";

// Ativa = não encerrada manualmente e (sem data de fim ou com fim no futuro).
export const isAtiva = (s, agora = new Date()) => !s.dataEncerramento && (!s.dataFim || new Date(s.dataFim) > agora);

export const situacao = (s, agora = new Date()) =>
  s.dataEncerramento ? "encerrada" : isAtiva(s, agora) ? "ativa" : "cumprida";

export const whereAtiva = (agora = new Date()) => ({
  dataEncerramento: null,
  OR: [{ dataFim: null }, { dataFim: { gt: agora } }],
});

export function buscarAtiva(id_leitor, db = prisma) {
  return db.suspensao.findFirst({ where: { id_leitor, ...whereAtiva() }, select: suspensaoSelect, orderBy: { dataInicio: "desc" } });
}

export async function listarPorLeitor(id_leitor) {
  const suspensoes = await prisma.suspensao.findMany({ where: { id_leitor }, select: suspensaoSelect, orderBy: { dataInicio: "desc" } });
  const agora = new Date();
  return suspensoes.map((s) => ({ ...s, situacao: situacao(s, agora) }));
}

/** dias = null suspende por tempo indeterminado. */
export async function suspender(id_leitor, { motivo, dias }, id_bibliotecario) {
  const leitor = await prisma.leitor.findUnique({ where: { id: id_leitor }, select: { id: true } });
  if (!leitor) throw notFound("Leitor não encontrado.");
  if (await buscarAtiva(id_leitor)) throw conflict("Este leitor já está suspenso.");

  const agora = new Date();
  return prisma.suspensao.create({
    data: { id_leitor, motivo, dataInicio: agora, dataFim: dias ? addDays(agora, dias) : null, id_bibliotecario },
    select: suspensaoSelect,
  });
}

export async function encerrar(id) {
  const suspensao = await prisma.suspensao.findUnique({ where: { id }, select: suspensaoSelect });
  if (!suspensao) throw notFound("Suspensão não encontrada.");
  if (!isAtiva(suspensao)) throw conflict("Esta suspensão não está mais ativa.");
  return prisma.suspensao.update({ where: { id }, data: { dataEncerramento: new Date() }, select: suspensaoSelect });
}
