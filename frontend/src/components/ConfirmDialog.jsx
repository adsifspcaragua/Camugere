import { AlertTriangle, X } from "lucide-react";

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, variant = "danger" }) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-surface-200 bg-white p-6 shadow-2xl dark:border-surface-800 dark:bg-surface-900 animate-slide-up">
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${
              variant === "danger" ? "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400" : "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
            }`}>
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white">{title}</h3>
              <p className="mt-2 text-base text-surface-500 dark:text-surface-400">{message}</p>
            </div>
            <button onClick={onCancel} className="rounded-xl p-2 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800" aria-label="Fechar">
              <X size={18} />
            </button>
          </div>
          <div className="mt-6 flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="rounded-2xl border border-surface-200 px-5 py-2.5 text-base font-medium text-surface-700 transition-colors hover:bg-surface-100 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-800"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className={`rounded-2xl px-5 py-2.5 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98] ${
                variant === "danger"
                  ? "bg-red-600 shadow-red-600/25 hover:bg-red-700"
                  : "bg-amber-600 shadow-amber-600/25 hover:bg-amber-700"
              }`}
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
