import { useMemo } from "react";
import { BookOpen, Hash, ArrowUpRight, TrendingUp } from "lucide-react";

export default function RelatoriosPage({ emprestimos, exemplares, obras, leitores }) {
  const reports = useMemo(() => {
    // 1. Obras mais emprestadas
    const obrasCount = {};
    emprestimos.forEach((e) => {
      const ex = exemplares.find((x) => x.idExemplar === e.idExemplar);
      if (ex) {
        obrasCount[ex.idObra] = (obrasCount[ex.idObra] || 0) + 1;
      }
    });

    const topObras = Object.entries(obrasCount)
      .map(([id, count]) => {
        const obra = obras.find((o) => o.idObra === parseInt(id));
        return { obra, count };
      })
      .filter((item) => item.obra)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 2. Leitores mais ativos
    const leitoresCount = {};
    emprestimos.forEach((e) => {
      leitoresCount[e.idLeitor] = (leitoresCount[e.idLeitor] || 0) + 1;
    });

    const topLeitores = Object.entries(leitoresCount)
      .map(([id, count]) => {
        const leitor = leitores.find((l) => l.idLeitor === parseInt(id));
        return { leitor, count };
      })
      .filter((item) => item.leitor)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 3. Distribuição por CDD
    const cddCount = {};
    obras.forEach((o) => {
      const cat = o.cdd ? o.cdd.substring(0, 3) : "Outros"; // basic grouping by first 3 chars
      cddCount[cat] = (cddCount[cat] || 0) + 1;
    });

    const cddDist = Object.entries(cddCount)
      .map(([cdd, count]) => ({ cdd, count }))
      .sort((a, b) => b.count - a.count);

    return { topObras, topLeitores, cddDist };
  }, [emprestimos, exemplares, obras, leitores]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white">Relatórios & Estatísticas</h2>
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
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Obras Mais Emprestadas</h3>
          </div>
          <div className="space-y-3">
            {reports.topObras.map((item, i) => (
              <div key={item.obra.idObra} className="flex items-center gap-4 rounded-xl border border-surface-100 p-3 dark:border-surface-800">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-100 text-sm font-bold text-surface-500 dark:bg-surface-800 dark:text-surface-400">
                  {i + 1}
                </span>
                <span className="flex h-10 w-8 items-center justify-center rounded-lg bg-surface-50 text-xl dark:bg-surface-800">{item.obra.capa}</span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-base font-medium text-surface-900 dark:text-white">{item.obra.titulo}</p>
                  <p className="truncate text-sm text-surface-400 dark:text-surface-500">{item.obra.autor}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-brand-600 dark:text-brand-400">{item.count}</p>
                  <p className="text-xs text-surface-400 dark:text-surface-500">vezes</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Leitores */}
        <div className="rounded-2xl border border-surface-200 bg-white p-5 dark:border-surface-800 dark:bg-surface-900">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <ArrowUpRight size={20} />
            </div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Leitores Mais Ativos</h3>
          </div>
          <div className="space-y-3">
            {reports.topLeitores.map((item, i) => (
              <div key={item.leitor.idLeitor} className="flex items-center gap-4 rounded-xl border border-surface-100 p-3 dark:border-surface-800">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-100 text-sm font-bold text-surface-500 dark:bg-surface-800 dark:text-surface-400">
                  {i + 1}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white">
                  {item.leitor.nome.split(" ").map(n => n[0]).slice(0,2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-base font-medium text-surface-900 dark:text-white">{item.leitor.nome}</p>
                  <p className="truncate text-sm text-surface-400 dark:text-surface-500">{item.leitor.contato}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{item.count}</p>
                  <p className="text-xs text-surface-400 dark:text-surface-500">empréstimos</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CDD */}
        <div className="rounded-2xl border border-surface-200 bg-white p-5 lg:col-span-2 dark:border-surface-800 dark:bg-surface-900">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
              <Hash size={20} />
            </div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Distribuição do Acervo por CDD</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {reports.cddDist.map((item) => (
              <div key={item.cdd} className="rounded-xl bg-surface-50 p-4 dark:bg-surface-800">
                <p className="text-2xl font-bold text-surface-900 dark:text-white">{item.count}</p>
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
  );
}
