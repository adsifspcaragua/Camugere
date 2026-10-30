import { useEffect, useRef } from "react";
import { WifiOff } from "lucide-react";
import { useConnection } from "../hooks/useConnection.js";

const RETRY_MS = 5000;

/** Faixa fixa enquanto não houver conexão; tenta de novo sozinha e recarrega os dados quando volta. */
export default function ConnectionBanner({ onRetry }) {
  const online = useConnection();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (online) {
      if (wasOffline.current) onRetry();
      wasOffline.current = false;
      return;
    }
    wasOffline.current = true;
    const timer = setInterval(onRetry, RETRY_MS);
    return () => clearInterval(timer);
  }, [online, onRetry]);

  if (online) return null;
  return (
    <div role="status" className="sticky top-0 z-30 flex items-center justify-center gap-2 bg-warn-soft px-4 py-3 text-sm font-semibold text-warn">
      <WifiOff size={18} aria-hidden />
      <span>
        Sem conexão com o servidor. Tentando reconectar… <span className="font-normal">O que você fizer agora pode não ser salvo.</span>
      </span>
    </div>
  );
}
