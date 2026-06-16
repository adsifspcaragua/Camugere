import BookTable from "../components/BookTable";
import { useState } from "react";
import { Search, Plus } from "lucide-react";

export default function AcervoPage({ exemplares, searchQuery, emprestimos, obras, leitores, onAddObra, onEditObra, onDeleteObra, onAddExemplar, onDeleteExemplar }) {
  const [localSearch, setLocalSearch] = useState("");
  const effectiveQuery = searchQuery || localSearch;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white">Acervo</h2>
          <p className="mt-1 text-base text-surface-400 dark:text-surface-500">
            Obras e exemplares da Biblioteca Camugerê
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!searchQuery && (
            <div className="relative max-w-xs w-full">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Filtrar acervo..."
                className="w-full rounded-2xl border border-surface-200 bg-surface-50 py-2.5 pl-11 pr-4 text-base text-surface-900 placeholder-surface-400 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 dark:placeholder-surface-500 dark:focus:border-brand-500"
              />
            </div>
          )}
          <button
            onClick={onAddObra}
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-2.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <Plus size={18} />
            Nova Obra
          </button>
        </div>
      </div>
      <BookTable
        exemplares={exemplares} searchQuery={effectiveQuery} emprestimos={emprestimos}
        obras={obras} leitores={leitores}
        onEditObra={onEditObra} onDeleteObra={onDeleteObra}
        onAddExemplar={onAddExemplar} onDeleteExemplar={onDeleteExemplar}
      />
    </div>
  );
}
