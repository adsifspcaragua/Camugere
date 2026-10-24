import { badRequest } from "../lib/httpError.js";

export function formatZodError(error) {
  return error.issues.map((issue) => {
    const campo = issue.path.join(".");
    return campo ? `${campo}: ${issue.message}` : issue.message;
  });
}

// Valida req.body com um schema Zod e substitui pelo resultado já normalizado.
export const validateBody = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    const detalhes = formatZodError(result.error);
    return next(badRequest(`Dados inválidos: ${detalhes.join("; ")}`, detalhes));
  }
  req.body = result.data;
  next();
};
