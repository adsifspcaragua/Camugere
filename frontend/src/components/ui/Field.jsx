import { useId } from "react";

const control =
  "w-full rounded-md border border-line-strong bg-panel px-3 text-sm text-ink placeholder:text-ink-muted transition-colors focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15 disabled:opacity-60";

export const inputClass = `${control} h-10`;

/** Rótulo + controle + dica/erro. Passa o id gerado para o filho via render prop. */
export function Field({ label, hint, error, optional, className = "", children }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-[13px] font-medium text-ink-soft">
        {label}
        {optional && <span className="text-xs font-normal text-ink-muted">opcional</span>}
      </label>
      {children(id)}
      {(error || hint) && <p className={`mt-1.5 text-xs ${error ? "text-danger" : "text-ink-muted"}`}>{error || hint}</p>}
    </div>
  );
}

export function TextField({ label, hint, error, optional, className, ...props }) {
  return (
    <Field label={label} hint={hint} error={error} optional={optional} className={className}>
      {(id) => <input id={id} className={inputClass} aria-invalid={Boolean(error)} {...props} />}
    </Field>
  );
}

export function TextArea({ label, hint, optional, className, ...props }) {
  return (
    <Field label={label} hint={hint} optional={optional} className={className}>
      {(id) => <textarea id={id} className={`${control} min-h-24 py-2.5 leading-relaxed scrollbar-thin`} {...props} />}
    </Field>
  );
}
