import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/** Painel lateral para formulários. O conteúdo só é montado quando aberto (estado sempre limpo). */
export default function Drawer({ open, onClose, title, description, footer, onSubmit, children }) {
  const titleId = useId();
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  // Só depende de `open`: trocar a função de fechar não pode roubar o foco do campo atual.
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    // Esc fecha o drawer, a não ser que haja uma confirmação aberta por cima.
    const onKey = (e) => e.key === "Escape" && !document.querySelector("[role=alertdialog]") && closeRef.current();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => panelRef.current?.querySelector("input, textarea, select, button[data-autofocus]")?.focus());
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const Body = onSubmit ? "form" : "div";
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} aria-hidden />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-y-0 right-0 flex w-full max-w-[460px] flex-col border-l border-line bg-panel shadow-pop animate-rise"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h2 id={titleId} className="font-display text-xl font-medium text-ink">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
          </div>
          <button onClick={onClose} aria-label="Fechar" className="-mr-1 rounded-md p-1.5 text-ink-muted hover:bg-sunken hover:text-ink">
            <X size={18} />
          </button>
        </header>
        <Body
          className="flex min-h-0 flex-1 flex-col"
          {...(onSubmit && {
            onSubmit: (e) => {
              e.preventDefault();
              onSubmit();
            },
          })}
        >
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6 scrollbar-thin">{children}</div>
          {footer && <footer className="flex justify-end gap-2 border-t border-line bg-paper/60 px-6 py-4">{footer}</footer>}
        </Body>
      </aside>
    </div>,
    document.body,
  );
}
