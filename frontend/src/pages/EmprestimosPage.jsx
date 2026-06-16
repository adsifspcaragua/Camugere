import { useMemo, useState, useCallback } from "react";
import { Hash, CornerDownLeft, Clock, CheckCircle2, AlertTriangle, RefreshCcw } from "lucide-react";

const TABS = [
  { id: "ativos", label: "Ativos", icon: Clock },
  { id: "atrasados", label: "Atrasados", icon: AlertTriangle },
  { id: "devolvidos", label: "Devolvidos", icon: CheckCircle2 },
];

export default function EmprestimosPage({ exemplares, emprestimos, obras, leitores, onOpenLoan, onReturn, onRenew }) {
  const [activeTab, setActiveTab] = useState("ativos");
  const today = new Date().toISOString().split("T")[0];

  const enriched = useMemo(() => {
    return emprestimos.map((emp) => {
      const ex = exemplares.find((e) => e.idExemplar === emp.idExemplar);
      const obra = ex ? obras.find((o) => o.idObra === ex.idObra) : null;
      const leitor = leitores.find((l) => l.idLeitor === emp.idLeitor);
      const isOverdue = emp.status === "ativo" && emp.dataDevolucaoPrevista < today;
      return { ...emp, exemplar: ex, obra, leitor, isOverdue };
    }).sort((a, b) => new Date(b.dataInicio) - new Date(a.dataInicio));
  }, [emprestimos, exemplares, obras, leitores, today]);

  const filtered = useMemo(() => {
    switch (activeTab) {
      case "ativos":
        return enriched.filter((e) => e.status === "ativo" && !e.isOverdue);
      case "atrasados":
        return enriched.filter((e) => e.isOverdue);
      case "devolvidos":
        return enriched.filter((e) => e.status === "devolvido");
      default:
        return enriched;
    }
  }, [enriched, activeTab]);

  const tabCounts = useMemo(() => ({
    ativos: enriched.filter((e) => e.status === "ativo" && !e.isOverdue).length,
    atrasados: enriched.filter((e) => e.isOverdue).length,
    devolvidos: enriched.filter((e) => e.status === "devolvido").length,
  }), [enriched]);

  const handleInlineReturn = useCallback((idExemplar) => {
    if (onReturn) onReturn(idExemplar);
  }, [onReturn]);

  const handleInlineRenew = useCallback((idEmprestimo) => {
    if (onRenew) onRenew(idEmprestimo);
  }, [onRenew]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white">Empréstimos & Devoluções</h2>
          <p className="mt-1 text-base text-surface-400 dark:text-surface-500">
            {enriched.filter((e) => e.status === "ativo").length} ativo{enriched.filter((e) => e.status === "ativo").length !== 1 && "s"} · {tabCounts.atrasados > 0 && <span className="text-red-500 font-semibold">{tabCounts.atrasados} atrasado{tabCounts.atrasados !== 1 && "s"}</span>}
          </p>
        </div>
        <button onClick={onOpenLoan} className="rounded-2xl bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
          Novo Empréstimo
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-surface-200 bg-surface-100 p-1 dark:border-surface-700 dark:bg-surface-800">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const count = tabCounts[tab.id];
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-base font-medium transition-all duration-200 ${
                isActive
                  ? "bg-white text-surface-900 shadow-sm dark:bg-surface-900 dark:text-white"
                  : "text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-300"
              }`}
            >
              <Icon size={16} className={tab.id === "atrasados" && count > 0 ? "text-red-500" : ""} />
              {tab.label}
              {count > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  tab.id === "atrasados"
                    ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                    : "bg-surface-200 text-surface-600 dark:bg-surface-700 dark:text-surface-400"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface-100 dark:border-surface-800">
                <th className="py-3.5 pl-5 pr-3 text-base font-semibold text-surface-500 dark:text-surface-400">Obra</th>
                <th className="px-3 py-3.5 text-base font-semibold text-surface-500 dark:text-surface-400">Inventário</th>
                <th className="px-3 py-3.5 text-base font-semibold text-surface-500 dark:text-surface-400">Leitor</th>
                <th className="px-3 py-3.5 text-base font-semibold text-surface-500 dark:text-surface-400">Início</th>
                <th className="px-3 py-3.5 text-base font-semibold text-surface-500 dark:text-surface-400">
                  {activeTab === "devolvidos" ? "Devolvido em" : "Devolução Prevista"}
                </th>
                {activeTab !== "devolvidos" && (
                  <th className="py-3.5 pl-3 pr-5 text-base font-semibold text-surface-500 dark:text-surface-400 text-right">Ações</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50 dark:divide-surface-800/50">
              {filtered.map((mov) => (
                <tr
                  key={mov.idEmprestimo}
                  className={`transition-colors ${
                    mov.isOverdue
                      ? "bg-red-50/50 hover:bg-red-50 dark:bg-red-500/5 dark:hover:bg-red-500/10"
                      : "hover:bg-surface-50 dark:hover:bg-surface-800/30"
                  }`}
                >
                  <td className="py-3.5 pl-5 pr-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-7 items-center justify-center rounded-lg bg-surface-100 text-lg dark:bg-surface-800">{mov.obra?.capa || "📕"}</span>
                      <div className="min-w-0">
                        <span className="block truncate text-base font-medium text-surface-800 dark:text-surface-200">{mov.obra?.titulo || "—"}</span>
                        {mov.isOverdue && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 dark:bg-red-500/10 dark:text-red-400">
                            <AlertTriangle size={12} />
                            ATRASADO
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="inline-flex items-center gap-1.5 font-mono text-base text-surface-500 dark:text-surface-400">
                      <Hash size={14} />
                      {mov.exemplar?.numeroInventario || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-base text-surface-600 dark:text-surface-300">{mov.leitor?.nome || "—"}</td>
                  <td className="px-3 py-3.5 text-base text-surface-500 dark:text-surface-400">{new Date(mov.dataInicio).toLocaleDateString("pt-BR")}</td>
                  <td className={`px-3 py-3.5 text-base ${
                    mov.isOverdue
                      ? "font-semibold text-red-600 dark:text-red-400"
                      : "text-surface-500 dark:text-surface-400"
                  }`}>
                    {activeTab === "devolvidos" && mov.dataDevolvido
                      ? new Date(mov.dataDevolvido).toLocaleDateString("pt-BR")
                      : new Date(mov.dataDevolucaoPrevista).toLocaleDateString("pt-BR")
                    }
                  </td>
                  {activeTab !== "devolvidos" && (
                    <td className="py-3.5 pl-3 pr-5 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleInlineRenew(mov.idEmprestimo)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm font-semibold text-surface-700 transition-all hover:bg-surface-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
                          title="Renovar empréstimo (+14 dias)"
                        >
                          <RefreshCcw size={14} />
                          Renovar
                        </button>
                        <button
                          onClick={() => handleInlineReturn(mov.idExemplar)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition-all hover:bg-emerald-100 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                          title="Registrar devolução"
                        >
                          <CornerDownLeft size={14} />
                          Devolver
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      {activeTab === "atrasados" ? (
                        <>
                          <CheckCircle2 size={40} className="text-emerald-400" />
                          <p className="text-base font-medium text-surface-500 dark:text-surface-400">Nenhum atraso! 🎉</p>
                          <p className="text-base text-surface-400 dark:text-surface-500">Todos os empréstimos estão em dia.</p>
                        </>
                      ) : activeTab === "devolvidos" ? (
                        <>
                          <Clock size={40} className="text-surface-300 dark:text-surface-600" />
                          <p className="text-base font-medium text-surface-500 dark:text-surface-400">Nenhuma devolução registrada ainda.</p>
                        </>
                      ) : (
                        <>
                          <Clock size={40} className="text-surface-300 dark:text-surface-600" />
                          <p className="text-base font-medium text-surface-500 dark:text-surface-400">Nenhum empréstimo ativo.</p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
