import { useCallback, useContext } from "react";
import { ConfirmContext } from "../context/ConfirmContext.jsx";

/** Envolve o fechar de um formulário: se houver alterações, pergunta antes de descartar. */
export function useGuardedClose(onClose, dirty) {
  const confirm = useContext(ConfirmContext);

  return useCallback(async () => {
    if (!dirty || !confirm) return onClose();
    const descartar = await confirm({
      title: "Descartar alterações?",
      message: "O que você preencheu neste formulário será perdido.",
      confirmLabel: "Descartar",
      cancelLabel: "Continuar editando",
    });
    if (descartar) onClose();
  }, [dirty, confirm, onClose]);
}
