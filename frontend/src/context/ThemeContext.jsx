import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const KEY = "camugere:theme";
const ThemeContext = createContext(null);
const media = () => window.matchMedia?.("(prefers-color-scheme: dark)");

function readPreference() {
  try {
    const saved = localStorage.getItem(KEY);
    return ["light", "dark", "system"].includes(saved) ? saved : "system";
  } catch {
    return "system";
  }
}

/** Preferência de tema: "system" (segue o sistema), "light" ou "dark". */
export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(readPreference);
  const [systemDark, setSystemDark] = useState(() => media()?.matches ?? false);

  useEffect(() => {
    const mq = media();
    if (!mq) return;
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const dark = preference === "dark" || (preference === "system" && systemDark);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem(KEY, preference);
    } catch {
      /* sem armazenamento: vale só nesta sessão */
    }
  }, [dark, preference]);

  const toggleTheme = useCallback(() => {
    setPreference((prev) => {
      const isDark = prev === "dark" || (prev === "system" && (media()?.matches ?? false));
      return isDark ? "light" : "dark";
    });
  }, []);

  const value = useMemo(() => ({ dark, preference, setPreference, toggleTheme }), [dark, preference, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme precisa estar dentro de <ThemeProvider>");
  return ctx;
}
