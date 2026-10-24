import { useEffect } from "react";

const isTyping = (el) => el && (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || el.isContentEditable);

/** Atalhos de uma tecla, ignorados enquanto o usuário digita. map: { n: fn, "/": fn } */
export function useHotkeys(map, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(document.activeElement)) return;
      const handler = map[e.key.toLowerCase()];
      if (handler) {
        e.preventDefault();
        handler();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [map, enabled]);
}
