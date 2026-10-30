import { useId } from "react";

const control =
  "w-full rounded-md border-[1.5px] border-field bg-panel px-4 text-base text-ink placeholder:text-ink-muted transition-colors hover:border-ink-soft focus:border-forest focus:ring-2 focus:ring-forest/20 disabled:opacity-60 aria-[invalid=true]:border-danger";

export const inputClass = `${control} h-[52px]`;

/** Rótulo + controle + dica/erro. Passa o id gerado para o filho via render prop. */
export function Field({ label, hint, error, optional, className = "", children }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 flex items-baseline justify-between text-sm font-semibold text-ink">
        {label}
        {optional && <span className="text-xs font-medium text-ink-muted">opcional</span>}
      </label>
      {children(id)}
      {(error || hint) && <p className={`mt-2 text-xs ${error ? "font-semibold text-danger" : "text-ink-muted"}`}>{error || hint}</p>}
    </div>
  );
}

export function TextField({ label, hint, error, optional, className, ...props }) {
  return (
    <Field label={label} hint={hint} error={error} optional={optional} className={className}>
      {(id) => <input id={id} className={inputClass} aria-invalid={Boolean(error)} autoComplete="off" {...props} />}
    </Field>
  );
}

export function TextArea({ label, hint, optional, className, ...props }) {
  return (
    <Field label={label} hint={hint} optional={optional} className={className}>
      {(id) => <textarea id={id} className={`${control} min-h-28 py-3 leading-relaxed scrollbar-thin`} autoComplete="off" {...props} />}
    </Field>
  );
}
