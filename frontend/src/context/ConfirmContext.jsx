import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import Button from "../components/ui/Button.jsx";
import Modal from "../components/ui/Modal.jsx";

export const ConfirmContext = createContext(null);

/** `const ok = await confirm({ title, message })` — substitui window.confirm com o visual do app. */
export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setDialog({ confirmLabel: "Excluir", tone: "danger", ...options });
      }),
    [],
  );

  const close = (answer) => {
    resolver.current?.(answer);
    setDialog(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal open={Boolean(dialog)} onClose={() => close(false)} labelledBy="confirm-title">
        {dialog && (
          <div className="p-6">
            <div className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
                <AlertTriangle size={18} />
              </span>
              <div>
                <h2 id="confirm-title" className="font-display text-lg text-ink">
                  {dialog.title}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{dialog.message}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => close(false)} autoFocus>
                {dialog.cancelLabel ?? "Cancelar"}
              </Button>
              <Button variant={dialog.tone} onClick={() => close(true)}>
                {dialog.confirmLabel}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm precisa estar dentro de <ConfirmProvider>");
  return ctx;
}
