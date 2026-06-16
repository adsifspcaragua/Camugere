import { useState, useEffect, useRef } from "react";
import { X, UserPlus, User, Mail, Phone } from "lucide-react";

export default function LeitorDrawer({ isOpen, onClose, onConfirm, editingLeitor = null }) {
  const [nome, setNome] = useState("");
  const [contato, setContato] = useState("");
  const [telefone, setTelefone] = useState("");
  const inputRef = useRef(null);
  const isEdit = !!editingLeitor;

  useEffect(() => {
    if (isOpen) {
      if (editingLeitor) {
        setNome(editingLeitor.nome);
        setContato(editingLeitor.contato);
        setTelefone(editingLeitor.telefone || "");
      } else {
        setNome("");
        setContato("");
        setTelefone("");
      }
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, editingLeitor]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  const canSubmit = nome.trim() && contato.trim();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onConfirm({
      nome: nome.trim(),
      contato: contato.trim(),
      telefone: telefone.trim(),
      ...(editingLeitor && { idLeitor: editingLeitor.idLeitor }),
    });
    onClose();
  };

  const initials = nome.trim()
    ? nome.trim().split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose} aria-hidden="true"
      />
      <div
        role="dialog" aria-modal="true" aria-label={isEdit ? "Editar Leitor" : "Novo Leitor"}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-surface-200 bg-white shadow-2xl transition-transform duration-300 ease-out dark:border-surface-800 dark:bg-surface-900 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-200 px-6 py-5 dark:border-surface-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
              <UserPlus size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white">{isEdit ? "Editar Leitor" : "Novo Leitor"}</h2>
              <p className="text-base text-surface-400 dark:text-surface-500">{isEdit ? "Atualizar dados do leitor" : "Cadastrar novo leitor"}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-2xl p-3 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:text-surface-500 dark:hover:bg-surface-800" aria-label="Fechar">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6 scrollbar-thin">
            {/* Avatar Preview */}
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-2xl font-bold text-white shadow-lg shadow-brand-500/30">
                {initials}
              </div>
            </div>

            {/* Nome */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-base font-medium text-surface-700 dark:text-surface-300">
                <User size={18} className="text-surface-400" /> Nome Completo
              </label>
              <input
                ref={inputRef} type="text" value={nome} onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Maria Silva" required
                className="w-full rounded-2xl border border-surface-200 bg-surface-50 py-3 px-4 text-base text-surface-900 placeholder-surface-400 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 dark:placeholder-surface-500 dark:focus:border-brand-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-base font-medium text-surface-700 dark:text-surface-300">
                <Mail size={18} className="text-surface-400" /> E-mail
              </label>
              <input
                type="email" value={contato} onChange={(e) => setContato(e.target.value)}
                placeholder="Ex: maria@email.com" required
                className="w-full rounded-2xl border border-surface-200 bg-surface-50 py-3 px-4 text-base text-surface-900 placeholder-surface-400 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 dark:placeholder-surface-500 dark:focus:border-brand-500"
              />
            </div>

            {/* Telefone */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-base font-medium text-surface-700 dark:text-surface-300">
                <Phone size={18} className="text-surface-400" /> Telefone <span className="text-sm text-surface-400">(opcional)</span>
              </label>
              <input
                type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)}
                placeholder="Ex: (21) 99999-0000"
                className="w-full rounded-2xl border border-surface-200 bg-surface-50 py-3 px-4 text-base text-surface-900 placeholder-surface-400 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 dark:placeholder-surface-500 dark:focus:border-brand-500"
              />
            </div>

            {/* Summary */}
            {canSubmit && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-500/20 dark:bg-blue-500/5">
                <p className="mb-3 text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Prévia</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-base font-bold text-white">
                    {initials}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-surface-900 dark:text-white">{nome}</p>
                    <p className="text-base text-surface-500 dark:text-surface-400">{contato}</p>
                    {telefone && <p className="text-sm text-surface-400 dark:text-surface-500">{telefone}</p>}
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
              {isEdit ? "Salvar Alterações" : "Cadastrar Leitor"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
