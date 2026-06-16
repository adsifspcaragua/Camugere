import { useState, useRef, useEffect, useMemo } from "react";
import { Search, Sun, Moon, Bell, X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function Header({ onNavigate, searchQuery, onSearchChange, obras }) {
  const { dark, toggle } = useTheme();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Sync external searchQuery with internal query when navigating away from acervo
  useEffect(() => {
    if (searchQuery === "") setQuery("");
  }, [searchQuery]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return obras.filter(
      (o) =>
        o.titulo.toLowerCase().includes(q) ||
        o.autor.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query, obras]);

  const handleSelect = (obra) => {
    setQuery(obra.titulo);
    setOpen(false);
    if (onSearchChange) onSearchChange(obra.titulo);
    if (onNavigate) onNavigate("acervo");
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);
    if (onSearchChange) onSearchChange(val);
  };

  const clearSearch = () => {
    setQuery("");
    setOpen(false);
    if (onSearchChange) onSearchChange("");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-surface-200 bg-white/80 px-6 backdrop-blur-xl transition-colors duration-300 dark:border-surface-800 dark:bg-surface-900/80">
      {/* Search with Autocomplete */}
      <div ref={ref} className="relative flex-1 max-w-xl">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-500"
        />
        <input
          id="global-search"
          type="text"
          placeholder="Buscar obra por título ou autor..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.trim() && setOpen(true)}
          className="w-full rounded-2xl border border-surface-200 bg-surface-50 py-3 pl-11 pr-10 text-base text-surface-900 placeholder-surface-400 outline-none transition-all duration-200 focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 dark:placeholder-surface-500 dark:focus:border-brand-500 dark:focus:bg-surface-800 dark:focus:ring-brand-500/30"
          aria-label="Busca global"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300"
            aria-label="Limpar busca"
          >
            <X size={16} />
          </button>
        )}
        {open && filtered.length > 0 && (
          <div className="absolute z-50 mt-2 max-h-80 w-full overflow-y-auto rounded-2xl border border-surface-200 bg-white shadow-xl dark:border-surface-700 dark:bg-surface-900 scrollbar-thin">
            {filtered.map((obra) => (
              <button
                key={obra.idObra}
                onClick={() => handleSelect(obra)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-50 focus:bg-surface-100 focus:outline-none dark:hover:bg-surface-800"
              >
                <span className="flex h-9 w-7 items-center justify-center rounded-lg bg-surface-100 text-lg dark:bg-surface-800">
                  {obra.capa}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-medium text-surface-800 dark:text-surface-200">
                    {obra.titulo}
                  </p>
                  <p className="truncate text-base text-surface-400 dark:text-surface-500">
                    {obra.autor}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        <button
          className="relative rounded-2xl p-3 text-surface-500 transition-colors duration-200 hover:bg-surface-100 hover:text-surface-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-200"
          aria-label="Notificações"
        >
          <Bell size={20} />
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-surface-900" />
        </button>

        <button
          id="dark-mode-toggle"
          onClick={toggle}
          className="rounded-2xl p-3 text-surface-500 transition-all duration-200 hover:bg-surface-100 hover:text-surface-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-200"
          aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
        >
          {dark ? (
            <Sun size={20} className="text-amber-400" />
          ) : (
            <Moon size={20} />
          )}
        </button>

        <div className="mx-1 h-8 w-px bg-surface-200 dark:bg-surface-700" />

        <button
          className="flex items-center gap-2.5 rounded-2xl p-2 pr-4 transition-colors duration-200 hover:bg-surface-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-surface-800"
          aria-label="Menu do perfil"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-base font-bold text-white shadow-sm">
            MA
          </div>
          <span className="hidden text-base font-medium text-surface-700 dark:text-surface-300 sm:inline">
            Mariana
          </span>
        </button>
      </div>
    </header>
  );
}
