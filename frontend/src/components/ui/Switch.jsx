/** Interruptor liga/desliga acessível (role="switch"). */
export default function Switch({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-14 shrink-0 rounded-full border-2 transition-colors disabled:opacity-60 ${checked ? "border-forest bg-forest" : "border-field bg-sunken"}`}
    >
      <span className={`absolute top-0.5 size-6 rounded-full shadow transition-all ${checked ? "left-[26px] bg-on-forest" : "left-0.5 bg-ink-muted"}`} />
    </button>
  );
}
