import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { X, BookOpen, User, Calendar, Search, Hash, ChevronRight } from "lucide-react";
import Autocomplete from "./Autocomplete";
import { mockObras, mockLeitores } from "../data/mockData";
import { listLeitores } from "../../services/leitorService.js";
import { listExemplaresDisponiveis } from "../../services/exemplarService.js";
import { getUsuarioById } from "../../services/usuarioService.js";
import { getObraById } from "../../services/obraService.js";
import { createEmprestimo } from "../../services/emprestimoService.js";
import { useToast } from "../context/ToastContext";

export default function NewLoanDrawer({ isOpen, onClose, onConfirm }) {
  const [selectedLeitor, setSelectedLeitor] = useState(null);
  const [selectedExemplar, setSelectedExemplar] = useState(null);
  const [dataDevolucao, setDataDevolucao] = useState("");
  const [exemplaresDisponiveis, setExemplares] = useState([])
  const [leitores, setLeitores] = useState([])
  const drawerRef = useRef(null);
  const { addToast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      const lei = await listLeitores()
      const dataLeitores = await Promise.all( 
        lei.data.map(async (l) => {
          const usu = await getUsuarioById(l.id_usuario)
          return { usuario: usu.data, leitor: l }
      }))
      setLeitores(dataLeitores)

      const exe = await listExemplaresDisponiveis()
      const dataExemplares = await Promise.all(
        exe.data.map(async (e) => {
          const obra = await getObraById(e.id_obra)
          return { exemplar: e, obra: obra.data }
        })
      )
      setExemplares(dataExemplares)
    }

    loadData()
  }, [])

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  const filterLeitores = useCallback((items, query) => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((l) => l.usuario.nome.toLowerCase().includes(q) || l.leitor.telefone.toLowerCase().includes(q));
  }, []);

  const filterExemplares = useCallback((items, query) => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (e) => e.obra.titulo.toLowerCase().includes(q) || e.obra.numeroInventario.toLowerCase().includes(q)
    );
  }, []);

  const canSubmit = selectedLeitor && selectedExemplar && dataDevolucao;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canSubmit) return;

    const emprestimo = {
      diasLocacao: Math.ceil((new Date(dataDevolucao) - new Date()) / (1000 * 60 * 60 * 24)),
      dataDevolucao: dataDevolucao,
      id_leitor: selectedLeitor.leitor.id,
      id_exemplar: selectedExemplar.exemplar.id,
    }

    const response = await createEmprestimo(emprestimo);

    if(!response.ok){
      addToast(`Falha ao registrar empréstimo`);
      console.error('Erro ao criar empréstimo:', response);
      return
    }

    addToast(`Empréstimo registrado: ${selectedExemplar.obra.titulo || "Livro"} → ${selectedLeitor.usuario.nome || "Leitor"}`);
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
        aria-label="Novo Empréstimo"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-surface-200 bg-white shadow-2xl transition-transform duration-300 ease-out dark:border-surface-800 dark:bg-surface-900 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-200 px-6 py-5 dark:border-surface-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Novo Empréstimo</h2>
              <p className="text-base text-surface-400 dark:text-surface-500">Registrar saída de exemplar</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-2xl p-3 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-surface-500 dark:hover:bg-surface-800" aria-label="Fechar">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6 scrollbar-thin">
            {/* Leitor Autocomplete */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-base font-medium text-surface-700 dark:text-surface-300">
                <User size={18} className="text-surface-400" />
                Leitor
              </label>
              <Autocomplete
                items={leitores}
                filterFn={filterLeitores}
                renderItem={(l) => {
                  return (
                    <div className="flex w-full items-center justify-between">
                      <div>
                        <p className="text-base font-medium text-surface-800 dark:text-surface-200">{l.usuario.nome}</p>
                        <p className="text-base text-surface-400 dark:text-surface-500">{l.leitor.telefone}</p>
                      </div>
                    </div>
                  );
                }}
                onSelect={(l) => {
                  setSelectedLeitor(l)
                }}
                placeholder="Buscar leitor pelo nome..."
                selected={selectedLeitor}
                selectedLabel={selectedLeitor?.usuario.nome}
                onClear={() => setSelectedLeitor(null)}
                icon={User}
              />
            </div>

            {/* Exemplar Autocomplete */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-base font-medium text-surface-700 dark:text-surface-300">
                <Hash size={18} className="text-surface-400" />
                Exemplar Disponível
              </label>
              <Autocomplete
                items={exemplaresDisponiveis}
                filterFn={filterExemplares}
                renderItem={(e) => (
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-medium text-surface-800 dark:text-surface-200">{e.obra.titulo} { e.obra.subtitulo ? '- ' + e.obra.subtitulo : ''} </p>
                      <p className="text-base text-surface-400 dark:text-surface-500">{e.exemplar.numeroInventario}</p>
                    </div>
                  </div>
                )}
                onSelect={(e) => {
                  console.log('Selected Exemplar:', e)
                  setSelectedExemplar(e)}}
                placeholder="Buscar por título ou nº inventário..."
                selected={selectedExemplar}
                selectedLabel={selectedExemplar ? `${selectedExemplar.obra.titulo} — ${selectedExemplar.exemplar.numeroInventario}` : ""}
                onClear={() => setSelectedExemplar(null)}
                icon={Search}
              />
            </div>

            {/* Data de Devolução */}
            <div>
              <label htmlFor="data-devolucao" className="mb-2 flex items-center gap-2 text-base font-medium text-surface-700 dark:text-surface-300">
                <Calendar size={18} className="text-surface-400" />
                Dias de Locação
              </label>
              <input
                id="data-devolucao"
                type="number"
                onChange={(e) => {
                  const dias = parseInt(e.target.value);
                  if (isNaN(dias)) {
                    setDataDevolucao(null);
                    return;
                  }
                  const hoje = new Date()
                  const dataDevolucao = new Date(hoje.setDate(hoje.getDate() + dias)) 
                  setDataDevolucao(dataDevolucao)
                }}
                min="1" max="30"
                className="w-full rounded-2xl border border-surface-200 bg-surface-50 py-3 px-4 text-base text-surface-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 dark:focus:border-brand-500"
                required
              />
              <p className="mt-2 text-base text-surface-400 dark:text-surface-500">
                {dataDevolucao ? 'Data de devolução: ' + new Date(dataDevolucao).toLocaleDateString("pt-BR") : ''}
              </p>
            </div>

            {/* #6 — Summary Card (only shows when both are selected) */}
            {canSubmit && (
              <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-5 dark:border-brand-500/20 dark:bg-brand-500/5">
                <p className="mb-3 text-sm font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">Resumo do Empréstimo</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-surface-900 dark:text-white">Título - {selectedExemplar.obra.titulo}</p>
                      <p className="font-mono text-sm text-surface-500 dark:text-surface-400">Inventário - {selectedExemplar.exemplar.numeroInventario}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-base text-surface-600 dark:text-surface-300">
                    <ChevronRight size={16} className="text-brand-500" />
                    <span>Para: <strong>{selectedLeitor.usuario.nome}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-base text-surface-600 dark:text-surface-300">
                    <ChevronRight size={16} className="text-brand-500" />
                    <span>Devolver até: <strong>{new Date(dataDevolucao).toLocaleDateString("pt-BR")}</strong></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-surface-200 px-6 py-5 dark:border-surface-800">
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-2xl bg-brand-600 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/25 transition-all duration-200 hover:bg-brand-700 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed dark:focus-visible:ring-offset-surface-900"
            >
              Confirmar Empréstimo
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
