import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { conflict, notFound } from "../lib/httpError.js";
import { emprestimoSelect, enderecoCampos, leitorSelect } from "./selects.js";
import { hashSenha } from "./usuarioService.js";
import { isAtiva } from "./suspensaoService.js";

// Troca a lista de suspensões abertas pela suspensão ativa (ou null).
export function formatarLeitor(leitor) {
  if (!leitor) return null;
  const { suspensoes = [], ...resto } = leitor;
  const agora = new Date();
  return { ...resto, suspensaoAtiva: suspensoes.find((s) => isAtiva(s, agora)) ?? null };
}

const pick = (obj, campos) => Object.fromEntries(campos.filter((c) => obj[c] !== undefined).map((c) => [c, obj[c]]));

export async function listar() {
  const leitores = await prisma.leitor.findMany({ select: leitorSelect, orderBy: { usuario: { nome: "asc" } } });
  return leitores.map(formatarLeitor);
}

export async function buscarPorId(id) {
  const leitor = await prisma.leitor.findUnique({ where: { id }, select: leitorSelect });
  if (!leitor) throw notFound("Leitor não encontrado.");
  return formatarLeitor(leitor);
}

// Leitores não fazem login no sistema: o usuário vinculado recebe uma senha aleatória.
export async function criar({ nome, email, ...dados }) {
  const leitor = await prisma.leitor.create({
    data: {
      ...pick(dados, ["cpf", "telefone", ...enderecoCampos]),
      usuario: { create: { nome, email, hash: await hashSenha(randomUUID()) } },
    },
    select: leitorSelect,
  });
  return formatarLeitor(leitor);
}

export async function atualizar(id, { nome, email, ...dados }) {
  const atual = await buscarPorId(id);

  const leitor = await prisma.$transaction(async (tx) => {
    if (nome !== undefined || email !== undefined) {
      await tx.usuario.update({ where: { id: atual.id_usuario }, data: { nome, email } });
    }
    return tx.leitor.update({ where: { id }, data: pick(dados, ["cpf", "telefone", ...enderecoCampos]), select: leitorSelect });
  });
  return formatarLeitor(leitor);
}

export async function remover(id) {
  const leitor = await buscarPorId(id);
  const ativos = await prisma.emprestimo.count({ where: { id_leitor: id, statusDevolucao: false } });
  if (ativos > 0) throw conflict("Não é possível excluir um leitor com empréstimos ativos.");

  // Excluir o usuário remove o leitor (e seu histórico) em cascata.
  await prisma.usuario.delete({ where: { id: leitor.id_usuario } });
  return leitor;
}

export async function historicoEmprestimos(id) {
  await buscarPorId(id);
  return prisma.emprestimo.findMany({ where: { id_leitor: id }, select: emprestimoSelect, orderBy: { dataInicio: "desc" } });
}
