export default function Spinner({ label = "Carregando" }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-20 text-sm text-ink-muted">
      <span className="size-4 animate-spin rounded-full border-2 border-line-strong border-t-forest" aria-hidden />
      {label}…
    </div>
  );
}
