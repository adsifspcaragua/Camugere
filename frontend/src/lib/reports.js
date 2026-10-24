export const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** period: { ano: number|null, mes: number|null (0-11) } */
export function filterByPeriod(loans, { ano, mes }) {
  return loans.filter((l) => {
    if (ano != null && l.dataInicio.getFullYear() !== ano) return false;
    if (mes != null && l.dataInicio.getMonth() !== mes) return false;
    return true;
  });
}

function ranking(items, keyOf, labelOf, limit = 5) {
  const counts = new Map();
  for (const item of items) {
    const key = keyOf(item);
    const entry = counts.get(key) ?? { key, label: labelOf(item), item, count: 0 };
    entry.count += 1;
    counts.set(key, entry);
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).slice(0, limit);
}

export const topObras = (loans) => ranking(loans, (l) => l.obra.id, (l) => l.obra.titulo);
export const topLeitores = (loans) => ranking(loans, (l) => l.leitor.id, (l) => l.leitor.nome);

/** Atrasos: empréstimos ativos vencidos + devolvidos depois do prazo. */
export const devolveuAtrasado = (l) => l.atrasado || (l.devolvido && l.dataDevolucao > l.dataPrevista);
export const topAtrasos = (loans) => ranking(loans.filter(devolveuAtrasado), (l) => l.leitor.id, (l) => l.leitor.nome);

export function porMes(loans, ano) {
  const meses = Array(12).fill(0);
  loans.filter((l) => l.dataInicio.getFullYear() === ano).forEach((l) => (meses[l.dataInicio.getMonth()] += 1));
  return meses.map((count, i) => ({ label: MESES[i], count }));
}

/** Agrupa pela classe principal da CDD (centena): 869.3 -> 800. */
export function porClasseCdd(obras) {
  const classes = new Map();
  for (const obra of obras) {
    const classe = /^\d/.test(obra.cdd ?? "") ? `${obra.cdd[0]}00` : "Sem CDD";
    classes.set(classe, (classes.get(classe) ?? 0) + 1);
  }
  return [...classes.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => a.label.localeCompare(b.label));
}

export const CLASSES_CDD = {
  "000": "Generalidades",
  "100": "Filosofia e psicologia",
  "200": "Religião",
  "300": "Ciências sociais",
  "400": "Línguas",
  "500": "Ciências naturais",
  "600": "Tecnologia",
  "700": "Artes e lazer",
  "800": "Literatura",
  "900": "História e geografia",
};

const DIA_MS = 86_400_000;

/** Linhas do relatório de atrasos: em aberto (sempre) + devolvidos fora do prazo (no período). */
export function relatorioAtrasos(todos, doPeriodo, hoje = new Date()) {
  const emAberto = todos.filter((l) => l.atrasado);
  const devolvidosComAtraso = doPeriodo.filter((l) => l.devolvido && l.dataDevolucao > l.dataPrevista);
  const linha = (l) => ({
    ...l,
    emAberto: !l.devolvido,
    diasAtraso: Math.max(1, Math.floor(((l.devolvido ? l.dataDevolucao : hoje) - l.dataPrevista) / DIA_MS)),
  });
  return [...emAberto.map(linha), ...devolvidosComAtraso.map(linha)].sort((a, b) => b.emAberto - a.emAberto || b.diasAtraso - a.diasAtraso);
}
