import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function Modal({ open, onClose, labelledBy, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div role="alertdialog" aria-modal="true" aria-labelledby={labelledBy} className="animate-rise relative w-full max-w-md rounded-lg border border-line bg-panel shadow-pop">
        {children}
      </div>
    </div>,
    document.body,
  );
}
