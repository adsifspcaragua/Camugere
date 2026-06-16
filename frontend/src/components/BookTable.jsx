import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search, Pencil, Trash2, Plus } from "lucide-react";

export default function BookTable({ exemplares, searchQuery = "", emprestimos = [], obras = [], leitores = [], onEditObra, onDeleteObra, onAddExemplar, onDeleteExemplar }) {
  const [expandedObra, setExpandedObra] = useState(null);
  const [filter, setFilter] = useState("todos");

  const obrasComExemplares = useMemo(() => {
    return obras.map((obra) => {
      const exs = exemplares.filter((e) => e.idObra === obra.idObra);
      const total = exs.length;
      const disponiveis = exs.filter((e) => e.disponivel).length;
      return { ...obra, totalExemplares: total, exemplaresDisponiveis: disponiveis, exemplares: exs };
    });
  }, [exemplares, obras]);

  const filtered = useMemo(() => {
    let result = obrasComExemplares;
    if (filter === "disponiveis") result = result.filter((o) => o.exemplaresDisponiveis > 0);
    else if (filter === "emprestados") result = result.filter((o) => o.totalExemplares > 0 && o.exemplaresDisponiveis === 0);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) => o.titulo.toLowerCase().includes(q) || o.autor.toLowerCase().includes(q) || o.cdd.toLowerCase().includes(q)
      );
    }
    return result;
  }, [obrasComExemplares, searchQuery, filter]);

  const getReaderForExemplar = (idExemplar) => {
    const emp = emprestimos.find((e) => e.idExemplar === idExemplar && e.status === "ativo");
    if (!emp) return null;
    return leitores.find((l) => l.idLeitor === emp.idLeitor);
  };

  const toggleExpand = (idObra) => {
    setExpandedObra((prev) => (prev === idObra ? null : idObra));
  };

  return (
    <div className="rounded-2xl border border-surface-200 bg-white transition-colors duration-300 dark:border-surface-800 dark:bg-surface-900">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-surface-100 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-surface-800">
        <div>
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Acervo de Obras</h2>
          <p className="text-base text-surface-400 dark:text-surface-500">
            {filtered.length} obra{filtered.length !== 1 && "s"} · {exemplares.length} exemplar{exemplares.length !== 1 && "es"} no total
          </p>
        </div>
        {/* Filter tabs */}
        <div className="flex gap-1 rounded-xl border border-surface-200 bg-surface-100 p-1 dark:border-surface-700 dark:bg-surface-800">
          {[
            { id: "todos", label: "Todos" },
            { id: "disponiveis", label: "Disponíveis" },
            { id: "emprestados", label: "Sem estoque" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                filter === f.id
                  ? "bg-white text-surface-900 shadow-sm dark:bg-surface-900 dark:text-white"
                  : "text-surface-500 hover:text-surface-700 dark:text-surface-400"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Column Header */}
      <div className="grid grid-cols-[32px_1fr_180px_80px_90px_110px_80px] items-center gap-0 border-b border-surface-100 bg-surface-50/50 px-5 dark:border-surface-800 dark:bg-surface-800/20">
        <div />
        <div className="py-3 text-sm font-semibold uppercase tracking-wide text-surface-400 dark:text-surface-500">Obra</div>
        <div className="py-3 text-sm font-semibold uppercase tracking-wide text-surface-400 dark:text-surface-500">Autor(a)</div>
        <div className="py-3 text-sm font-semibold uppercase tracking-wide text-surface-400 dark:text-surface-500">CDD</div>
        <div className="py-3 text-center text-sm font-semibold uppercase tracking-wide text-surface-400 dark:text-surface-500">Total</div>
        <div className="py-3 text-center text-sm font-semibold uppercase tracking-wide text-surface-400 dark:text-surface-500">Disponíveis</div>
        <div className="py-3 text-center text-sm font-semibold uppercase tracking-wide text-surface-400 dark:text-surface-500">Ações</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-surface-50 dark:divide-surface-800/50">
        {filtered.map((obra) => {
          const isExpanded = expandedObra === obra.idObra;
          const hasExemplares = obra.totalExemplares > 0;

          return (
            <div key={obra.idObra}>
              {/* Main Row */}
              <div
                onClick={() => hasExemplares && toggleExpand(obra.idObra)}
                className={`grid grid-cols-[32px_1fr_180px_80px_90px_110px_80px] items-center gap-0 px-5 transition-colors ${
                  hasExemplares ? "cursor-pointer" : "cursor-default"
                } ${
                  isExpanded
                    ? "bg-brand-50/40 dark:bg-brand-500/5"
                    : "hover:bg-surface-50 dark:hover:bg-surface-800/30"
                }`}
              >
                {/* Chevron */}
                <div className="flex items-center justify-center py-4">
                  {hasExemplares ? (
                    isExpanded ? (
                      <ChevronDown size={16} className="text-brand-500" />
                    ) : (
                      <ChevronRight size={16} className="text-surface-300 dark:text-surface-600" />
                    )
                  ) : null}
                </div>

                {/* Obra */}
                <div className="flex items-center gap-3 py-4 pr-4">
                  <span className="flex h-10 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-surface-100 text-lg dark:bg-surface-800">
                    {obra.capa}
                  </span>
                  <span className="text-base font-medium text-surface-800 dark:text-surface-200 line-clamp-2">
                    {obra.titulo}
                  </span>
                </div>

                {/* Autor */}
                <div className="py-4 pr-4">
                  <span className="text-base text-surface-500 dark:text-surface-400 line-clamp-2">{obra.autor}</span>
                </div>

                {/* CDD */}
                <div className="py-4 pr-4">
                  <span className="font-mono text-sm text-surface-400 dark:text-surface-500">{obra.cdd}</span>
                </div>

                {/* Total */}
                <div className="flex items-center justify-center py-4">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-100 text-base font-semibold text-surface-700 dark:bg-surface-800 dark:text-surface-300">
                    {obra.totalExemplares}
                  </span>
                </div>

                {/* Disponíveis */}
                <div className="flex items-center justify-center py-4">
                  {obra.totalExemplares === 0 ? (
                    <span className="text-sm text-surface-300 dark:text-surface-600">—</span>
                  ) : obra.exemplaresDisponiveis === 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/30">
                      <span className="h-2 w-2 rounded-full bg-red-500" />0
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />{obra.exemplaresDisponiveis}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center gap-1 py-4" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onEditObra && onEditObra(obra)}
                    className="rounded-lg p-2 text-surface-400 transition-colors hover:bg-surface-100 hover:text-brand-600 dark:hover:bg-surface-800 dark:hover:text-brand-400"
                    title="Editar obra"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => onDeleteObra && onDeleteObra(obra.idObra)}
                    className="rounded-lg p-2 text-surface-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    title="Excluir obra"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Expanded Exemplares */}
              {isExpanded && (
                <div className="border-t border-brand-100/50 bg-brand-50/20 px-14 py-4 dark:border-brand-500/10 dark:bg-brand-500/5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                      Exemplares
                    </p>
                    <button
                      onClick={() => onAddExemplar && onAddExemplar(obra.idObra)}
                      className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 transition-all hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
                    >
                      <Plus size={12} /> Exemplar
                    </button>
                  </div>
                  <div className="space-y-2">
                    {obra.exemplares.map((ex) => {
                      const reader = !ex.disponivel ? getReaderForExemplar(ex.idExemplar) : null;
                      return (
                        <div
                          key={ex.idExemplar}
                          className="flex items-center gap-4 rounded-xl bg-white px-4 py-2.5 shadow-sm dark:bg-surface-900"
                        >
                          <span className="font-mono text-sm font-semibold text-surface-600 dark:text-surface-400">
                            {ex.numeroInventario}
                          </span>
                          <div className="flex-1" />
                          {ex.disponivel ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Disponível
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              {reader ? `Emprestado · ${reader.nome}` : "Emprestado"}
                            </span>
                          )}
                          {ex.disponivel && (
                            <button
                              onClick={() => onDeleteExemplar && onDeleteExemplar(ex.idExemplar)}
                              className="rounded-lg p-1.5 text-surface-300 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                              title="Remover exemplar"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16">
            <Search size={36} className="text-surface-300 dark:text-surface-600" />
            <p className="text-base font-medium text-surface-500 dark:text-surface-400">Nenhuma obra encontrada.</p>
            <p className="text-sm text-surface-400 dark:text-surface-500">Tente outro filtro ou termo de busca.</p>
          </div>
        )}
      </div>
    </div>
  );
}
