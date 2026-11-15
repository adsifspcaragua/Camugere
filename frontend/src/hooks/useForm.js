import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Estado de formulário com validação.
 * - `field("nome")` devolve { value, onChange, onBlur, error } para o input;
 * - `validate(fn)` roda o validador, guarda os erros, e devolve true se estiver tudo certo;
 * - erros aparecem ao sair do campo (blur) ou ao tentar enviar, e somem quando a pessoa corrige;
 * - `applyServerErrors` mostra no campo certo o que a API recusou.
 * `dirty` indica se algo mudou desde a abertura (usado para não perder o que foi digitado).
 */
export function useForm(initial, validator) {
  const [initialJson] = useState(() => JSON.stringify(initial));
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const validatorRef = useRef(validator);
  const valuesRef = useRef(values);
  // Os handlers leem sempre o valor mais recente sem precisar ser recriados.
  useEffect(() => {
    validatorRef.current = validator;
    valuesRef.current = values;
  });

  const clearError = useCallback((names) => {
    setErrors((e) => {
      const keys = names.filter((k) => k in e);
      if (!keys.length) return e;
      const next = { ...e };
      keys.forEach((k) => delete next[k]);
      return next;
    });
  }, []);

  const set = useCallback(
    (patch) => {
      setValues((v) => ({ ...v, ...patch }));
      clearError(Object.keys(patch));
    },
    [clearError],
  );

  const setError = useCallback((patch) => setErrors((e) => ({ ...e, ...patch })), []);

  // Valida um campo só quando a pessoa sai dele, sem gritar erro enquanto ainda está digitando.
  const onBlurValidate = (name) => () => {
    const all = validatorRef.current?.(valuesRef.current) ?? {};
    setErrors((e) => {
      const next = { ...e };
      if (all[name]) next[name] = all[name];
      else delete next[name];
      return next;
    });
  };

  const field = (name, transform = (x) => x) => ({
    name,
    value: values[name] ?? "",
    onChange: (e) => set({ [name]: transform(e.target.value) }),
    onBlur: onBlurValidate(name),
    error: errors[name],
  });

  /** Valida tudo; mostra os erros e devolve se está válido. */
  const validate = (fn = validatorRef.current, ...extra) => {
    const found = fn ? fn(valuesRef.current, ...extra) : {};
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  /** Mostra erros devolvidos pela API nos campos correspondentes. Devolve true se algum casou. */
  const applyServerErrors = (fieldErrors) => {
    const keys = Object.keys(fieldErrors ?? {});
    if (keys.length) setErrors((e) => ({ ...e, ...fieldErrors }));
    return keys.length > 0;
  };

  const dirty = JSON.stringify(values) !== initialJson;
  return { values, set, field, dirty, errors, setError, validate, applyServerErrors };
}
