import { forwardRef } from "react";
import { Search, X } from "lucide-react";

const SearchInput = forwardRef(function SearchInput({ value, onChange, placeholder, className = "", ...props }, ref) {
  return (
    <div className={`relative ${className}`}>
      <Search size={20} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-muted" />
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-12 w-full rounded-md border-[1.5px] border-field bg-panel pr-12 pl-12 text-base placeholder:text-ink-muted hover:border-ink-soft focus:border-forest focus:ring-2 focus:ring-forest/20 [&::-webkit-search-cancel-button]:hidden"
        {...props}
      />
      {value && (
        <button onClick={() => onChange("")} aria-label="Limpar busca" className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-2 text-ink-muted hover:bg-sunken hover:text-ink">
          <X size={18} />
        </button>
      )}
    </div>
  );
});

export default SearchInput;
