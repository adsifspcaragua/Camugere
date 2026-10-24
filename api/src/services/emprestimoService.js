import { prisma } from "../lib/prisma.js";
import { conflict, notFound } from "../lib/httpError.js";
import { emprestimoSelect } from "./selects.js";
import { isAtrasado } from "../utils/dates.js";
import { enviarEmailEmprestimo } from "./emailService.js";
import { buscarAtiva } from "./suspensaoService.js";
import { formatarDataBR } from "../utils/dates.js";

const listarOnde = (where) => prisma.emprestimo.findMany({ where, select: emprestimoSelect, orderBy: { dataInicio: "desc" } });

export const listar = () => listarOnde(undefined);
export const listarAtivos = () => listarOnde({ statusDevolucao: false });

export async function listarAtrasados(hoje = new Date()) {
  const ativos = await listarAtivos();
  return ativos.filter((e) => isAtrasado(e, hoje));
}

export async function buscarPorId(id) {
  const emprestimo = await prisma.emprestimo.findUnique({ where: { id }, select: emprestimoSelect });
  if (!emprestimo) throw notFound("Empréstimo não encontrado.");
  return emprestimo;
}

export async function buscarAtivoPorExemplar(id_exemplar) {
  const emprestimo = await prisma.emprestimo.findFirst({
    where: { id_exemplar, statusDevolucao: false },
    select: emprestimoSelect,
  });
  if (!emprestimo) throw notFound("Nenhum empréstimo ativo para este exemplar.");
  return emprestimo;
}

async function notificar(emprestimo, enviar) {
  if (!enviar) return { enviado: false, desativado: true };
  try {
    return await enviarEmailEmprestimo(emprestimo);
  } catch (error) {
    console.warn("Falha ao enviar e-mail do empréstimo:", error.message);
    return { enviado: false, erro: error.message };
  }
}

export async function criar({ id_leitor, id_exemplar, diasLocacao, enviarNotificacao }) {
  const emprestimo = await prisma.$transaction(async (tx) => {
    const leitor = await tx.leitor.findUnique({ where: { id: id_leitor }, select: { id: true } });
    if (!leitor) throw notFound("Leitor não encontrado.");

    const suspensao = await buscarAtiva(id_leitor, tx);
    if (suspensao) {
      const ate = suspensao.dataFim ? ` até ${formatarDataBR(suspensao.dataFim)}` : "";
      throw conflict(`Leitor suspenso${ate}. Motivo: ${suspensao.motivo}`);
    }

    // updateMany com filtro "disponivel: true" reserva o exemplar de forma atômica,
    // evitando que dois empréstimos simultâneos peguem o mesmo exemplar.
    const { count } = await tx.exemplar.updateMany({
      where: { id: id_exemplar, disponivel: true },
      data: { disponivel: false },
    });
    if (count === 0) {
      const existe = await tx.exemplar.findUnique({ where: { id: id_exemplar }, select: { id: true } });
      throw existe ? conflict("Este exemplar já está emprestado.") : notFound("Exemplar não encontrado.");
    }

    return tx.emprestimo.create({ data: { id_leitor, id_exemplar, diasLocacao }, select: emprestimoSelect });
  });

  const emailNotification = await notificar(emprestimo, enviarNotificacao);
  return { ...emprestimo, emailNotification };
}

export async function registrarDevolucao(id) {
  const atual = await buscarPorId(id);
  if (atual.statusDevolucao) throw conflict("Este empréstimo já foi devolvido.");

  const [emprestimo] = await prisma.$transaction([
    prisma.emprestimo.update({
      where: { id },
      data: { statusDevolucao: true, dataDevolucao: new Date() },
      select: emprestimoSelect,
    }),
    prisma.exemplar.update({ where: { id: atual.id_exemplar }, data: { disponivel: true } }),
  ]);
  return emprestimo;
}

/** Desfaz uma devolução registrada por engano (o exemplar volta a ficar com o leitor). */
export async function desfazerDevolucao(id) {
  const atual = await buscarPorId(id);
  if (!atual.statusDevolucao) throw conflict("Este empréstimo não está devolvido.");

  return prisma.$transaction(async (tx) => {
    const { count } = await tx.exemplar.updateMany({ where: { id: atual.id_exemplar, disponivel: true }, data: { disponivel: false } });
    if (count === 0) throw conflict("O exemplar já foi emprestado de novo; não é possível desfazer.");
    return tx.emprestimo.update({ where: { id }, data: { statusDevolucao: false, dataDevolucao: null }, select: emprestimoSelect });
  });
}

export async function renovar(id, dias) {
  const atual = await buscarPorId(id);
  if (atual.statusDevolucao) throw conflict("Não é possível renovar um empréstimo já devolvido.");
  return prisma.emprestimo.update({
    where: { id },
    data: { diasLocacao: { increment: dias }, lembreteEnviadoEm: null }, // novo prazo, novo lembrete
    select: emprestimoSelect,
  });
}

export const atualizar = (id, dados) => prisma.emprestimo.update({ where: { id }, data: dados, select: emprestimoSelect });

export async function remover(id) {
  const atual = await buscarPorId(id);
  const operacoes = [prisma.emprestimo.delete({ where: { id }, select: emprestimoSelect })];
  if (!atual.statusDevolucao) {
    operacoes.push(prisma.exemplar.update({ where: { id: atual.id_exemplar }, data: { disponivel: true } }));
  }
  const [removido] = await prisma.$transaction(operacoes);
  return removido;
}
