import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { inputClass } from "./ui/Field.jsx";

/**
 * Busca com lista suspensa navegável pelo teclado.
 * - items: lista completa; filter(item, query) decide o que aparece
 * - renderItem(item): conteúdo de cada opção; getLabel(item): texto do item selecionado
 */
export default function Autocomplete({ id, items, filter, renderItem, getKey, getLabel, value, onChange, placeholder, emptyMessage = "Nada encontrado.", limit = 8 }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const listId = useId();

  const results = useMemo(() => items.filter((item) => filter(item, query)).slice(0, limit), [items, filter, query, limit]);

  useEffect(() => {
    const onClick = (e) => !rootRef.current?.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const choose = (item) => {
    onChange(item);
    setQuery("");
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (i + step + results.length) % Math.max(results.length, 1));
    } else if (e.key === "Enter" && open && results[active]) {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === "Escape" && open) {
      e.stopPropagation();
      setOpen(false);
    }
  };

  if (value) {
    return (
      <div className="flex min-h-[52px] items-center gap-3 rounded-md border-[1.5px] border-forest/50 bg-forest-soft px-4 py-2">
        <div className="min-w-0 flex-1">{renderItem(value)}</div>
        <button type="button" onClick={() => onChange(null)} className="flex size-10 items-center justify-center rounded-md text-ink-muted hover:bg-panel hover:text-ink" aria-label={`Remover ${getLabel(value)}`}>
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-muted" />
      <input
        id={id}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && results[active] ? `${listId}-${active}` : undefined}
        className={`${inputClass} pl-11`}
      />
      {open && (
        <ul id={listId} role="listbox" className="absolute z-20 mt-2 max-h-80 w-full overflow-y-auto rounded-md border-[1.5px] border-line-strong bg-panel py-1 shadow-pop scrollbar-thin">
          {results.length === 0 && <li className="px-4 py-4 text-base text-ink-muted">{emptyMessage}</li>}
          {results.map((item, i) => (
            <li
              key={getKey(item)}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(item)}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-4 py-3 ${i === active ? "bg-forest-soft" : ""}`}
            >
              {renderItem(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
