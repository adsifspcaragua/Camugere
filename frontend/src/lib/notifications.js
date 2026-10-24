import { daysBetween } from "./loans.js";
import { formatDate } from "./format.js";

const DIAS_SUSPENSAO = 3;

/**
 * Notificações derivadas dos dados (nada fica salvo no servidor):
 * atrasos, devoluções de hoje/amanhã e suspensões que terminam em breve.
 * O `id` inclui a data relevante, então uma situação nova gera uma notificação nova.
 */
export function buildNotifications(loans, leitores, hoje = new Date()) {
  const itens = [];

  for (const loan of loans) {
    if (loan.devolvido) continue;
    if (loan.atrasado) {
      const dias = Math.abs(loan.diasRestantes);
      itens.push({
        id: `atraso:${loan.id}:${loan.dataPrevista.toISOString().slice(0, 10)}`,
        tone: "danger",
        titulo: `${loan.obra.titulo} está ${dias} dia${dias === 1 ? "" : "s"} atrasado`,
        detalhe: `Com ${loan.leitor.nome} · ${loan.leitor.email}`,
        alvo: { pagina: "emprestimos" },
        ordem: 0 - dias,
      });
    } else if (loan.diasRestantes <= 1) {
      itens.push({
        id: `vence:${loan.id}:${loan.dataPrevista.toISOString().slice(0, 10)}`,
        tone: "warn",
        titulo: `${loan.obra.titulo} vence ${loan.diasRestantes === 0 ? "hoje" : "amanhã"}`,
        detalhe: `Com ${loan.leitor.nome}`,
        alvo: { pagina: "emprestimos" },
        ordem: 100 + loan.diasRestantes,
      });
    }
  }

  for (const leitor of leitores) {
    const fim = leitor.suspensao?.dataFim;
    if (!fim) continue;
    const dias = daysBetween(hoje, fim);
    if (dias >= 0 && dias <= DIAS_SUSPENSAO) {
      itens.push({
        id: `suspensao:${leitor.suspensao.id}`,
        tone: "info",
        titulo: `Suspensão de ${leitor.nome} termina ${dias === 0 ? "hoje" : `em ${dias} dia${dias === 1 ? "" : "s"}`}`,
        detalhe: `Liberado(a) a partir de ${formatDate(fim)}`,
        alvo: { leitorId: leitor.id },
        ordem: 200 + dias,
      });
    }
  }

  return itens.sort((a, b) => a.ordem - b.ordem);
}
