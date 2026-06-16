import { useState, useEffect, useRef, useMemo } from "react";
import { X, BookOpen, Search, Hash, CornerDownLeft } from "lucide-react";
import { mockObras, mockLeitores } from "../data/mockData";

export default function ReturnDrawer({ isOpen, onClose, exemplares, emprestimos, onConfirm }) {
  const [query, setQuery] = useState("");
  const [selectedExemplar, setSelectedExemplar] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const drawerRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedExemplar(null);
      setDropdownOpen(false);
      setHighlightIndex(-1);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Only active (not yet returned) borrowed exemplares
  const borrowedExemplares = useMemo(() => {
    const activeEmprestimos = emprestimos.filter((e) => e.status === "ativo");
    const empIds = new Set(activeEmprestimos.map((e) => e.idExemplar));
    return exemplares
      .filter((e) => !e.disponivel && empIds.has(e.idExemplar))
      .map((e) => {
        const obra = mockObras.find((o) => o.idObra === e.idObra);
        const emp = activeEmprestimos.find((em) => em.idExemplar === e.idExemplar);
        const leitor = emp ? mockLeitores.find((l) => l.idLeitor === emp.idLeitor) : null;
        const today = new Date().toISOString().split("T")[0];
        const isOverdue = emp && emp.dataDevolucaoPrevista < today;
        return { ...e, titulo: obra?.titulo || "—", autor: obra?.autor || "—", capa: obra?.capa || "📕", leitor, emprestimo: emp, isOverdue };
      });
  }, [exemplares, emprestimos]);

  const filtered = useMemo(() => {
    if (!query.trim()) return borrowedExemplares;
    const q = query.toLowerCase();
    return borrowedExemplares.filter(
      (e) => e.numeroInventario.toLowerCase().includes(q) || e.titulo.toLowerCase().includes(q) || (e.leitor?.nome || "").toLowerCase().includes(q)
    );
  }, [borrowedExemplares, query]);

  // Reset highlight when filtered changes
  useEffect(() => { setHighlightIndex(-1); }, [filtered]);

  // Scroll highlight into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const el = listRef.current.children[highlightIndex];
      if (el) el.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex]);

  const handleSelect = (exemplar) => {
    setSelectedExemplar(exemplar);
    setDropdownOpen(false);
    setQuery("");
    setHighlightIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!dropdownOpen || filtered.length === 0) {
      if (e.key === "ArrowDown" && filtered.length > 0) {
        setDropdownOpen(true);
        setHighlightIndex(0);
        e.preventDefault();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((prev) => prev < filtered.length - 1 ? prev + 1 : 0);
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((prev) => prev > 0 ? prev - 1 : filtered.length - 1);
        break;
      case "Enter":
        e.preventDefault();
        if (highlightIndex >= 0) handleSelect(filtered[highlightIndex]);
        break;
      case "Escape":
        e.preventDefault();
        setDropdownOpen(false);
        setHighlightIndex(-1);
        break;
    }
  };

  const handleSubmit = () => {
    if (!selectedExemplar) return;
    onConfirm(selectedExemplar.idExemplar);
    onClose();
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Registrar Devolução"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-surface-200 bg-white shadow-2xl transition-transform duration-300 ease-out dark:border-surface-800 dark:bg-surface-900 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-200 px-6 py-5 dark:border-surface-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CornerDownLeft size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Registrar Devolução</h2>
              <p className="text-base text-surface-400 dark:text-surface-500">Dar baixa em exemplar emprestado</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-2xl p-3 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-surface-500 dark:hover:bg-surface-800" aria-label="Fechar">
            <X size={22} />
          </button>
        </div>

        <div className="flex flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6 scrollbar-thin">
            {/* Search by Inventory Number */}
            {!selectedExemplar && (
              <div>
                <label className="mb-2 flex items-center gap-2 text-base font-medium text-surface-700 dark:text-surface-300">
                  <Hash size={18} className="text-surface-400" />
                  Buscar Exemplar Emprestado
                </label>
                <div ref={searchRef} className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setDropdownOpen(true); }}
                    onFocus={() => setDropdownOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="INV-XXXX, título ou nome do leitor..."
                    className="w-full rounded-2xl border border-surface-200 bg-surface-50 py-3 pl-11 pr-4 text-base text-surface-900 placeholder-surface-400 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 dark:placeholder-surface-500 dark:focus:border-brand-500"
                    aria-label="Buscar exemplar para devolução"
                    role="combobox"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="listbox"
                  />
                  {dropdownOpen && filtered.length > 0 && (
                    <div ref={listRef} role="listbox" className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-surface-200 bg-white shadow-xl dark:border-surface-700 dark:bg-surface-900 scrollbar-thin">
                      {filtered.map((e, i) => (
                        <button
                          key={e.idExemplar}
                          type="button"
                          role="option"
                          aria-selected={i === highlightIndex}
                          onClick={() => handleSelect(e)}
                          onMouseEnter={() => setHighlightIndex(i)}
                          className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors focus:outline-none ${
                            i === highlightIndex
                              ? "bg-brand-50 dark:bg-brand-500/10"
                              : "hover:bg-surface-50 dark:hover:bg-surface-800"
                          }`}
                        >
                          <span className="flex h-9 w-7 items-center justify-center rounded-lg bg-surface-100 text-lg dark:bg-surface-800">{e.capa}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-base font-medium text-surface-800 dark:text-surface-200">{e.titulo}</p>
                            <p className="text-base text-surface-400 dark:text-surface-500">{e.numeroInventario} · {e.leitor?.nome || "—"}</p>
                          </div>
                          {e.isOverdue && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 dark:bg-red-500/10 dark:text-red-400">
                              Atrasado
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  {dropdownOpen && query && filtered.length === 0 && (
                    <div className="absolute z-50 mt-2 w-full rounded-2xl border border-surface-200 bg-white px-4 py-4 text-base text-surface-400 shadow-xl dark:border-surface-700 dark:bg-surface-900 dark:text-surface-500">
                      Nenhum exemplar emprestado encontrado.
                    </div>
                  )}
                </div>
                <p className="mt-2 text-base text-surface-400 dark:text-surface-500">
                  {borrowedExemplares.length} exemplar{borrowedExemplares.length !== 1 && "es"} emprestado{borrowedExemplares.length !== 1 && "s"}
                </p>
              </div>
            )}

            {/* Confirmation Card */}
            {selectedExemplar && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-base font-medium text-surface-700 dark:text-surface-300">Confirmar devolução:</p>
                  <button
                    type="button"
                    onClick={() => setSelectedExemplar(null)}
                    className="rounded-xl px-3 py-2 text-base font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
                  >
                    Trocar exemplar
                  </button>
                </div>
                <div className="rounded-2xl border border-surface-200 bg-surface-50 p-5 dark:border-surface-700 dark:bg-surface-800">
                  <div className="flex items-start gap-4">
                    <span className="flex h-14 w-11 items-center justify-center rounded-xl bg-white text-2xl shadow-sm dark:bg-surface-700">
                      {selectedExemplar.capa}
                    </span>
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="text-lg font-semibold text-surface-900 dark:text-white">{selectedExemplar.titulo}</p>
                      <p className="text-base text-surface-500 dark:text-surface-400">{selectedExemplar.autor}</p>
                      <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 dark:bg-surface-700">
                        <Hash size={16} className="text-brand-500" />
                        <span className="font-mono text-base font-medium text-surface-700 dark:text-surface-300">{selectedExemplar.numeroInventario}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl border border-surface-200 bg-white p-4 dark:border-surface-600 dark:bg-surface-700">
                    <p className="text-base text-surface-400 dark:text-surface-500">Emprestado para:</p>
                    <p className="mt-1 text-base font-semibold text-surface-800 dark:text-surface-200">{selectedExemplar.leitor?.nome || "Leitor não registrado"}</p>
                    {selectedExemplar.emprestimo && (
                      <p className="mt-1 text-base text-surface-400 dark:text-surface-500">
                        Desde {new Date(selectedExemplar.emprestimo.dataInicio).toLocaleDateString("pt-BR")} · Previsto {new Date(selectedExemplar.emprestimo.dataDevolucaoPrevista).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                    {selectedExemplar.isOverdue && (
                      <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-base font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-400">
                        ⚠ Devolução está atrasada!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {selectedExemplar && (
            <div className="border-t border-surface-200 px-6 py-5 dark:border-surface-800">
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full rounded-2xl bg-emerald-600 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all duration-200 hover:bg-emerald-700 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 active:scale-[0.98] dark:focus-visible:ring-offset-surface-900"
              >
                Confirmar Devolução
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
