import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const ICONS = { success: CheckCircle2, error: CircleAlert, info: Info };
const ACCENT = { success: "text-ok", error: "text-danger", info: "text-forest" };
const DURATION = { success: 4500, info: 5000, error: 7000 };
const WITH_ACTION = 8000;

/**
 * Avisos curtos após cada ação. Opcionalmente com um botão de ação (ex.: "Desfazer").
 * Pausam enquanto o mouse está em cima, para dar tempo de ler ou clicar.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const schedule = useCallback((id, ms) => timers.current.set(id, setTimeout(() => dismiss(id), ms)), [dismiss]);

  const notify = useCallback(
    (type, message, { action } = {}) => {
      const id = ++nextId.current;
      const duration = action ? WITH_ACTION : DURATION[type];
      setToasts((list) => [...list.slice(-3), { id, type, message, action, duration }]);
      schedule(id, duration);
      return id;
    },
    [schedule],
  );

  const value = useMemo(
    () => ({
      success: (m, opts) => notify("success", m, opts),
      error: (m, opts) => notify("error", m, opts),
      info: (m, opts) => notify("info", m, opts),
      dismiss,
    }),
    [notify, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-[100] flex w-[min(440px,calc(100vw-2rem))] -translate-x-1/2 flex-col items-center gap-2" aria-live="polite">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type];
          return (
            <div
              key={toast.id}
              role={toast.type === "error" ? "alert" : "status"}
              onMouseEnter={() => clearTimeout(timers.current.get(toast.id))}
              onMouseLeave={() => schedule(toast.id, 2500)}
              className="animate-rise pointer-events-auto flex w-full items-center gap-3 rounded-2xl border border-line bg-panel py-2.5 pr-2.5 pl-4 shadow-pop"
            >
              <Icon size={18} className={`shrink-0 ${ACCENT[toast.type]}`} aria-hidden />
              <p className="flex-1 py-0.5 text-sm text-ink">{toast.message}</p>
              {toast.action && (
                <button
                  onClick={() => {
                    dismiss(toast.id);
                    toast.action.onClick();
                  }}
                  className="shrink-0 rounded-full px-3 py-1 text-sm font-medium text-forest hover:bg-forest-soft"
                >
                  {toast.action.label}
                </button>
              )}
              <button onClick={() => dismiss(toast.id)} className="shrink-0 rounded-full p-1.5 text-ink-muted hover:bg-sunken hover:text-ink" aria-label="Fechar aviso">
                <X size={15} />
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
  if (!ctx) throw new Error("useToast precisa estar dentro de <ToastProvider>");
  return ctx;
}
