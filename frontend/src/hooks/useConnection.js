import { useEffect, useState } from "react";
import { isOnline, subscribeConnection } from "../lib/api.js";

/** true enquanto a API responde e o navegador está conectado. */
export function useConnection() {
  const [apiOk, setApiOk] = useState(isOnline);
  const [browserOk, setBrowserOk] = useState(() => navigator.onLine !== false);

  useEffect(() => subscribeConnection(setApiOk), []);
  useEffect(() => {
    const up = () => setBrowserOk(true);
    const down = () => setBrowserOk(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  return apiOk && browserOk;
}
