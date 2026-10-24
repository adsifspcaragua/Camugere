export function Panel({ className = "", children, ...props }) {
  return (
    <section className={`rounded-xl border border-line/80 bg-panel shadow-[0_1px_0_rgb(0_0_0/0.02)] ${className}`} {...props}>
      {children}
    </section>
  );
}

export function PanelHeader({ title, description, actions }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
      <div>
        <h2 className="font-display text-[17px] font-medium text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
