import { cloneElement, useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

const GAP = 8;
const DELAY = 350;

/**
 * Dica flutuante para ícones e ações compactas.
 * Abre com mouse (após um pequeno atraso) ou foco por teclado; fecha com Esc, rolagem ou clique.
 * Renderiza em portal para não ser cortada por tabelas com rolagem.
 */
export default function Tooltip({ content, side = "top", children }) {
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);
  const tipRef = useRef(null);
  const timer = useRef(null);
  const id = useId();

  const hide = useCallback(() => {
    clearTimeout(timer.current);
    setPos(null);
  }, []);

  const show = useCallback(
    (immediate) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(
        () => {
          const r = triggerRef.current?.getBoundingClientRect();
          if (r) setPos({ r, side });
        },
        immediate ? 0 : DELAY,
      );
    },
    [side],
  );

  // Ajusta para caber na tela depois de medir a dica.
  useEffect(() => {
    if (!pos || !tipRef.current) return;
    const tip = tipRef.current.getBoundingClientRect();
    const { r } = pos;
    let placement = pos.side;
    if (placement === "top" && r.top - tip.height - GAP < 4) placement = "bottom";
    if (placement === "bottom" && r.bottom + tip.height + GAP > window.innerHeight - 4) placement = "top";
    const top = placement === "top" ? r.top - tip.height - GAP : r.bottom + GAP;
    const left = Math.min(Math.max(8, r.left + r.width / 2 - tip.width / 2), window.innerWidth - tip.width - 8);
    tipRef.current.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
    tipRef.current.dataset.ready = "true";
  }, [pos]);

  useEffect(() => {
    if (!pos) return;
    const onKey = (e) => e.key === "Escape" && hide();
    window.addEventListener("scroll", hide, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [pos, hide]);

  useEffect(() => () => clearTimeout(timer.current), []);

  if (!content) return children;

  return (
    <>
      <span
        ref={triggerRef}
        className="inline-flex"
        onMouseEnter={() => show(false)}
        onMouseLeave={hide}
        onFocus={(e) => {
          if (e.target.matches?.(":focus-visible")) show(true);
        }}
        onBlur={hide}
        onPointerDown={hide}
      >
        {cloneElement(children, { "aria-describedby": pos ? id : undefined })}
      </span>
      {pos &&
        createPortal(
          <div
            ref={tipRef}
            id={id}
            role="tooltip"
            className="pointer-events-none fixed top-0 left-0 z-[120] max-w-[280px] rounded-md bg-deep px-3 py-2 text-xs leading-snug font-medium text-on-deep ring-1 ring-on-deep/20 opacity-0 shadow-pop transition-opacity duration-100 data-[ready=true]:opacity-100"
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}
