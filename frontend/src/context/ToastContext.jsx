import { useState, useCallback, createContext, useContext } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success", duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3" aria-live="polite">
        {toasts.map((toast) => {
          const icons = {
            success: <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />,
            error: <AlertTriangle size={20} className="text-red-500 flex-shrink-0" />,
            info: <Info size={20} className="text-brand-500 flex-shrink-0" />,
          };
          const borders = {
            success: "border-emerald-200 dark:border-emerald-500/30",
            error: "border-red-200 dark:border-red-500/30",
            info: "border-brand-200 dark:border-brand-500/30",
          };
          return (
            <div
              key={toast.id}
              className={`flex items-center gap-3 rounded-2xl border bg-white px-5 py-4 shadow-xl transition-all duration-300 animate-slide-up dark:bg-surface-900 ${borders[toast.type]}`}
              role="alert"
            >
              {icons[toast.type]}
              <p className="text-base font-medium text-surface-800 dark:text-surface-200">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-2 rounded-lg p-1 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
                aria-label="Fechar"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
