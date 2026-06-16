import { useState, useRef, useEffect, useMemo } from "react";
import { Search, X } from "lucide-react";

export default function Autocomplete({
  items,
  filterFn,
  renderItem,
  onSelect,
  placeholder = "Buscar...",
  selected,
  selectedLabel,
  onClear,
  icon: Icon = Search,
  disabled = false,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const ref = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!selected) setQuery("");
  }, [selected]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredItems = useMemo(() => {
    if (!filterFn) return items;
    return filterFn(items, query);
  }, [items, query, filterFn]);

  // Reset highlight when filtered items change
  useEffect(() => {
    setHighlightIndex(-1);
  }, [filteredItems]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const el = listRef.current.children[highlightIndex];
      if (el) el.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex]);

  const handleSelect = (item) => {
    onSelect(item);
    setQuery("");
    setOpen(false);
    setHighlightIndex(-1);
  };

  const handleClear = () => {
    onClear();
    setQuery("");
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 50);
  };

  const handleKeyDown = (e) => {
    if (!open || filteredItems.length === 0) {
      if (e.key === "ArrowDown" && filteredItems.length > 0) {
        setOpen(true);
        setHighlightIndex(0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev > 0 ? prev - 1 : filteredItems.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < filteredItems.length) {
          handleSelect(filteredItems[highlightIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setHighlightIndex(-1);
        break;
    }
  };

  if (selected && selectedLabel) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-base font-medium text-brand-800 dark:border-brand-700 dark:bg-brand-950 dark:text-brand-200">
        <Icon size={18} className="flex-shrink-0 text-brand-500" />
        <span className="flex-1 truncate">{selectedLabel}</span>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg p-1.5 text-brand-400 transition-colors hover:bg-brand-100 hover:text-brand-600 dark:hover:bg-brand-900 dark:hover:text-brand-300"
          aria-label="Limpar seleção"
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Icon
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-500"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full rounded-2xl border border-surface-200 bg-surface-50 py-3 pl-11 pr-4 text-base text-surface-900 placeholder-surface-400 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 dark:placeholder-surface-500 dark:focus:border-brand-500 dark:focus:bg-surface-800"
          aria-label={placeholder}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-activedescendant={highlightIndex >= 0 ? `ac-item-${highlightIndex}` : undefined}
        />
      </div>
      {open && filteredItems.length > 0 && (
        <div
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-surface-200 bg-white shadow-xl dark:border-surface-700 dark:bg-surface-900 scrollbar-thin"
        >
          {filteredItems.map((item, i) => (
            <button
              key={i}
              id={`ac-item-${i}`}
              type="button"
              role="option"
              aria-selected={i === highlightIndex}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setHighlightIndex(i)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left text-base transition-colors focus:outline-none ${
                i === highlightIndex
                  ? "bg-brand-50 dark:bg-brand-500/10"
                  : "hover:bg-surface-50 dark:hover:bg-surface-800"
              }`}
            >
              {renderItem(item)}
            </button>
          ))}
        </div>
      )}
      {open && query.length > 0 && filteredItems.length === 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-surface-200 bg-white px-4 py-4 text-base text-surface-400 shadow-xl dark:border-surface-700 dark:bg-surface-900 dark:text-surface-500">
          Nenhum resultado para "{query}".
        </div>
      )}
    </div>
  );
}
