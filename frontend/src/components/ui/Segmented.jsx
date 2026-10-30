import { Check } from "lucide-react";

/** Abas/filtros em chips com marcação explícita. options: [{ value, label, count?, alert? }] */
export default function Segmented({ options, value, onChange, label }) {
  return (
    <div role="tablist" aria-label={label} className="flex max-w-full flex-wrap gap-2">
      {options.map((opt) => {
        const active = opt.value === value;
        const alerta = opt.alert && opt.count > 0;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`flex min-h-11 shrink-0 items-center gap-2 rounded-md border-[1.5px] px-4 text-xs font-semibold whitespace-nowrap transition-colors ${
              active ? "border-forest bg-forest-soft text-forest" : "border-field bg-panel text-ink-soft hover:border-ink-soft hover:bg-sunken hover:text-ink"
            }`}
          >
            {active && <Check size={17} strokeWidth={2.5} aria-hidden />}
            {opt.label}
            {opt.count !== undefined && (
              <span
                className={`tabular min-w-6 rounded-sm px-1.5 text-center text-xs leading-6 ${
                  alerta ? "bg-danger-soft text-danger" : active ? "bg-panel text-ink" : "bg-sunken text-ink-muted"
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
