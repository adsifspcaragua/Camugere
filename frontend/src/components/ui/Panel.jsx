export function Panel({ className = "", children, ...props }) {
  return (
    <section className={`rounded-lg border-[1.5px] border-line bg-panel shadow-card ${className}`} {...props}>
      {children}
    </section>
  );
}

export function PanelHeader({ title, description, actions }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-5">
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        {description && <p className="mt-1 text-xs text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
