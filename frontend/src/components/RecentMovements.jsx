import { useMemo } from "react";
import { ArrowUpRight } from "lucide-react";

export default function RecentMovements({ emprestimos, exemplares, obras, leitores, onNavigate }) {
  const enriched = useMemo(() => {
    return emprestimos
      .map((emp) => {
        const ex = exemplares.find((e) => e.idExemplar === emp.idExemplar);
        const obra = ex ? obras.find((o) => o.idObra === ex.idObra) : null;
        const leitor = leitores.find((l) => l.idLeitor === emp.idLeitor);
        return { ...emp, exemplar: ex, obra, leitor };
      })
      .sort((a, b) => new Date(b.dataInicio) - new Date(a.dataInicio))
      .slice(0, 6);
  }, [emprestimos, exemplares, obras, leitores]);

  return (
    <div className="rounded-2xl border border-surface-200 bg-white transition-colors duration-300 dark:border-surface-800 dark:bg-surface-900">
      <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4 dark:border-surface-800">
        <h3 className="text-base font-semibold text-surface-900 dark:text-white">
          Empréstimos Recentes
        </h3>
        <span className="rounded-lg bg-surface-100 px-3 py-1 text-base font-medium text-surface-500 dark:bg-surface-800 dark:text-surface-400">
          Ativos
        </span>
      </div>
      <div className="divide-y divide-surface-100 dark:divide-surface-800">
        {enriched.map((mov) => (
          <button
            key={mov.idEmprestimo}
            onClick={() => onNavigate && onNavigate("emprestimos")}
            className="w-full flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-50 focus:bg-surface-50 focus:outline-none dark:hover:bg-surface-800/50 dark:focus:bg-surface-800/50 text-left cursor-pointer"
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <ArrowUpRight size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-medium text-surface-800 dark:text-surface-200">
                {mov.obra?.titulo || "Obra desconhecida"}
              </p>
              <p className="truncate text-base text-surface-400 dark:text-surface-500">
                {mov.leitor?.nome || "—"} · {mov.exemplar?.numeroInventario}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-base font-medium text-surface-600 dark:text-surface-300">
                {new Date(mov.dataInicio).toLocaleDateString("pt-BR")}
              </p>
              <p className="text-base text-surface-400 dark:text-surface-500">
                Até {new Date(mov.dataDevolucaoPrevista).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </button>
        ))}
        {enriched.length === 0 && (
          <div className="px-5 py-8 text-center text-base text-surface-400 dark:text-surface-500">
            Nenhum empréstimo ativo.
          </div>
        )}
      </div>
    </div>
  );
}
