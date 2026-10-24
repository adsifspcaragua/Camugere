const DIA_MS = 24 * 60 * 60 * 1000;

export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + Number(days));
  return result;
}

export const dataPrevistaDevolucao = (emprestimo) => addDays(emprestimo.dataInicio, emprestimo.diasLocacao);

export function isAtrasado(emprestimo, hoje = new Date()) {
  return !emprestimo.statusDevolucao && dataPrevistaDevolucao(emprestimo) < hoje;
}

export function diasEntre(inicio, fim) {
  return Math.ceil((new Date(fim) - new Date(inicio)) / DIA_MS);
}

export const formatarDataBR = (date) => new Date(date).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
