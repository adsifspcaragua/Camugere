import { HttpError } from "../lib/httpError.js";

const PRISMA_ERRORS = {
  P2002: [409, "Já existe um registro com esses dados únicos."],
  P2003: [409, "Operação viola um relacionamento existente."],
  P2025: [404, "Registro não encontrado."],
};

export function notFoundHandler(req, res) {
  res.status(404).json({ message: `Rota ${req.method} ${req.originalUrl} não encontrada.` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(error, _req, res, _next) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message, details: error.details });
  }

  const prismaError = PRISMA_ERRORS[error?.code];
  if (prismaError) {
    const [status, message] = prismaError;
    return res.status(status).json({ message });
  }

  if (error?.type === "entity.parse.failed") {
    return res.status(400).json({ message: "JSON inválido no corpo da requisição." });
  }

  console.error(error);
  return res.status(500).json({ message: "Erro interno do servidor." });
}
