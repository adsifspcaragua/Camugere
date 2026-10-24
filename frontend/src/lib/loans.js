const DAY_MS = 86_400_000;

export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + Number(days));
  return d;
}

export const daysBetween = (from, to) => Math.round((startOfDay(to) - startOfDay(from)) / DAY_MS);

/** Converte o empréstimo da API para o formato usado na interface. */
export function normalizeLoan(raw, today = new Date()) {
  const dataInicio = new Date(raw.dataInicio);
  const dataPrevista = addDays(dataInicio, raw.diasLocacao);
  const devolvido = Boolean(raw.statusDevolucao);
  const diasRestantes = daysBetween(today, dataPrevista);

  return {
    id: raw.id,
    dataInicio,
    dataPrevista,
    dataDevolucao: raw.dataDevolucao ? new Date(raw.dataDevolucao) : null,
    diasLocacao: raw.diasLocacao,
    devolvido,
    atrasado: !devolvido && diasRestantes < 0,
    diasRestantes,
    leitor: {
      id: raw.id_leitor,
      nome: raw.leitor?.usuario?.nome ?? "Leitor removido",
      email: raw.leitor?.usuario?.email ?? "",
    },
    exemplar: { id: raw.id_exemplar, numeroInventario: raw.exemplar?.numeroInventario ?? "—" },
    obra: {
      id: raw.exemplar?.obra?.id,
      titulo: raw.exemplar?.obra?.titulo ?? "Obra removida",
      capaUrl: raw.exemplar?.obra?.capaUrl ?? null,
    },
  };
}

export function loanStatus(loan) {
  if (loan.devolvido) return { tone: "neutral", label: "Devolvido" };
  if (loan.atrasado) return { tone: "danger", label: `${Math.abs(loan.diasRestantes)}d de atraso` };
  if (loan.diasRestantes <= 2) return { tone: "warn", label: loan.diasRestantes === 0 ? "Vence hoje" : `Vence em ${loan.diasRestantes}d` };
  return { tone: "ok", label: `${loan.diasRestantes}d restantes` };
}

export function summarize(obras, loans) {
  const exemplares = obras.flatMap((o) => o.exemplares ?? []);
  const ativos = loans.filter((l) => !l.devolvido);
  return {
    obras: obras.length,
    exemplares: exemplares.length,
    disponiveis: exemplares.filter((e) => e.disponivel).length,
    ativos: ativos.length,
    atrasados: ativos.filter((l) => l.atrasado).length,
    venceEmBreve: ativos.filter((l) => !l.atrasado && l.diasRestantes <= 2).length,
  };
}
