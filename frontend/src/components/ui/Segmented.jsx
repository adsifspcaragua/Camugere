/** Abas/filtros em pílula. options: [{ value, label, count?, alert? }] */
export default function Segmented({ options, value, onChange, label }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex max-w-full overflow-x-auto rounded-full bg-sunken p-1 scrollbar-thin">
      {options.map((opt) => {
        const active = opt.value === value;
        const alerta = opt.alert && opt.count > 0;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`flex h-8 shrink-0 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium whitespace-nowrap transition-colors ${
              active ? "bg-panel text-ink shadow-sm" : "text-ink-muted hover:text-ink"
            }`}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span
                className={`tabular min-w-5 rounded-full px-1.5 text-center text-[11px] leading-5 ${
                  alerta ? "bg-danger-soft text-danger" : active ? "bg-sunken text-ink-soft" : "text-ink-muted"
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
