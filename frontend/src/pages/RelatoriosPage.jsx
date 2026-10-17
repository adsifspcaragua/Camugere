import { useMemo, useState, useEffect } from "react";
import { BookOpen, Hash, ArrowUpRight, TrendingUp, AlertTriangle, Search, Calendar } from "lucide-react";

const MESES = [
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

const SEMANAS_MES = [
  { value: "todas", label: "Todas as semanas" },
  { value: "1", label: "1ª Semana (dias 01 a 07)" },
  { value: "2", label: "2ª Semana (dias 08 a 14)" },
  { value: "3", label: "3ª Semana (dias 15 a 21)" },
  { value: "4", label: "4ª Semana (dias 22 a 28)" },
  { value: "5", label: "5ª Semana (dias 29 a 31)" },
];

export default function RelatoriosPage({ emprestimos, exemplares, obras, leitores }) {
  const currentYear = String(new Date().getFullYear());
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");

  // Filtros do relatório "Leitores Mais Ativos"
  const [modoPeriodo, setModoPeriodo] = useState("ano"); // "todos" | "ano" | "mes" | "semana"
  const [anoSelecionado, setAnoSelecionado] = useState(currentYear);
  const [mesSelecionado, setMesSelecionado] = useState(currentMonth);
  const [semanaSelecionada, setSemanaSelecionada] = useState("1");
  const [buscaLeitorAtivo, setBuscaLeitorAtivo] = useState("");

  // Extrai todos os anos disponíveis nos empréstimos reais (mais o ano atual)
  const anosDisponiveis = useMemo(() => {
    const setAnos = new Set([currentYear]);
    (emprestimos || []).forEach((e) => {
      if (e.dataInicio) {
        const ano = String(e.dataInicio).split("T")[0].split("-")[0];
        if (ano && ano.length === 4) setAnos.add(ano);
      }
    });
    return Array.from(setAnos).sort((a, b) => Number(b) - Number(a));
  }, [emprestimos, currentYear]);

  // Se existirem empréstimos e nenhum no ano atual, seleciona automaticamente o ano mais recente com dados
  useEffect(() => {
    if (!emprestimos || emprestimos.length === 0) return;
    const temNoAnoSelecionado = emprestimos.some(
      (e) => e.dataInicio && String(e.dataInicio).startsWith(anoSelecionado)
    );
    if (!temNoAnoSelecionado) {
      const anosComEmprestimo = Array.from(
        new Set(
          emprestimos
            .map((e) => (e.dataInicio ? String(e.dataInicio).split("T")[0].split("-")[0] : null))
            .filter(Boolean)
        )
      ).sort((a, b) => Number(b) - Number(a));

      if (anosComEmprestimo.length > 0) {
        setAnoSelecionado(anosComEmprestimo[0]);
      }
    }
  }, [emprestimos, anoSelecionado]);

  const reports = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];

    // 1. Obras mais emprestadas
    const obrasCount = {}
    emprestimos.forEach((e) => {
      const idEx = Number(e.idExemplar ?? e.id_exemplar);
      const ex = exemplares.find((x) => Number(x.idExemplar ?? x.id) === idEx) || e.exemplar;
      const idOb = Number(ex?.idObra ?? ex?.id_obra);
      if (idOb) {
        obrasCount[idOb] = (obrasCount[idOb] || 0) + 1;
      }
    })

    const topObras = Object.entries(obrasCount)
      .map(([id, count]) => {
        const obra = obras.find((o) => Number(o.idObra ?? o.id) === parseInt(id));
        return { obra, count };
      })
      .filter((item) => item.obra)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // 2. Leitores mais ativos (filtrado por Ano, Mês, Semana e Pesquisa)
    const leitoresCount = {};
    emprestimos.forEach((e) => {
      const idLei = Number(e.idLeitor ?? e.id_leitor);
      if (!idLei || !e.dataInicio) return;

      const dataStr = String(e.dataInicio).split("T")[0];
      const [anoEmp, mesEmp, diaEmp] = dataStr.split("-");
      const diaNum = Number(diaEmp);
      const semanaDoMes = String(Math.ceil(diaNum / 7));

      if (modoPeriodo === "ano") {
        if (anoEmp !== anoSelecionado) return;
      } else if (modoPeriodo === "mes") {
        if (anoEmp !== anoSelecionado || mesEmp !== mesSelecionado) return;
      } else if (modoPeriodo === "semana") {
        if (anoEmp !== anoSelecionado || mesEmp !== mesSelecionado) return;
        if (semanaSelecionada !== "todas" && semanaDoMes !== semanaSelecionada) return;
      }

      leitoresCount[idLei] = (leitoresCount[idLei] || 0) + 1;
    });

    const queryBusca = buscaLeitorAtivo.trim().toLowerCase();

    const topLeitores = Object.entries(leitoresCount)
      .map(([id, count]) => {
        const leitor = leitores.find((l) => Number(l.idLeitor ?? l.id) === parseInt(id));
        return { leitor, count };
      })
      .filter((item) => {
        if (!item.leitor) return false;
        if (!queryBusca) return true;
        const nomeMatch = (item.leitor.nome || "").toLowerCase().includes(queryBusca);
        const contatoMatch = (item.leitor.contato || item.leitor.telefone || "").toLowerCase().includes(queryBusca);
        return nomeMatch || contatoMatch;
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 3. Leitores que mais atrasam na devolução (em atraso ativo ou devolvidos após o prazo previsto)
    const atrasosCount = {};
    emprestimos.forEach((e) => {
      const idLei = Number(e.idLeitor ?? e.id_leitor);
      if (!idLei) return;

      let dataPrevista = e.dataDevolucaoPrevista;
      if (!dataPrevista && e.dataInicio && e.diasLocacao) {
        const d = new Date(e.dataInicio);
        d.setDate(d.getDate() + Number(e.diasLocacao));
        dataPrevista = d.toISOString().split("T")[0];
      }
      if (!dataPrevista) return;

      const isDevolvido = e.status ? e.status === "devolvido" : Boolean(e.statusDevolucao);
      const dataEfetivaDevolucao = e.dataDevolvido || (e.dataDevolucao ? new Date(e.dataDevolucao).toISOString().split("T")[0] : null);

      const atrasouAtivo = !isDevolvido && dataPrevista < today;
      const atrasouDevolvido = isDevolvido && dataEfetivaDevolucao && dataEfetivaDevolucao > dataPrevista;

      if (atrasouAtivo || atrasouDevolvido) {
        atrasosCount[idLei] = (atrasosCount[idLei] || 0) + 1;
      }
    });

    const topAtrasos = Object.entries(atrasosCount)
      .map(([id, count]) => {
        const leitor = leitores.find((l) => Number(l.idLeitor ?? l.id) === parseInt(id));
        return { leitor, count };
      })
      .filter((item) => item.leitor)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // 4. Distribuição por CDD
    const cddCount = {};
    obras.forEach((o) => {
      const cat = o.cdd ? o.cdd.substring(0, 3) : "Outros" // basic grouping by first 3 chars
      cddCount[cat] = (cddCount[cat] || 0) + 1
    })

    const cddDist = Object.entries(cddCount)
      .map(([cdd, count]) => ({ cdd, count }))
      .sort((a, b) => b.count - a.count)

    return { topObras, topLeitores, topAtrasos, cddDist };
  }, [
    emprestimos,
    exemplares,
    obras,
    leitores,
    modoPeriodo,
    anoSelecionado,
    mesSelecionado,
    semanaSelecionada,
    buscaLeitorAtivo,
  ]);

  const descricaoPeriodoAtivo = useMemo(() => {
    if (modoPeriodo === "todos") return "Todo o período";
    const nomeMes = MESES.find((m) => m.value === mesSelecionado)?.label || mesSelecionado;
    if (modoPeriodo === "ano") return `Ano de ${anoSelecionado}`;
    if (modoPeriodo === "mes") return `${nomeMes} de ${anoSelecionado}`;
    if (modoPeriodo === "semana") {
      const labelSemana =
        semanaSelecionada === "todas"
          ? "Todas as semanas"
          : `${semanaSelecionada}ª Semana`;
      return `${labelSemana} · ${nomeMes}/${anoSelecionado}`;
    }
    return "";
  }, [modoPeriodo, anoSelecionado, mesSelecionado, semanaSelecionada]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white">
          Relatórios & Estatísticas
        </h2>
        <p className="mt-1 text-base text-surface-400 dark:text-surface-500">
          Visão geral do uso do acervo e engajamento da comunidade
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Obras */}
        <div className="rounded-2xl border border-surface-200 bg-white p-5 dark:border-surface-800 dark:bg-surface-900">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <TrendingUp size={20} />
            </div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
              Obras Mais Emprestadas
            </h3>
          </div>
          <div className="space-y-3">
            {reports.topObras.map((item, i) => (
              <div
                key={item.obra.idObra}
                className="flex items-center gap-4 rounded-xl border border-surface-100 p-3 dark:border-surface-800"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-100 text-sm font-bold text-surface-500 dark:bg-surface-800 dark:text-surface-400">
                  {i + 1}
                </span>
                <span className="flex h-10 w-8 items-center justify-center rounded-lg bg-surface-50 text-xl dark:bg-surface-800">
                  {item.obra.capa}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-base font-medium text-surface-900 dark:text-white">
                    {item.obra.titulo}
                  </p>
                  <p className="truncate text-sm text-surface-400 dark:text-surface-500">
                    {item.obra.autor}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-brand-600 dark:text-brand-400">
                    {item.count}
                  </p>
                  <p className="text-xs text-surface-400 dark:text-surface-500">
                    vezes
                  </p>
                </div>
              </div>
            ))}
            {reports.topObras.length === 0 && (
              <p className="py-6 text-center text-sm text-surface-400 dark:text-surface-500">
                Nenhum empréstimo registrado ainda.
              </p>
            )}
          </div>
        </div>

        {/* Top Leitores */}
        <div className="rounded-2xl border border-surface-200 bg-white p-5 dark:border-surface-800 dark:bg-surface-900">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <ArrowUpRight size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Leitores Mais Ativos</h3>
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">{descricaoPeriodoAtivo}</p>
              </div>
            </div>

            {/* Seletor de Modo: Ano / Mês / Semana / Geral */}
            <div className="flex rounded-xl border border-surface-200 bg-surface-100 p-1 dark:border-surface-700 dark:bg-surface-800">
              {[
                { id: "ano", label: "Ano" },
                { id: "mes", label: "Mês" },
                { id: "semana", label: "Semana" },
                { id: "todos", label: "Geral" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setModoPeriodo(tab.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    modoPeriodo === tab.id
                      ? "bg-white text-surface-900 shadow-sm dark:bg-surface-900 dark:text-white"
                      : "text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Barra de Filtros e Pesquisa */}
          <div className="mb-4 space-y-2.5">
            {modoPeriodo !== "todos" && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {/* Seletor de Ano */}
                <div className={modoPeriodo === "ano" ? "sm:col-span-3" : "sm:col-span-1"}>
                  <label className="mb-1 flex items-center gap-1 text-xs font-medium text-surface-500 dark:text-surface-400">
                    <Calendar size={12} />
                    Ano
                  </label>
                  <select
                    value={anoSelecionado}
                    onChange={(e) => setAnoSelecionado(e.target.value)}
                    className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-sm font-medium text-surface-800 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
                  >
                    {anosDisponiveis.map((ano) => (
                      <option key={ano} value={ano}>
                        {ano}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Seletor de Mês */}
                {(modoPeriodo === "mes" || modoPeriodo === "semana") && (
                  <div className={modoPeriodo === "mes" ? "sm:col-span-2" : "sm:col-span-1"}>
                    <label className="mb-1 block text-xs font-medium text-surface-500 dark:text-surface-400">
                      Mês
                    </label>
                    <select
                      value={mesSelecionado}
                      onChange={(e) => setMesSelecionado(e.target.value)}
                      className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-sm font-medium text-surface-800 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
                    >
                      {MESES.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Seletor de Semana */}
                {modoPeriodo === "semana" && (
                  <div className="sm:col-span-1">
                    <label className="mb-1 block text-xs font-medium text-surface-500 dark:text-surface-400">
                      Semana
                    </label>
                    <select
                      value={semanaSelecionada}
                      onChange={(e) => setSemanaSelecionada(e.target.value)}
                      className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-sm font-medium text-surface-800 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
                    >
                      {SEMANAS_MES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Campo de Pesquisa por Leitor */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                value={buscaLeitorAtivo}
                onChange={(e) => setBuscaLeitorAtivo(e.target.value)}
                placeholder="Pesquisar leitor no período selecionado..."
                className="w-full rounded-xl border border-surface-200 bg-surface-50 py-2 pl-9 pr-3 text-sm text-surface-900 placeholder-surface-400 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 dark:placeholder-surface-500"
              />
            </div>
          </div>

          <div className="space-y-3">
            {reports.topLeitores.map((item, i) => (
              <div
                key={item.leitor.idLeitor}
                className="flex items-center gap-4 rounded-xl border border-surface-100 p-3 dark:border-surface-800"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-100 text-sm font-bold text-surface-500 dark:bg-surface-800 dark:text-surface-400">
                  {i + 1}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white">
                  {item.leitor.nome
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-base font-medium text-surface-900 dark:text-white">{item.leitor.nome}</p>
                  <p className="truncate text-sm text-surface-400 dark:text-surface-500">{item.leitor.contato || item.leitor.telefone}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{item.count}</p>
                  <p className="text-xs text-surface-400 dark:text-surface-500">
                    {item.count === 1 ? "empréstimo" : "empréstimos"}
                  </p>
                </div>
              </div>
            ))}
            {reports.topLeitores.length === 0 && (
              <p className="py-6 text-center text-sm text-surface-400 dark:text-surface-500">
                Nenhum leitor com empréstimos encontrados para {descricaoPeriodoAtivo.toLowerCase()}.
              </p>
            )}
          </div>
        </div>

        {/* Leitores que Mais Atrasam */}
        <div className="rounded-2xl border border-surface-200 bg-white p-5 lg:col-span-2 dark:border-surface-800 dark:bg-surface-900">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <AlertTriangle size={20} />
            </div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Leitores que Mais Atrasam na Devolução</h3>
          </div>
          <div className="space-y-3">
            {reports.topAtrasos.map((item, i) => (
              <div key={item.leitor.idLeitor} className="flex items-center gap-4 rounded-xl border border-surface-100 p-3 dark:border-surface-800">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-100 text-sm font-bold text-surface-500 dark:bg-surface-800 dark:text-surface-400">
                  {i + 1}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-400 to-red-600 text-sm font-bold text-white">
                  {item.leitor.nome.split(" ").map(n => n[0]).slice(0,2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-base font-medium text-surface-900 dark:text-white">{item.leitor.nome}</p>
                  <p className="truncate text-sm text-surface-400 dark:text-surface-500">{item.leitor.contato || item.leitor.telefone}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">{item.count}</p>
                  <p className="text-xs text-surface-400 dark:text-surface-500">
                    {item.count === 1 ? "atraso" : "atrasos"}
                  </p>
                </div>
              </div>
            ))}
            {reports.topAtrasos.length === 0 && (
              <p className="py-6 text-center text-sm text-surface-400 dark:text-surface-500">
                Nenhum atraso de devolução registrado até o momento.
              </p>
            )}
          </div>
        </div>

        {/* CDD */}
        <div className="rounded-2xl border border-surface-200 bg-white p-5 lg:col-span-2 dark:border-surface-800 dark:bg-surface-900">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
              <Hash size={20} />
            </div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
              Distribuição do Acervo por CDD
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {reports.cddDist.map((item) => (
              <div
                key={item.cdd}
                className="rounded-xl bg-surface-50 p-4 dark:bg-surface-800"
              >
                <p className="text-2xl font-bold text-surface-900 dark:text-white">
                  {item.count}
                </p>
                <p className="mt-1 flex items-center gap-1 text-sm font-medium text-surface-500 dark:text-surface-400">
                  <BookOpen size={14} /> obras
                </p>
                <div className="mt-3 inline-block rounded-md bg-white px-2 py-1 font-mono text-xs font-semibold text-surface-600 dark:bg-surface-900 dark:text-surface-300">
                  CDD {item.cdd}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
