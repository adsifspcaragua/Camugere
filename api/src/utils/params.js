import { badRequest } from "../lib/httpError.js";

export function parseId(value, name = "id") {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw badRequest(`Parâmetro "${name}" inválido.`);
  return id;
}
