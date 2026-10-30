export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-2 text-xs font-semibold tracking-[0.1em] text-clay uppercase">{eyebrow}</p>}
        <h1 className="font-display text-2xl font-bold tracking-[-0.01em] text-ink sm:text-3xl sm:tracking-[-0.02em]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-base text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}
