import { useState, useEffect, useRef } from "react";
import { X, BookOpen, UserRound, Hash, Layers, Plus } from "lucide-react";

const CAPAS = ["📕", "📗", "📘", "📙"];

export default function ObraDrawer({ isOpen, onClose, onConfirm, editingObra = null }) {
  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [cdd, setCdd] = useState("");
  const [numExemplares, setNumExemplares] = useState(1);
  const [capaIndex, setCapaIndex] = useState(0);
  const inputRef = useRef(null);
  const isEdit = !!editingObra;

  useEffect(() => {
    if (isOpen) {
      if (editingObra) {
        setTitulo(editingObra.titulo);
        setAutor(editingObra.autor);
        setCdd(editingObra.cdd);
        setCapaIndex(CAPAS.indexOf(editingObra.capa) >= 0 ? CAPAS.indexOf(editingObra.capa) : 0);
      } else {
        setTitulo("");
        setAutor("");
        setCdd("");
        setNumExemplares(1);
        setCapaIndex(Math.floor(Math.random() * 4));
      }
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, editingObra]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  const canSubmit = titulo.trim() && autor.trim();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onConfirm({
      titulo: titulo.trim(),
      autor: autor.trim(),
      cdd: cdd.trim(),
      capa: CAPAS[capaIndex],
      numExemplares: isEdit ? 0 : numExemplares,
      ...(editingObra && { idObra: editingObra.idObra }),
    });
    onClose();
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose} aria-hidden="true"
      />
      <div
        role="dialog" aria-modal="true" aria-label={isEdit ? "Editar Obra" : "Nova Obra"}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-surface-200 bg-white shadow-2xl transition-transform duration-300 ease-out dark:border-surface-800 dark:bg-surface-900 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-200 px-6 py-5 dark:border-surface-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white">{isEdit ? "Editar Obra" : "Nova Obra"}</h2>
              <p className="text-base text-surface-400 dark:text-surface-500">{isEdit ? "Atualizar dados da obra" : "Cadastrar obra no acervo"}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-2xl p-3 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:text-surface-500 dark:hover:bg-surface-800" aria-label="Fechar">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6 scrollbar-thin">
            {/* Capa Picker */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-base font-medium text-surface-700 dark:text-surface-300">Capa</label>
              <div className="flex gap-2">
                {CAPAS.map((c, i) => (
                  <button
                    key={i} type="button" onClick={() => setCapaIndex(i)}
                    className={`flex h-12 w-10 items-center justify-center rounded-xl text-xl transition-all ${
                      capaIndex === i ? "bg-brand-100 ring-2 ring-brand-500 dark:bg-brand-500/10" : "bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700"
                    }`}
                  >{c}</button>
                ))}
              </div>
            </div>

            {/* Título */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-base font-medium text-surface-700 dark:text-surface-300">
                <BookOpen size={18} className="text-surface-400" /> Título
              </label>
              <input
                ref={inputRef} type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: O escravo" required
                className="w-full rounded-2xl border border-surface-200 bg-surface-50 py-3 px-4 text-base text-surface-900 placeholder-surface-400 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 dark:placeholder-surface-500 dark:focus:border-brand-500"
              />
            </div>

            {/* Autor */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-base font-medium text-surface-700 dark:text-surface-300">
                <UserRound size={18} className="text-surface-400" /> Autor(a)
              </label>
              <input
                type="text" value={autor} onChange={(e) => setAutor(e.target.value)}
                placeholder="Ex: Carolina Maria de Jesus" required
                className="w-full rounded-2xl border border-surface-200 bg-surface-50 py-3 px-4 text-base text-surface-900 placeholder-surface-400 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 dark:placeholder-surface-500 dark:focus:border-brand-500"
              />
            </div>

            {/* CDD */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-base font-medium text-surface-700 dark:text-surface-300">
                <Hash size={18} className="text-surface-400" /> Classificação CDD
              </label>
              <input
                type="text" value={cdd} onChange={(e) => setCdd(e.target.value)}
                placeholder="Ex: 869e"
                className="w-full rounded-2xl border border-surface-200 bg-surface-50 py-3 px-4 text-base text-surface-900 placeholder-surface-400 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 dark:placeholder-surface-500 dark:focus:border-brand-500"
              />
            </div>

            {/* Nº de Exemplares (only on create) */}
            {!isEdit && (
              <div>
                <label className="mb-2 flex items-center gap-2 text-base font-medium text-surface-700 dark:text-surface-300">
                  <Layers size={18} className="text-surface-400" /> Quantidade de Exemplares
                </label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setNumExemplares((v) => Math.max(1, v - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface-200 text-lg font-semibold text-surface-600 hover:bg-surface-100 dark:border-surface-700 dark:text-surface-400 dark:hover:bg-surface-800"
                  >−</button>
                  <span className="w-10 text-center text-xl font-bold text-surface-900 dark:text-white">{numExemplares}</span>
                  <button type="button" onClick={() => setNumExemplares((v) => Math.min(20, v + 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface-200 text-lg font-semibold text-surface-600 hover:bg-surface-100 dark:border-surface-700 dark:text-surface-400 dark:hover:bg-surface-800"
                  >+</button>
                </div>
                <p className="mt-2 text-sm text-surface-400 dark:text-surface-500">Cada exemplar recebe um nº de inventário automático</p>
              </div>
            )}

            {/* Preview */}
            {canSubmit && (
              <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-5 dark:border-brand-500/20 dark:bg-brand-500/5">
                <p className="mb-3 text-sm font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">Prévia</p>
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-10 items-center justify-center rounded-xl bg-white text-2xl shadow-sm dark:bg-surface-800">{CAPAS[capaIndex]}</span>
                  <div>
                    <p className="text-base font-semibold text-surface-900 dark:text-white">{titulo}</p>
                    <p className="text-base text-surface-500 dark:text-surface-400">{autor}{cdd && ` · ${cdd}`}</p>
                    {!isEdit && <p className="text-sm text-brand-600 dark:text-brand-400">{numExemplares} exemplar{numExemplares !== 1 && "es"}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-surface-200 px-6 py-5 dark:border-surface-800">
            <button
              type="submit" disabled={!canSubmit}
              className="w-full rounded-2xl bg-brand-600 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/25 transition-all duration-200 hover:bg-brand-700 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isEdit ? "Salvar Alterações" : "Cadastrar Obra"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
