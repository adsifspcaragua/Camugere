import { useMemo } from "react";
import {
  BookOpen,
  ArrowLeftRight,
  AlertTriangle,
  UserPlus,
  Plus,
  CornerDownLeft,
} from "lucide-react";
import StatCard from "../components/StatCard";
import RecentMovements from "../components/RecentMovements";

export default function DashboardPage({ exemplares, emprestimos, obras, leitores, onOpenLoan, onOpenReturn, onNavigate, obrasApi, isLoading }) {
  const activeEmprestimos = useMemo(() => emprestimos.filter((e) => e.status === "ativo"), [emprestimos]);

  const stats = useMemo(() => {
    if(isLoading) return { totalObras: 0, totalExemplares: 0, emprestimosAtivos: 0, atrasos: 0 };

    const totalObras = obrasApi.length
    const totalExemplares = exemplares.length;
    const emprestimosAtivos = activeEmprestimos.length;
    const today = new Date().toISOString().split("T")[0];
    const atrasos = activeEmprestimos.filter((e) => e.dataDevolucaoPrevista < today).length;
    return { totalObras, totalExemplares, emprestimosAtivos, atrasos };
  }, [obrasApi, obras, exemplares, activeEmprestimos, isLoading]);

  if(isLoading){
    return <div>Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white">
          Dashboard
        </h2>
        <p className="mt-1 text-base text-surface-400 dark:text-surface-500">
          Biblioteca Camugerê — {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard onClick={() => onNavigate && onNavigate("acervo")} title="Obras Cadastradas" value={stats.totalObras} icon={BookOpen} trend="up" trendValue={`${stats.totalExemplares} exemplares`} />
        <StatCard onClick={() => onNavigate && onNavigate("emprestimos")} title="Empréstimos Ativos" value={stats.emprestimosAtivos} icon={ArrowLeftRight} />
        <StatCard onClick={() => onNavigate && onNavigate("emprestimos")} title="Atrasos" value={stats.atrasos} icon={AlertTriangle} variant={stats.atrasos > 0 ? "danger" : "default"} />
        <StatCard onClick={() => onNavigate && onNavigate("leitores")} title="Leitores Cadastrados" value={leitores.length} icon={UserPlus} />
      </div>

      {/* Quick Actions + Recent */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <h3 className="text-base font-semibold text-surface-900 dark:text-white">
            Ações Rápidas
          </h3>
          <div className="space-y-3">
            <button
              id="quick-new-loan"
              onClick={onOpenLoan}
              className="group flex w-full items-center gap-4 rounded-2xl border border-surface-200 bg-white p-5 transition-all duration-200 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-500/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-surface-800 dark:bg-surface-900 dark:hover:border-brand-500/30"
            >
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400">
                <Plus size={24} />
              </div>
              <div className="text-left">
                <p className="text-base font-semibold text-surface-800 dark:text-surface-200">Novo Empréstimo</p>
                <p className="text-base text-surface-400 dark:text-surface-500">Registrar saída de exemplar</p>
              </div>
            </button>

            <button
              id="quick-return"
              onClick={onOpenReturn}
              className="group flex w-full items-center gap-4 rounded-2xl border border-surface-200 bg-white p-5 transition-all duration-200 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-surface-800 dark:bg-surface-900 dark:hover:border-emerald-500/30"
            >
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400">
                <CornerDownLeft size={24} />
              </div>
              <div className="text-left">
                <p className="text-base font-semibold text-surface-800 dark:text-surface-200">Registrar Devolução</p>
                <p className="text-base text-surface-400 dark:text-surface-500">Dar baixa em exemplar</p>
              </div>
            </button>
          </div>
          <p className="text-sm text-surface-400 dark:text-surface-500 pl-1">
            Atalhos: <kbd className="rounded bg-surface-100 px-1.5 py-0.5 font-mono text-xs dark:bg-surface-800">N</kbd> empréstimo · <kbd className="rounded bg-surface-100 px-1.5 py-0.5 font-mono text-xs dark:bg-surface-800">D</kbd> devolução · <kbd className="rounded bg-surface-100 px-1.5 py-0.5 font-mono text-xs dark:bg-surface-800">/</kbd> busca
          </p>
        </div>

        <div className="lg:col-span-2">
          <RecentMovements emprestimos={activeEmprestimos} exemplares={exemplares} obras={obras} leitores={leitores} onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );
}
