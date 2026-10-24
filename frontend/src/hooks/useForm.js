import { useCallback, useState } from "react";

/**
 * Estado de formulário simples: `field("nome")` devolve { value, onChange } para o input.
 * `dirty` indica se algo mudou desde a abertura (usado para não perder o que foi digitado).
 */
export function useForm(initial) {
  const [initialJson] = useState(() => JSON.stringify(initial));
  const [values, setValues] = useState(initial);

  const set = useCallback((patch) => setValues((v) => ({ ...v, ...patch })), []);
  const field = (name, transform = (x) => x) => ({
    name,
    value: values[name] ?? "",
    onChange: (e) => set({ [name]: transform(e.target.value) }),
  });

  const dirty = JSON.stringify(values) !== initialJson;
  return { values, set, field, dirty };
}
