import { forwardRef } from "react";
import { Search, X } from "lucide-react";

const SearchInput = forwardRef(function SearchInput({ value, onChange, placeholder, className = "", ...props }, ref) {
  return (
    <div className={`relative ${className}`}>
      <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted" />
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 w-full rounded-full border border-line-strong bg-panel pr-9 pl-9 text-sm placeholder:text-ink-muted focus:border-forest focus:ring-2 focus:ring-forest/15 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        {...props}
      />
      {value && (
        <button onClick={() => onChange("")} aria-label="Limpar busca" className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-0.5 text-ink-muted hover:text-ink">
          <X size={14} />
        </button>
      )}
    </div>
  );
});

export default SearchInput;
