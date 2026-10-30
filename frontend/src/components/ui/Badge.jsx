const TONES = {
  ok: "bg-ok-soft text-ok border-ok/30",
  warn: "bg-warn-soft text-warn border-warn/30",
  danger: "bg-danger-soft text-danger border-danger/30",
  neutral: "bg-sunken text-ink-soft border-line-strong",
  forest: "bg-forest-soft text-forest border-forest/30",
};

export default function Badge({ tone = "neutral", dot = true, children, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${TONES[tone]} ${className}`}>
      {dot && <span className="size-2.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}
