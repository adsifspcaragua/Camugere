import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { unauthorized } from "../lib/httpError.js";

export function extractToken(req) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return req.headers.jwt_token; // compatibilidade com clientes antigos
}

export async function authMiddleware(req, _res, next) {
  const token = extractToken(req);
  if (!token) return next(unauthorized("Token de autenticação não informado."));

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    return next(unauthorized("Token inválido ou expirado."));
  }

  // Assinatura válida não basta: o usuário pode ter sido removido ou perdido o perfil
  // de bibliotecário depois que o token foi emitido.
  if (!Number.isInteger(payload?.id) || !Number.isInteger(payload?.id_bibliotecario)) {
    return next(unauthorized("Token inválido ou expirado."));
  }

  try {
    const ativo = await prisma.bibliotecario.findFirst({
      where: { id: payload.id_bibliotecario, id_usuario: payload.id },
      select: { id: true },
    });
    if (!ativo) return next(unauthorized("Acesso revogado. Faça login novamente."));
  } catch (error) {
    return next(error);
  }

  req.auth = payload;
  next();
}
